import { Metadata } from "@/method/access/nodeAccess/models";
import { createNode } from "../../access/nodeAccess";

type CreateNodeParams = {
  name: string;
  content?: string;
  parentNode?: number;
  userId: string;
  metadata?: Metadata;
};

export async function createNodeManager(params: CreateNodeParams) {
  return await createNode(params);
}
