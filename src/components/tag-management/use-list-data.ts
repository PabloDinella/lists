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

type FlattenedItem = {
  type: "parent" | "child";
  node: DBNode;
  parentId?: number;
  dragIndex: number;
};

interface UseListDataProps {
  userId: string | null;
  parentNodeId?: number | null;
}

interface UseListDataReturn {
  lists: DBNode[] | undefined;
  ordering: { order: number[] } | null | undefined;
  allNodes: DBNode[] | undefined;
  flattenedItems: FlattenedItem[];
  childrenByParent: Map<number, DBNode[]>;
  hierarchicalTree: TreeNode[];
  parentNode: DBNode | undefined; // The parent node when viewing a specific list
  isLoading: boolean;
  isError: boolean;
}

export function useListData({
  userId,
  parentNodeId,
}: UseListDataProps): UseListDataReturn {
  const {
    data: lists,
    isLoading,
    isError,
  } = useNodes({
    user_id: userId ?? undefined,
    parent_node: parentNodeId ?? null,
  });
  const { data: ordering } = useOrdering({
    user_id: userId ?? undefined,
    root_node: parentNodeId ?? null,
  });
  const { data: allNodes } = useNodes({
    user_id: userId ?? undefined,
  });

  // Fetch the parent node when viewing a specific list
  const parentNode = useMemo(() => {
    if (!parentNodeId || !allNodes) return undefined;
    return allNodes.find((node) => node.id === parentNodeId);
  }, [parentNodeId, allNodes]);

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

    return buildTree(orderedLists, parentNodeId ?? null);
  }, [lists, allNodes, ordering, parentNodeId]);

  // Create a flattened structure for drag and drop (keeping for backward compatibility)
  const { flattenedItems, childrenByParent } = useMemo(() => {
    if (!lists || !allNodes)
      return { flattenedItems: [], childrenByParent: new Map() };

    // Separate children by parent using functional approach
    const childrenMap = allNodes
      .filter(
        (node) =>
          node.parent_node !== null &&
          lists.some((list) => list.id === node.parent_node)
      )
      .reduce((acc, node) => {
        const parentId = node.parent_node!;
        const siblings = acc.get(parentId) || [];
        return acc.set(parentId, [...siblings, node]);
      }, new Map<number, DBNode[]>());

    // Apply ordering to root lists functionally
    const orderedLists = ordering?.order?.length
      ? [
          ...(ordering.order
            .map((id) => lists.find((l) => l.id === id))
            .filter(Boolean) as DBNode[]),
          ...lists.filter((l) => !ordering.order.includes(l.id)),
        ]
      : lists;

    // Create flattened items functionally
    const items = orderedLists.flatMap((list, listIndex) => {
      const parentItem = {
        type: "parent" as const,
        node: list,
        dragIndex: listIndex,
      };
      const children = childrenMap.get(list.id) || [];
      const childItems = children.map((child, childIndex) => ({
        type: "child" as const,
        node: child,
        parentId: list.id,
        dragIndex: listIndex + childIndex + 1,
      }));
      return [parentItem, ...childItems];
    });

    // Reassign dragIndex to be sequential
    const itemsWithSequentialIndex = items.map((item, index) => ({
      ...item,
      dragIndex: index,
    }));

    return {
      flattenedItems: itemsWithSequentialIndex,
      childrenByParent: childrenMap,
    };
  }, [lists, allNodes, ordering]);

  return {
    lists,
    ordering,
    allNodes,
    flattenedItems,
    hierarchicalTree,
    childrenByParent,
    parentNode, // The parent node when viewing a specific list
    isLoading,
    isError,
  };
}
