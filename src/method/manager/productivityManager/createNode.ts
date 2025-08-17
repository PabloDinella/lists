import { createNode, type Metadata } from "../../access/nodeAccess";

type CreateNodeParams = {
  name: string;
  content?: string;
  parent_node?: number;
  user_id: string;
  metadata?: Metadata;
};

export async function createNodeManager(params: CreateNodeParams) {
  return await createNode(params);
}
