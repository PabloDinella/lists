import type { TreeNode } from "@/components/node-view/use-list-data";

/** Resolve incoming list memberships to the live nodes in the ownership tree. */
export function getListMembers(list: TreeNode, allNodes: TreeNode[]): TreeNode[] {
  const ownedIds = new Set<number>();
  const collectOwnedIds = (children: TreeNode[]) => {
    for (const child of children) {
      ownedIds.add(child.id);
      collectOwnedIds(child.children);
    }
  };
  collectOwnedIds(list.children);
  const nodesById = new Map(allNodes.map((node) => [node.id, node]));
  const seen = new Set<number>();

  return list.related_nodes.flatMap((related) => {
    if (related.relation_type !== "member_of" || related.relation_direction !== "incoming") return [];
    if (related.id === list.id || ownedIds.has(related.id) || seen.has(related.id)) return [];
    const node = nodesById.get(related.id);
    if (!node) return [];
    seen.add(node.id);
    return [node];
  });
}
