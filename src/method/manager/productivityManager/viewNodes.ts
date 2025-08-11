import { viewNodes } from "../../access/nodeAccess";

// node_type removed from params
type ViewNodesParams = {
  user_id: string;
  parent_node?: number | null;
};

export async function viewNodesManager(params: ViewNodesParams) {
  return await viewNodes(params);
}
