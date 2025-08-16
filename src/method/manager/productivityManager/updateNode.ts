import { updateNode } from "../../access/nodeAccess";
import type { Json } from "@/database.types";

type UpdateNodeParams = {
  node_id: number;
  name?: string;
  content?: string;
  parent_node?: number | null;
  user_id: string;
  order?: number | null;
  metadata?: Json;
};

export async function updateNodeManager(params: UpdateNodeParams) {
  return await updateNode(params);
}
