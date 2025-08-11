import { updateNode } from "../../access/nodeAccess";

type UpdateNodeParams = {
  node_id: number;
  name?: string;
  content?: string;
  parent_node?: number | null;
  user_id: string;
  order?: number | null;
};

export async function updateNodeManager(params: UpdateNodeParams) {
  return await updateNode(params);
}
