import { useState, useEffect } from "react";
import { List, arrayMove } from "react-movable";
import { BaseNodeItem } from "./base-node-item";
import { TreeNode } from "./use-list-data";
import { useUpsertOrdering } from "@/hooks/use-ordering";
import { supabase } from "@/lib/supabase";
import { Node } from "@/method/access/nodeAccess/models";
import { Button } from "@/components/ui/button";

type HierarchicalItem = {
  node: TreeNode;
  // depth: number;
  dragIndex: number;
};

interface HierarchicalMovableListProps {
  hierarchicalTree: TreeNode[];
  rootNode: TreeNode;
  depth?: number;
  onEditStart: (node: Node) => void;
  onDelete: (nodeId: number) => void;
}

export function HierarchicalMovableList({
  hierarchicalTree,
  rootNode,
  depth = 0,
  onEditStart,
  onDelete,
}: HierarchicalMovableListProps) {
  const [items, setItems] = useState<HierarchicalItem[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const [user, setUser] = useState<{ id: string } | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) =>
        setUser(data.user),
      );
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: { user: { id: string } | null } | null) => {
        setUser(session?.user ?? null);
      },
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Sync with external prop changes
  useEffect(() => {
    // setItems(flattenTree(hierarchicalTree));
    setItems(
      hierarchicalTree.map((node, index) => ({
        node,
        dragIndex: index,
      })),
    );
  }, [hierarchicalTree]);

  const upsertOrdering = useUpsertOrdering();

  const toggleExpanded = (nodeId: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const hasDeepChildren = (node: TreeNode): boolean => {
    return node.children.some((child) => child.children.length > 0);
  };

  const shouldShowLoadMore = (node: TreeNode): boolean => {
    return (
      depth >= 0 && node.children.length > 0 && !expandedNodes.has(node.id)
    );
  };

  const shouldShowChildren = (node: TreeNode): boolean => {
    return depth < 1 || expandedNodes.has(node.id);
  };

  const handleChange = async ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    setItems(reorderedItems);

    // Persist the new order in the parent node's metadata
    const newOrder = reorderedItems.map((item) => item.node.id);
    if (user?.id) {
      try {
        await upsertOrdering.mutateAsync({
          userId: user.id,
          parentNodeId: rootNode.id,
          childrenOrder: newOrder,
        });
      } catch (error) {
        console.error("Failed to persist ordering:", error);
      }
    }
  };

  return (
    <div>
      <List
        values={items}
        onChange={handleChange}
        renderList={({ children, props, isDragged }) => (
          <div
            {...props}
            style={{ cursor: isDragged ? "grabbing" : "default" }}
          >
            {children}
          </div>
        )}
        renderItem={({ value: item, props, isDragged }) => {
          const { key, ...restProps } = props;
          return (
            <div
              key={key}
              {...restProps}
              // className="p-2"
              style={{
                ...restProps.style,
                cursor: isDragged ? "grabbing" : "default",
              }}
            >
              <BaseNodeItem
                node={item.node}
                // isChild={item.depth > 0}
                onEditStart={onEditStart}
                onDelete={onDelete}
                isDragging={isDragged}
                depth={depth}
              >
                {shouldShowChildren(item.node) &&
                  item.node.children.length > 0 && (
                    <HierarchicalMovableList
                      hierarchicalTree={item.node.children}
                      rootNode={item.node}
                      depth={depth + 1}
                      onEditStart={onEditStart}
                      onDelete={onDelete}
                    />
                  )}
                {shouldShowLoadMore(item.node) && (
                  <div
                    className="mx-2 mb-2 pt-2"
                    style={{
                      marginLeft:
                        depth > 0 ? `${(depth + 1) * 24 + 8}px` : undefined,
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(item.node.id)}
                      className="w-full rounded-lg border border-dashed bg-background px-4 py-2 text-xs text-muted-foreground transition-[box-shadow,transform] duration-150 hover:text-foreground"
                    >
                      Show sub-items ({item.node.children.length} items)
                    </Button>
                  </div>
                )}
              </BaseNodeItem>
            </div>
          );
        }}
      />
    </div>
  );
}
