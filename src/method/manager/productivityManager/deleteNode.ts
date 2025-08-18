import { deleteNode } from "../../access/nodeAccess";

type DeleteNodeParams = {
  nodeId: number;
  userId: string;
};

export async function deleteNodeManager(params: DeleteNodeParams) {
  return await deleteNode(params);
}
