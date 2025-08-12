import { useMemo } from "react";
import { useNodes } from "@/hooks/use-nodes";
import { useOrdering } from "@/hooks/use-ordering";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

type FlattenedItem = {
  type: "parent" | "child";
  node: DBNode;
  parentId?: number;
  dragIndex: number;
};

interface UseListDataProps {
  userId: string | null;
}

interface UseListDataReturn {
  lists: DBNode[] | undefined;
  ordering: { order: number[] } | null | undefined;
  allNodes: DBNode[] | undefined;
  flattenedItems: FlattenedItem[];
  childrenByParent: Map<number, DBNode[]>;
  isLoading: boolean;
  isError: boolean;
}

export function useListData({ userId }: UseListDataProps): UseListDataReturn {
  const {
    data: lists,
    isLoading,
    isError,
  } = useNodes({
    user_id: userId ?? undefined,
    parent_node: null,
  });
  const { data: ordering } = useOrdering({
    user_id: userId ?? undefined,
    root_node: null,
  });
  const { data: allNodes } = useNodes({
    user_id: userId ?? undefined,
  });

  // Create a flattened structure for drag and drop
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
    childrenByParent,
    isLoading,
    isError,
  };
}
