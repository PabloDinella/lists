import { useMemo } from "react";
import { useNodes } from "@/hooks/use-nodes";
import { useOrdering } from "@/hooks/use-ordering";
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
  order: number | null;
  metadata: Metadata | null;
  children: TreeNode[];
};

interface UseListDataProps {
  userId: string | null;
}

interface UseListDataReturn {
  ordering: { order: number[] } | null | undefined;
  hierarchicalTree: TreeNode[];
  isLoading: boolean;
  isError: boolean;
}

export function useListData({ userId }: UseListDataProps): UseListDataReturn {
  const { data: ordering } = useOrdering({
    user_id: userId ?? undefined,
    // root_node: null,
  });
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

    // Apply ordering to root lists
    const orderedLists = ordering?.order?.length
      ? [
          ...(ordering.order
            .map((id) => lists.find((l) => l.id === id))
            .filter(Boolean) as DBNode[]),
          ...lists.filter((l) => !ordering.order.includes(l.id)),
        ]
      : lists;

    // Build tree structure with metadata-based depth limitation
    const buildTree = (
      nodes: DBNode[],
      parentId: number | null,
      currentDepth: number = 0
    ): TreeNode[] => {
      return nodes
        .filter((node) => node.parent_node === parentId)
        .map((node) => ({
          ...node,
          children: buildTree(allNodes, node.id, currentDepth + 1),
        }));
    };

    return buildTree(orderedLists, null);
  }, [lists, allNodes, ordering]);

  console.log({ lists, ordering, allNodes });

  return {
    ordering,
    hierarchicalTree,
    isLoading,
    isError,
  };
}
