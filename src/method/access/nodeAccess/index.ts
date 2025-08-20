import { createNode } from "./createNode";
import { viewNodes } from "./viewNodes";
import { updateNode } from "./updateNode";
import { deleteNode } from "./deleteNode";
import { createRelationship } from "./createRelationship";
import { deleteRelationships } from "./deleteRelationships";

export { createNode, viewNodes, updateNode, deleteNode, createRelationship, deleteRelationships };

export const nodeAccess = {
  createNode,
  viewNodes,
  updateNode,
  deleteNode,
  createRelationship,
  deleteRelationships,
};
