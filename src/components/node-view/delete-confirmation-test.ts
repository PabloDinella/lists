import { TreeNode } from "./use-list-data";

// Test data to verify the delete confirmation dialog logic
const createTestNode = (id: number, name: string, children: TreeNode[] = [], related_nodes: { id: number; name: string }[] = []): TreeNode => ({
  id,
  name,
  content: null,
  parent_node: null,
  user_id: "test-user",
  created_at: "2024-01-01",
  metadata: null,
  children,
  related_nodes,
});

// Example test scenario:
// Root node with 2 children, one of which has a grandchild
// Some nodes have related nodes (tags)
const grandchild = createTestNode(4, "Grandchild Task");
const child1 = createTestNode(2, "Child 1", [], [{ id: 10, name: "Tag 1" }]);
const child2 = createTestNode(3, "Child 2 with Grandchild", [grandchild], [{ id: 11, name: "Tag 2" }]);
const rootNode = createTestNode(1, "Root Task", [child1, child2], [{ id: 12, name: "Root Tag" }]);

// Helper functions from delete-confirmation-dialog.tsx
function getAllDescendants(node: TreeNode): TreeNode[] {
  const descendants: TreeNode[] = [];
  
  function collectDescendants(currentNode: TreeNode) {
    for (const child of currentNode.children) {
      descendants.push(child);
      collectDescendants(child);
    }
  }
  
  collectDescendants(node);
  return descendants;
}

function getAllRelatedNodes(node: TreeNode, descendants: TreeNode[]): { id: number; name: string }[] {
  const allNodes = [node, ...descendants];
  const relatedNodesMap = new Map<number, string>();
  
  for (const currentNode of allNodes) {
    for (const relatedNode of currentNode.related_nodes) {
      relatedNodesMap.set(relatedNode.id, relatedNode.name);
    }
  }
  
  return Array.from(relatedNodesMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));
}

function getDeleteImpact(node: TreeNode) {
  const descendants = getAllDescendants(node);
  const relatedNodes = getAllRelatedNodes(node, descendants);
  
  return {
    descendants,
    relatedNodes,
    hasChildren: descendants.length > 0,
    hasRelatedNodes: relatedNodes.length > 0,
    totalAffectedNodes: 1 + descendants.length,
  };
}

// Test the logic
console.log("Testing delete impact calculation:");
console.log("Root node:", rootNode.name);

const impact = getDeleteImpact(rootNode);
console.log("Descendants:", impact.descendants.map(d => d.name));
console.log("Related nodes:", impact.relatedNodes.map(r => r.name));
console.log("Total nodes to delete:", impact.totalAffectedNodes);
console.log("Has children:", impact.hasChildren);
console.log("Has related nodes:", impact.hasRelatedNodes);

// Expected results:
// - Descendants: ["Child 1", "Child 2 with Grandchild", "Grandchild Task"] (3 items)
// - Related nodes: ["Root Tag", "Tag 1", "Tag 2"] (3 unique tags)
// - Total nodes to delete: 4 (root + 3 descendants)
// - Has children: true
// - Has related nodes: true

export { rootNode, getDeleteImpact };
