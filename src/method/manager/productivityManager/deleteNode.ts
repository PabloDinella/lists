import { deleteNode } from "../../access/nodeAccess";

type DeleteNodeParams = {
  node_id: number;
  user_id: string;
};

export async function deleteNodeManager(params: DeleteNodeParams) {
  return await deleteNode(params);
}
