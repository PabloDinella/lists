import { createNode } from "./createNode";
import { viewNodes } from "./viewNodes";
import { updateNode } from "./updateNode";
import { deleteNode } from "./deleteNode";

export { createNode, viewNodes, updateNode, deleteNode };
export type { Node } from "./createNode";

export const nodeAccess = {
  createNode,
  viewNodes,
  updateNode,
  deleteNode,
};
