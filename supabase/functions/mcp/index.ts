import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  createMcpHandler,
  McpServer,
} from "npm:@modelcontextprotocol/server@^2.0.0";
import { pipeline } from "npm:@supabase/middleware@1";
import {
  withOAuthProtectedResource,
  withSupabase,
} from "npm:@supabase/server@^1.6.0";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2.116.0";
import { z } from "npm:zod@^4.3.6";
import { legacyPublishableKeyOverride } from "./publishable-key.ts";

const MAX_PAGE_SIZE = 50;
const MAX_CONTENT_LENGTH = 5_000;

type NodeRow = {
  id: number;
  name: string;
  content: string | null;
  parent_node: number | null;
  user_id: string | null;
  created_at: string;
  metadata: unknown;
};

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toPublicItem(row: NodeRow) {
  return {
    id: row.id,
    name: row.name.slice(0, 200),
    name_truncated: row.name.length > 200,
    content: row.content?.slice(0, MAX_CONTENT_LENGTH) ?? null,
    content_truncated: (row.content?.length ?? 0) > MAX_CONTENT_LENGTH,
    parent_node: row.parent_node,
    created_at: row.created_at,
  };
}

async function getInboxId(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data: settingsRow, error: settingsError } = await supabase
    .from("settings")
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle();

  if (settingsError) throw new Error("Could not read inbox settings");
  const settings = isJsonObject(settingsRow?.settings)
    ? settingsRow.settings
    : null;
  const rawInboxId = settings?.inbox;
  const inboxId = typeof rawInboxId === "number"
    ? rawInboxId
    : typeof rawInboxId === "string" && /^\d+$/.test(rawInboxId)
    ? Number(rawInboxId)
    : NaN;

  if (!Number.isSafeInteger(inboxId) || inboxId <= 0) {
    throw new Error("Your Inbox is not configured");
  }

  // Settings are user-scoped, but verify the referenced node belongs to the same user.
  const { data: inboxNode, error: inboxError } = await supabase
    .from("node")
    .select("id")
    .eq("id", inboxId)
    .eq("user_id", userId)
    .maybeSingle();

  if (inboxError) throw new Error("Could not verify your Inbox");
  if (!inboxNode) throw new Error("Your Inbox is not configured");
  return inboxId;
}

async function getAuthenticatedUser(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Authentication required");
  return data.user.id;
}

Deno.serve(
  pipeline(
    [
      withOAuthProtectedResource(),
      withSupabase({
        auth: "user",
        env: legacyPublishableKeyOverride({
          SUPABASE_PUBLISHABLE_KEY: Deno.env.get("SUPABASE_PUBLISHABLE_KEY"),
          SUPABASE_PUBLISHABLE_KEYS: Deno.env.get("SUPABASE_PUBLISHABLE_KEYS"),
          SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY"),
        }),
      }),
    ],
    async (request, { supabase }) => {
      // Authenticate before creating tools so all tool closures are bound to this caller.
      let userId: string;
      try {
        userId = await getAuthenticatedUser(supabase);
      } catch {
        return new Response("Authentication required", { status: 401 });
      }

      const handler = createMcpHandler(() => {
        const server = new McpServer({ name: "lists", version: "0.1.0" });

        server.registerTool(
          "list_inbox_items",
          {
            title: "List Inbox items",
            description:
              "List items in the signed-in user's Inbox, newest first.",
            inputSchema: z.object({
              limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
              offset: z.number().int().min(0).max(10_000).default(0),
            }),
            annotations: { readOnlyHint: true },
          },
          async ({ limit, offset }) => {
            const inboxId = await getInboxId(supabase, userId);
            const { data, error } = await supabase
              .from("node")
              .select("id,name,content,parent_node,user_id,created_at,metadata")
              .eq("user_id", userId)
              .eq("parent_node", inboxId)
              .order("created_at", { ascending: false })
              .range(offset, offset + limit - 1);

            if (error) throw new Error("Could not list Inbox items");
            return {
              content: [{
                type: "text",
                text: JSON.stringify((data ?? []).map(toPublicItem)),
              }],
            };
          },
        );

        server.registerTool(
          "get_item",
          {
            title: "Get an item",
            description:
              "Get one item owned by the signed-in user by its numeric ID.",
            inputSchema: z.object({
              id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
            }),
            annotations: { readOnlyHint: true },
          },
          async ({ id }) => {
            const { data, error } = await supabase
              .from("node")
              .select("id,name,content,parent_node,user_id,created_at,metadata")
              .eq("id", id)
              .eq("user_id", userId)
              .maybeSingle();

            if (error) throw new Error("Could not read item");
            if (!data) throw new Error("Item not found");
            return {
              content: [{
                type: "text",
                text: JSON.stringify(toPublicItem(data)),
              }],
            };
          },
        );

        server.registerTool(
          "search_items",
          {
            title: "Search items",
            description:
              "Search the signed-in user's item names and content, newest first. Page through the first 950 matches; refine the query for older matches.",
            inputSchema: z.object({
              query: z.string().trim().min(1).max(100),
              limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
              offset: z.number().int().min(0).max(900).default(0),
            }),
            annotations: { readOnlyHint: true },
          },
          async ({ query, limit, offset }) => {
            // Separate parameterized filters avoid interpolating user text into PostgREST .or syntax.
            const pattern = `%${query}%`;
            const fetchLimit = offset + limit + 1;
            const [names, contents] = await Promise.all([
              supabase.from("node")
                .select(
                  "id,name,content,parent_node,user_id,created_at,metadata",
                )
                .eq("user_id", userId)
                .ilike("name", pattern)
                .order("created_at", { ascending: false })
                .limit(fetchLimit),
              supabase.from("node")
                .select(
                  "id,name,content,parent_node,user_id,created_at,metadata",
                )
                .eq("user_id", userId)
                .ilike("content", pattern)
                .order("created_at", { ascending: false })
                .limit(fetchLimit),
            ]);

            if (names.error || contents.error) {
              throw new Error("Could not search items");
            }
            const byId = new Map<number, NodeRow>();
            for (
              const row of [
                ...(names.data ?? []),
                ...(contents.data ?? []),
              ] as NodeRow[]
            ) {
              byId.set(row.id, row);
            }
            const matches = [...byId.values()]
              .sort((a, b) =>
                b.created_at.localeCompare(a.created_at) || b.id - a.id
              );
            const result = matches.slice(offset, offset + limit).map(
              toPublicItem,
            );
            const nextOffset =
              matches.length > offset + limit && offset + limit <= 900
                ? offset + limit
                : null;

            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  items: result,
                  next_offset: nextOffset,
                  more_results_possible: matches.length > offset + limit,
                }),
              }],
            };
          },
        );

        server.registerTool(
          "create_inbox_item",
          {
            title: "Create Inbox item",
            description: "Create a new item in the signed-in user's Inbox.",
            inputSchema: z.object({
              title: z.string().trim().min(1).max(200),
              content: z.string().max(MAX_CONTENT_LENGTH).optional(),
            }),
          },
          async ({ title, content }) => {
            const inboxId = await getInboxId(supabase, userId);
            const { data: inboxNode, error: inboxError } = await supabase
              .from("node")
              .select("metadata")
              .eq("id", inboxId)
              .eq("user_id", userId)
              .single();

            if (inboxError || !inboxNode) {
              throw new Error("Could not read Inbox defaults");
            }

            const inboxMetadata = isJsonObject(inboxNode.metadata)
              ? inboxNode.metadata
              : {};
            const defaultMetadata =
              isJsonObject(inboxMetadata.defaultChildrenMetadata)
                ? inboxMetadata.defaultChildrenMetadata
                : { type: "loop" };
            const metadata = {
              ...defaultMetadata,
              // Match app and Telegram capture behavior so future children keep the same defaults.
              defaultChildrenMetadata: defaultMetadata,
            };

            const { data, error } = await supabase
              .from("node")
              .insert({
                name: title,
                content: content?.trim() || null,
                parent_node: inboxId,
                user_id: userId,
                metadata,
              })
              .select("id,name,content,parent_node,user_id,created_at,metadata")
              .single();

            if (error || !data) throw new Error("Could not create Inbox item");
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  created: true,
                  item: toPublicItem(data),
                }),
              }],
            };
          },
        );

        return server;
      });

      return handler.fetch(request);
    },
  ),
);
