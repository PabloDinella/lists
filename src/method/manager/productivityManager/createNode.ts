import { createNode } from "../../access/nodeAccess";

type CreateNodeParams = {
  name: string;
  content?: string;
  parent_node?: number;
  user_id: string;
  order?: number;
};

export async function createNodeManager(params: CreateNodeParams) {
  return await createNode(params);
}
