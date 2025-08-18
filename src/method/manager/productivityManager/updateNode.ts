import { Metadata } from "@/method/access/nodeAccess/models";
import { updateNode } from "../../access/nodeAccess";

type UpdateNodeParams = {
  nodeId: number;
  name?: string;
  content?: string;
  parentNode?: number | null;
  userId: string;
  metadata?: Metadata;
};

export async function updateNodeManager(params: UpdateNodeParams) {
  return await updateNode(params);
}
