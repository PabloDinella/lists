import { getOfflineStore } from "@/lib/offline";

type DeleteRelationshipsParams = { nodeId: number; userId: string; relationType?: string };
type DeleteRelationshipsResult = { result: { success: true } } | { error: unknown };

export async function deleteRelationships(params: DeleteRelationshipsParams): Promise<DeleteRelationshipsResult> {
  try {
    const store = await getOfflineStore(params.userId);
    const relationships = await store.relationships();
    for (const relationship of relationships) {
      const attached = params.relationType === "tagged_with"
        ? relationship.node_id_1 === params.nodeId
        : relationship.node_id_1 === params.nodeId || relationship.node_id_2 === params.nodeId;
      const matchesType = params.relationType === undefined || relationship.relation_type === params.relationType;
      if (attached && matchesType && relationship.user_id === params.userId) {
        await store.deleteRelationship(relationship.id);
      }
    }
    return { result: { success: true } };
  } catch (error) { return { error }; }
}
