import { Metadata } from "@/method/access/nodeAccess/models";
import { addUpdateNode } from "../../access/nodeAccess";

type AddUpdateNodeParams = {
  nodeId?: number; // If provided, updates existing node; if not, creates new node
  name: string;
  content?: string;
  parentNode?: number | null;
  userId: string;
  metadata?: Metadata;
  relatedNodeIds?: number[];
  relationType?: string;
};

export async function addUpdateNodeManager(params: AddUpdateNodeParams) {
  return await addUpdateNode(params);
}
