import { useMemo } from "react";
import { useNodes } from "@/hooks/use-nodes";
import { Metadata, Node } from "@/method/access/nodeAccess/models";

export type TreeNode = {
  id: number;
  name: string;
  content: string | null;
  parent_node: number | null;
  user_id: string;
  created_at: string;
  metadata: Metadata | null;
  children: TreeNode[];
  related_nodes: TreeNode[];
};

interface UseListDataProps {
  userId: string | null;
}

interface UseListDataReturn {
  hierarchicalTree: TreeNode[];
  isLoading: boolean;
  isError: boolean;
}

// Helper function to convert Node to TreeNode
const convertNodeToTreeNode = (node: Node): TreeNode => ({
  ...node,
  children: [], // Will be populated by buildTree
  related_nodes: node.related_nodes.map(relatedNode => convertNodeToTreeNode(relatedNode)),
});

// Helper function to get priority score for Eisenhower quadrant
const getEisenhowerPriority = (quadrant?: string): number => {
  switch (quadrant) {
    case "urgent-important":
      return 1; // Highest priority
    case "not-urgent-important":
      return 2;
    case "urgent-not-important":
      return 3;
    case "not-urgent-not-important":
      return 4; // Lowest priority
    default:
      return 5; // Unclassified items go last
  }
};

// Helper function to get time score
const getTimeScore = (time?: string): number => {
  switch (time) {
    case "short":
      return 1;
    case "medium":
      return 2;
    case "long":
      return 3;
    default:
      return 2; // Default to medium
  }
};

// Helper function to get energy score
const getEnergyScore = (energy?: string): number => {
  switch (energy) {
    case "low":
      return 1;
    case "medium":
      return 2;
    case "high":
      return 3;
    default:
      return 2; // Default to medium
  }
};

// Sort nodes by priority: Eisenhower quadrant, then time, then energy
const sortByPriority = (a: Node, b: Node): number => {
  // First, sort by Eisenhower quadrant
  const priorityA = getEisenhowerPriority(a.metadata?.eisenhowerQuadrant);
  const priorityB = getEisenhowerPriority(b.metadata?.eisenhowerQuadrant);
  
  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }
  
  // If same quadrant, sort by time (shorter tasks first)
  const timeA = getTimeScore(a.metadata?.time);
  const timeB = getTimeScore(b.metadata?.time);
  
  if (timeA !== timeB) {
    return timeA - timeB;
  }
  
  // If same time, sort by energy (lower energy first)
  const energyA = getEnergyScore(a.metadata?.energy);
  const energyB = getEnergyScore(b.metadata?.energy);
  
  return energyA - energyB;
};

export function useListData({ userId }: UseListDataProps): UseListDataReturn {
  const {
    data: allNodes,
    isLoading,
    isError,
  } = useNodes({
    userId: userId ?? undefined,
  });

  const lists = allNodes?.filter((node) => {
    return node.metadata?.type === "root";
  });

  // Create hierarchical tree structure
  const hierarchicalTree = useMemo(() => {
    if (!lists || !allNodes) return [];

    // Build tree structure with metadata-based ordering
    const buildTree = (
      nodes: Node[],
      parentId: number | null,
      currentDepth: number = 0,
    ): TreeNode[] => {
      const childNodes = nodes.filter((node) => node.parent_node === parentId);

      // If there's a parent node, check if it has childrenOrder in its metadata
      let orderedChildNodes = childNodes;
      if (parentId !== null) {
        const parentNode = nodes.find((node) => node.id === parentId);
        const childrenOrder = parentNode?.metadata?.childrenOrder;

        if (childrenOrder && childrenOrder.length > 0) {
          // Apply the ordering specified in parent's metadata
          orderedChildNodes = [
            // First add nodes in the specified order
            ...(childrenOrder
              .map((id) => childNodes.find((node) => node.id === id))
              .filter(Boolean) as Node[]),
            // Then add any nodes not in the order list
            ...childNodes.filter((node) => !childrenOrder.includes(node.id)),
          ];
        } else {
          // If no manual ordering, sort by Eisenhower priority
          orderedChildNodes = [...childNodes].sort(sortByPriority);
        }
      } else {
        // For root level nodes, also apply priority sorting if no specific order
        orderedChildNodes = [...childNodes].sort(sortByPriority);
      }

      return orderedChildNodes.map((node) => {
        const treeNode = convertNodeToTreeNode(node);
        treeNode.children = buildTree(allNodes, node.id, currentDepth + 1);
        return treeNode;
      });
    };

    // For root level, we don't have a parent with childrenOrder, so just use the lists as-is
    return buildTree(allNodes, null);
  }, [lists, allNodes]);

  return {
    hierarchicalTree,
    isLoading,
    isError,
  };
}
