import { getOfflineStore } from "@/lib/offline";

type CreateRelationshipParams = { nodeId1: number; nodeId2: number; relationType: string; userId: string };
type CreateRelationshipResult = { result: { success: true; id: number } } | { error: unknown };

export async function createRelationship(params: CreateRelationshipParams): Promise<CreateRelationshipResult> {
  try {
    const store = await getOfflineStore(params.userId);
    const nodes = await store.nodes();
    if (!nodes.some((node) => node.id === params.nodeId1 && node.user_id === params.userId)
      || !nodes.some((node) => node.id === params.nodeId2 && node.user_id === params.userId)) {
      return { error: "Related node not found" };
    }
    const id = store.newId();
    await store.upsertRelationship({ id, created_at: new Date().toISOString(),
      node_id_1: params.nodeId1, node_id_2: params.nodeId2,
      relation_type: params.relationType, user_id: params.userId });
    return { result: { success: true, id } };
  } catch (error) { return { error }; }
}
