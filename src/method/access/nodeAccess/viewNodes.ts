import { getOfflineStore } from "@/lib/offline";
import { buildNodeViews } from "@/lib/local-node-view";
import type { Node } from "./models";

type ViewNodesParams = { userId: string; parentNodeId?: number | null };
type ViewNodesResult = { result: Node[] } | { error: unknown };

export async function viewNodes(params: ViewNodesParams): Promise<ViewNodesResult> {
  try {
    const store = await getOfflineStore(params.userId);
    const [nodes, relationships] = await Promise.all([
      store.nodes(),
      store.relationships(),
    ]);
    return {
      result: buildNodeViews(nodes, relationships, params.userId, params.parentNodeId),
    };
  } catch (error) {
    return { error };
  }
}
