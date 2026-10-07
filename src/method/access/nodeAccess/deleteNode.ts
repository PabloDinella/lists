import { getOfflineStore } from "@/lib/offline";

type DeleteNodeParams = { nodeId: number; userId: string };
type DeleteNodeResult = { result: { success: true } } | { error: unknown };

export async function deleteNode(params: DeleteNodeParams): Promise<DeleteNodeResult> {
  try {
    const store = await getOfflineStore(params.userId);
    await store.deleteNode(params.nodeId);
    return { result: { success: true } };
  } catch (error) { return { error }; }
}
