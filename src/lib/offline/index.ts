import { addRxPlugin, createRxDatabase, type RxCollection, type RxDatabase } from "rxdb";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import type { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase";

addRxPlugin(RxDBQueryBuilderPlugin);

export type NodeRow = Tables<"node">;
export type RelationshipRow = Tables<"relationship">;
export type SettingsRow = Tables<"settings">;
type Entity = "node" | "relationship" | "settings";
type Action = "upsert" | "delete";

type Stored<T> = { id: string; payload: T };
type OutboxEntry = {
  id: string;
  op_id: string;
  entity: Entity;
  entity_id: number;
  action: Action;
  payload: Record<string, unknown>;
  created_at: number;
};
type ChangeRow = {
  change_id: string;
  entity: Entity;
  entity_id: number;
  action: Action;
  payload: Record<string, unknown> | null;
};
type OfflineQueryResult = { data: unknown; error: { message: string } | null };
interface OfflineQueryBuilder extends PromiseLike<OfflineQueryResult> {
  select(columns: string): OfflineQueryBuilder;
  eq(column: string, value: unknown): OfflineQueryBuilder;
  gt(column: string, value: unknown): OfflineQueryBuilder;
  order(column: string, options: { ascending: boolean }): OfflineQueryBuilder;
  limit(count: number): OfflineQueryBuilder;
}
interface OfflineRealtimeChannel {
  on(event: "postgres_changes", filter: Record<string, string>, callback: () => void): OfflineRealtimeChannel;
  subscribe(): unknown;
}
interface OfflineSupabase {
  from(table: string): OfflineQueryBuilder;
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>;
  channel(name: string): OfflineRealtimeChannel;
}

type Collections = {
  nodes: RxCollection<Stored<NodeRow>>;
  relationships: RxCollection<Stored<RelationshipRow>>;
  settings: RxCollection<Stored<SettingsRow>>;
  outbox: RxCollection<OutboxEntry>;
  meta: RxCollection<{ id: string; value: string }>;
};
type OfflineDatabase = RxDatabase<Collections>;

export type OfflineStore = {
  /** Resolves after the first successful initial pull, or after its first failed attempt. */
  ready: Promise<void>;
  nodes(): Promise<NodeRow[]>;
  relationships(): Promise<RelationshipRow[]>;
  settings(): Promise<SettingsRow[]>;
  upsertNode(row: NodeRow): Promise<void>;
  deleteNode(id: number): Promise<void>;
  upsertRelationship(row: RelationshipRow): Promise<void>;
  deleteRelationship(id: number): Promise<void>;
  upsertSettings(row: SettingsRow): Promise<void>;
  deleteSettings(id: number): Promise<void>;
  subscribe(callback: () => void): () => void;
  syncNow(): Promise<void>;
  status(): { pending: number; error: string | null; initialSyncComplete: boolean };
  newId(): number;
};

const PAGE_SIZE = 500;
const POLL_INTERVAL_MS = 30_000;
const liveStores = new Map<string, Promise<OfflineStore>>();

const docSchema = (title: string) => ({
  title,
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 128 },
    payload: { type: "object", additionalProperties: true },
  },
  required: ["id", "payload"],
  additionalProperties: false,
} as const);

const outboxSchema = {
  title: "offline outbox",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 128 },
    op_id: { type: "string", maxLength: 64 },
    entity: { type: "string", enum: ["node", "relationship", "settings"] },
    entity_id: { type: "integer" },
    action: { type: "string", enum: ["upsert", "delete"] },
    payload: { type: "object", additionalProperties: true },
    created_at: { type: "number" },
  },
  required: ["id", "op_id", "entity", "entity_id", "action", "payload", "created_at"],
  additionalProperties: false,
} as const;

const metaSchema = {
  title: "offline sync metadata",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: { id: { type: "string", maxLength: 128 }, value: { type: "string" } },
  required: ["id", "value"],
  additionalProperties: false,
} as const;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function randomLocalNumericId(): number {
  // Keep the value inside JavaScript's exact integer range while reserving negatives
  // for rows created before the server has seen them.
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const words = crypto.getRandomValues(new Uint32Array(2));
    const value = (words[0] & 0x000fffff) * 0x1_0000_0000 + words[1];
    return -(value + 1);
  }
  return -(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1);
}

function rowId(row: { id: number }): string {
  return String(row.id);
}

async function createStore(userId: string): Promise<OfflineStore> {
  const database = await createRxDatabase<Collections>({
    name: `lists-offline-${encodeURIComponent(userId).replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    storage: getRxStorageDexie(),
    multiInstance: true,
    eventReduce: true,
  });
  await database.addCollections({
    nodes: { schema: docSchema("offline nodes") },
    relationships: { schema: docSchema("offline relationships") },
    settings: { schema: docSchema("offline settings") },
    outbox: { schema: outboxSchema },
    meta: { schema: metaSchema },
  });
  const collections = database as OfflineDatabase;
  let lastError: string | null = null;
  let initialSyncComplete = false;
  let pendingCount = await collections.outbox.count().exec();
  const recoveredOps = await collections.outbox.find().sort({ created_at: "desc" }).limit(1).exec();
  let lastOperationTime = recoveredOps[0]?.created_at ?? 0;
  const listeners = new Set<() => void>();
  let syncPromise: Promise<void> | null = null;
  let syncRequestedWhileRunning = false;
  let localWriteTail: Promise<void> = Promise.resolve();
  const serializeLocalWrite = (write: () => Promise<void>): Promise<void> => {
    const next = localWriteTail.then(write, write);
    localWriteTail = next.catch(() => undefined);
    return next;
  };
  const emit = () => {
    for (const listener of listeners) listener();
  };
  collections.nodes.$.subscribe(() => emit());
  collections.relationships.$.subscribe(() => emit());
  collections.settings.$.subscribe(() => emit());
  collections.outbox.$.subscribe(() => emit());
  collections.outbox.$.subscribe(() => {
    void collections.outbox.count().exec().then((count) => { pendingCount = count; emit(); });
  });

  const fetchRows = async <T>(collection: RxCollection<Stored<T>>): Promise<T[]> =>
    (await collection.find().exec()).map((doc) => doc.payload);
  const reservedIds = new Set<number>();
  const [cachedNodes, cachedRelationships, cachedSettings] = await Promise.all([
    fetchRows(collections.nodes), fetchRows(collections.relationships), fetchRows(collections.settings),
  ]);
  for (const row of [...cachedNodes, ...cachedRelationships, ...cachedSettings]) reservedIds.add(row.id);
  const getCollection = (entity: Entity) =>
    entity === "node" ? collections.nodes : entity === "relationship" ? collections.relationships : collections.settings;

  const putLocal = async (entity: Entity, row: NodeRow | RelationshipRow | SettingsRow) => {
    reservedIds.add(row.id);
    await getCollection(entity).upsert({ id: rowId(row), payload: row } as never);
  };
  const removeLocal = async (entity: Entity, id: number) => {
    const doc = await getCollection(entity).findOne(String(id)).exec();
    if (doc) await doc.remove();
  };

  // An interrupted write may have persisted its outbox record before updating the
  // materialized local row. Replay the durable log before exposing cached data.
  const queuedAtOpen = await collections.outbox.find().sort({ created_at: "asc" }).exec();
  for (const operation of queuedAtOpen) {
    if (operation.action === "delete") {
      await removeLocal(operation.entity, operation.entity_id);
    } else {
      await putLocal(operation.entity, operation.payload as unknown as NodeRow | RelationshipRow | SettingsRow);
    }
  }
  const hasPending = async (entity: Entity, id: number) =>
    Boolean(await collections.outbox.findOne({ selector: { entity, entity_id: id } }).exec());

  const applyChange = (change: ChangeRow) => serializeLocalWrite(async () => {
    if (await hasPending(change.entity, change.entity_id)) return;
    if (change.action === "delete") {
      await removeLocal(change.entity, change.entity_id);
    } else if (change.payload) {
      await putLocal(change.entity, change.payload as unknown as NodeRow | RelationshipRow | SettingsRow);
    }
  });

  const readCursor = async (): Promise<string | null> =>
    (await collections.meta.findOne("change_cursor").exec())?.value ?? null;
  const writeCursor = async (cursor: string) => {
    await collections.meta.upsert({ id: "change_cursor", value: cursor });
  };

  const pullChanges = async () => {
    let cursor = await readCursor();
    while (true) {
      let query = (supabase as unknown as OfflineSupabase)
        .from("offline_change")
        .select("change_id,entity,entity_id,action,payload")
        .eq("user_id", userId)
        .order("change_id", { ascending: true })
        .limit(PAGE_SIZE);
      if (cursor !== null) query = query.gt("change_id", cursor);
      const { data, error } = await query;
      if (error) throw error;
      const page = (data ?? []) as ChangeRow[];
      for (const change of page) {
        await applyChange(change);
        cursor = String(change.change_id);
        await writeCursor(cursor);
      }
      if (page.length < PAGE_SIZE) break;
    }
  };

  const pushPending = async () => {
    const entries = await collections.outbox.find().sort({ created_at: "asc" }).exec();
    for (const entry of entries) {
      const { error } = await (supabase as unknown as OfflineSupabase).rpc("offline_apply", {
        op_id: entry.op_id,
        entity: entry.entity,
        action: entry.action,
        payload: entry.payload,
      });
      if (error) throw error;
      await entry.remove();
      pendingCount = Math.max(0, pendingCount - 1);
    }
  };

  const doSync = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id !== userId) {
        throw new Error("Sign in to this account to sync its pending changes.");
      }
      await pushPending();
      await pullChanges();
      initialSyncComplete = true;
      lastError = null;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      emit();
    }
  };

  const syncNow = () => {
    if (syncPromise) {
      syncRequestedWhileRunning = true;
      return syncPromise;
    }
    const runSync = async () => {
      if (typeof navigator !== "undefined" && "locks" in navigator) {
        await navigator.locks.request(`lists-offline-sync-${userId}`, doSync);
      } else {
        await doSync();
      }
    };
    syncPromise = runSync().finally(() => {
      syncPromise = null;
      if (syncRequestedWhileRunning) {
        syncRequestedWhileRunning = false;
        void syncNow().catch(() => undefined);
      }
    });
    return syncPromise;
  };

  const commit = (entity: Entity, action: Action, id: number, payload: Record<string, unknown>) => serializeLocalWrite(async () => {
    lastOperationTime = Math.max(Date.now(), lastOperationTime + 1);
    const operation: OutboxEntry = {
      id: makeId(), op_id: makeId(), entity, entity_id: id, action,
      payload: action === "delete" ? { id, user_id: userId } : payload,
      created_at: lastOperationTime,
    };
    // Persist the retry record first so a crash can never lose an acknowledged local mutation.
    await collections.outbox.insert(operation);
    pendingCount += 1;
    if (action === "upsert") await putLocal(entity, payload as unknown as NodeRow | RelationshipRow | SettingsRow);
    else await removeLocal(entity, id);
    emit();
    void syncNow().catch(() => undefined);
  });

  const deleteNode = async (id: number) => {
    const allNodes = await fetchRows(collections.nodes);
    const removed = new Set<number>([id]);
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (const node of allNodes) {
        if (node.parent_node !== null && removed.has(node.parent_node) && !removed.has(node.id)) {
          removed.add(node.id);
          expanded = true;
        }
      }
    }
    // Remove only incident links. A node reached through member_of is never traversed/deleted.
    const relationships = await fetchRows(collections.relationships);
    for (const relation of relationships) {
      if (removed.has(relation.node_id_1 ?? Number.NaN) || removed.has(relation.node_id_2 ?? Number.NaN)) {
        await commit("relationship", "delete", relation.id, {});
      }
    }
    for (const nodeId of removed) {
      const node = allNodes.find((row) => row.id === nodeId);
      if (node) await commit("node", "delete", nodeId, {});
    }
  };

  const ready = syncNow().catch(() => undefined);
  const timer = setInterval(() => { void syncNow().catch(() => undefined); }, POLL_INTERVAL_MS);
  const onOnline = () => { void syncNow().catch(() => undefined); };
  if (typeof window !== "undefined") window.addEventListener("online", onOnline);
  const realtime = (supabase as unknown as OfflineSupabase)
    .channel(`offline-change-${makeId()}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "offline_change",
      filter: `user_id=eq.${userId}`,
    }, () => { void syncNow().catch(() => undefined); })
    .subscribe();

  const store: OfflineStore = {
    ready,
    nodes: () => fetchRows(collections.nodes),
    relationships: () => fetchRows(collections.relationships),
    settings: () => fetchRows(collections.settings),
    upsertNode: (row) => commit("node", "upsert", row.id, row as unknown as Record<string, unknown>),
    deleteNode,
    upsertRelationship: (row) => commit("relationship", "upsert", row.id, row as unknown as Record<string, unknown>),
    deleteRelationship: (id) => commit("relationship", "delete", id, {}),
    upsertSettings: (row) => commit("settings", "upsert", row.id, row as unknown as Record<string, unknown>),
    deleteSettings: (id) => commit("settings", "delete", id, {}),
    subscribe: (callback) => { listeners.add(callback); return () => listeners.delete(callback); },
    syncNow,
    status: () => ({ pending: pendingCount, error: lastError, initialSyncComplete }),
    newId: () => {
      let id = randomLocalNumericId();
      while (reservedIds.has(id)) id = randomLocalNumericId();
      reservedIds.add(id);
      return id;
    },
  };

  // These long-lived handles intentionally stay active for the cached user store.
  void timer;
  void onOnline;
  void realtime;
  return store;
}

export async function getOfflineStore(userId: string): Promise<OfflineStore> {
  const existing = liveStores.get(userId);
  if (existing) return existing;
  const created = createStore(userId);
  liveStores.set(userId, created);
  try {
    return await created;
  } catch (error) {
    liveStores.delete(userId);
    throw error;
  }
}
