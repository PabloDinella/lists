import type { TreeNode } from "./use-list-data.ts";

export function filterTreeByTags(
  nodes: TreeNode[],
  filterTagIds: number[],
): TreeNode[] {
  if (filterTagIds.length === 0) return nodes;

  return nodes.reduce<TreeNode[]>((filteredNodes, node) => {
    const filteredChildren = filterTreeByTags(node.children, filterTagIds);
    const hasAllSelectedTags = filterTagIds.every((tagId) =>
      node.related_nodes.some((relatedNode) => relatedNode.id === tagId),
    );

    if (hasAllSelectedTags || filteredChildren.length > 0) {
      filteredNodes.push({
        ...node,
        children: filteredChildren,
      });
    }

    return filteredNodes;
  }, []);
}

export function getProcessingQueue(
  nodes: TreeNode[],
  filterTagIds: number[] = [],
): TreeNode[] {
  return filterTreeByTags(nodes, filterTagIds).filter(
    (item) => !item.metadata?.completed,
  );
}

export function getRefiningQueue(
  nodes: TreeNode[],
  filterTagIds: number[] = [],
): TreeNode[] {
  return filterTreeByTags(nodes, filterTagIds).filter(
    (item) => !item.metadata?.completed && !item.metadata?.eisenhowerQuadrant,
  );
}
