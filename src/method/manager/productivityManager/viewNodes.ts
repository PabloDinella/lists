import { viewNodes } from "../../access/nodeAccess";

type ViewNodesParams = {
  userId: string;
  parentNodeId?: number | null;
};

export async function viewNodesManager(params: ViewNodesParams) {
  return await viewNodes(params);
}
