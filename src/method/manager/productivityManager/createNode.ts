import { createNode } from "../../access/nodeAccess";
import type { Json } from "@/database.types";

type CreateNodeParams = {
  name: string;
  content?: string;
  parent_node?: number;
  user_id: string;
  order?: number;
  metadata?: Json;
};

export async function createNodeManager(params: CreateNodeParams) {
  return await createNode(params);
}
