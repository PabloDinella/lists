import { getOfflineStore } from "@/lib/offline";
import { Metadata, metadataSchema, Node } from "./models";
import { createRelationship } from "./createRelationship";

type CreateNodeParams = {
  name: string; content?: string; parentNode?: number; userId: string;
  metadata?: Metadata; relatedNodeIds?: number[]; relationType?: string;
};
type CreateNodeResult = { result: Node } | { error: unknown };

export async function createNode(params: CreateNodeParams): Promise<CreateNodeResult> {
  try {
    const store = await getOfflineStore(params.userId);
    let finalMetadata = params.metadata;
    if (!params.metadata && params.parentNode !== undefined) {
      const parent = (await store.nodes()).find((node) => node.id === params.parentNode && node.user_id === params.userId);
      const defaults = metadataSchema.safeParse(parent?.metadata).data?.defaultChildrenMetadata;
      if (defaults) finalMetadata = { ...defaults, defaultChildrenMetadata: defaults };
    }
    const row = {
      id: store.newId(), name: params.name, content: params.content || null,
      parent_node: params.parentNode ?? null, user_id: params.userId,
      created_at: new Date().toISOString(), metadata: finalMetadata ?? null,
    };
    await store.upsertNode(row);
    for (const relatedNodeId of params.relatedNodeIds ?? []) {
      const linked = await createRelationship({ nodeId1: row.id, nodeId2: relatedNodeId,
        relationType: params.relationType || "tagged_with", userId: params.userId });
      if ("error" in linked) return linked;
    }
    return { result: { ...row, metadata: metadataSchema.safeParse(row.metadata).data ?? null, related_nodes: [] } };
  } catch (error) { return { error }; }
}
