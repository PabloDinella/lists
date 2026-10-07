import { getOfflineStore } from "@/lib/offline";
import { Metadata, metadataSchema, Node } from "./models";
import { createRelationship } from "./createRelationship";
import { deleteRelationships } from "./deleteRelationships";
import { createNode } from "./createNode";

type AddUpdateNodeParams = {
  nodeId?: number; name: string; content?: string | null; parentNode?: number | null;
  userId: string; metadata?: Metadata; relatedNodeIds?: number[]; relationType?: string;
};
type AddUpdateNodeResult = { result: Node } | { error: unknown };

export async function addUpdateNode(params: AddUpdateNodeParams): Promise<AddUpdateNodeResult> {
  if (params.nodeId === undefined) {
    return createNode({ name: params.name, content: params.content ?? undefined,
      parentNode: params.parentNode ?? undefined, userId: params.userId, metadata: params.metadata,
      relatedNodeIds: params.relatedNodeIds, relationType: params.relationType });
  }

  try {
    const store = await getOfflineStore(params.userId);
    const current = (await store.nodes()).find((row) => row.id === params.nodeId && row.user_id === params.userId);
    if (!current) return { error: "No data returned" };
    const updated = {
      ...current, name: params.name,
      ...(params.content !== undefined ? { content: params.content } : {}),
      ...(params.parentNode !== undefined ? { parent_node: params.parentNode } : {}),
      ...(params.metadata !== undefined ? { metadata: params.metadata } : {}),
    };
    await store.upsertNode(updated);
    if (params.relatedNodeIds !== undefined) {
      const relationType = params.relationType || "tagged_with";
      const removed = await deleteRelationships({ nodeId: params.nodeId, userId: params.userId, relationType });
      if ("error" in removed) return removed;
      for (const relatedNodeId of params.relatedNodeIds) {
        const linked = await createRelationship({ nodeId1: params.nodeId, nodeId2: relatedNodeId, relationType, userId: params.userId });
        if ("error" in linked) return linked;
      }
    }
    return { result: { ...updated, user_id: params.userId, metadata: metadataSchema.safeParse(updated.metadata).data ?? null, related_nodes: [] } };
  } catch (error) { return { error }; }
}
