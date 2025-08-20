import { createNode } from "./createNode";
import { viewNodes } from "./viewNodes";
import { updateNode } from "./updateNode";
import { deleteNode } from "./deleteNode";
import { createRelationship } from "./createRelationship";
import { deleteRelationships } from "./deleteRelationships";
import { addUpdateNode } from "./addUpdateNode";

export { createNode, viewNodes, updateNode, deleteNode, createRelationship, deleteRelationships, addUpdateNode };

export const nodeAccess = {
  createNode,
  viewNodes,
  updateNode,
  deleteNode,
  createRelationship,
  deleteRelationships,
  addUpdateNode,
};
