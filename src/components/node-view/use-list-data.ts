import { useMemo } from "react";
import { useNodes } from "@/hooks/use-nodes";
import type {
  Node as DBNode,
  Metadata,
} from "@/method/access/nodeAccess/createNode";

export type TreeNode = {
  id: number;
  name: string;
  content: string | null;
  parent_node: number | null;
  user_id: string;
  created_at: string;
  metadata: Metadata | null;
  children: TreeNode[];
};

interface UseListDataProps {
  userId: string | null;
}

interface UseListDataReturn {
  hierarchicalTree: TreeNode[];
  isLoading: boolean;
  isError: boolean;
}

export function useListData({ userId }: UseListDataProps): UseListDataReturn {
  const {
    data: allNodes,
    isLoading,
    isError,
  } = useNodes({
    user_id: userId ?? undefined,
  });

  const lists = allNodes?.filter((node) => {
    return node.metadata?.type === "root";
  });

  // Create hierarchical tree structure
  const hierarchicalTree = useMemo(() => {
    if (!lists || !allNodes) return [];

    // Build tree structure with metadata-based ordering
    const buildTree = (
      nodes: DBNode[],
      parentId: number | null,
      currentDepth: number = 0
    ): TreeNode[] => {
      const childNodes = nodes.filter((node) => node.parent_node === parentId);
      
      // If there's a parent node, check if it has children_order in its metadata
      let orderedChildNodes = childNodes;
      if (parentId !== null) {
        const parentNode = nodes.find((node) => node.id === parentId);
        const childrenOrder = parentNode?.metadata?.children_order;
        
        if (childrenOrder && childrenOrder.length > 0) {
          // Apply the ordering specified in parent's metadata
          orderedChildNodes = [
            // First add nodes in the specified order
            ...childrenOrder
              .map((id) => childNodes.find((node) => node.id === id))
              .filter(Boolean) as DBNode[],
            // Then add any nodes not in the order list
            ...childNodes.filter((node) => !childrenOrder.includes(node.id)),
          ];
        }
      }

      return orderedChildNodes.map((node) => ({
        ...node,
        children: buildTree(allNodes, node.id, currentDepth + 1),
      }));
    };

    // For root level, we don't have a parent with children_order, so just use the lists as-is
    return buildTree(allNodes, null);
  }, [lists, allNodes]);

  console.log({ lists, allNodes });

  return {
    hierarchicalTree,
    isLoading,
    isError,
  };
}
