import { useState, useEffect } from "react";
import { List, arrayMove } from "react-movable";
import { BaseNodeItem } from "./base-node-item";
import { TreeNode } from "./use-list-data";
import { useUpsertOrdering } from "@/hooks/use-ordering";
import { supabase } from "@/lib/supabase";
import { Node } from "@/method/access/nodeAccess/models";
import { useAuth } from "@/hooks/use-auth";

type HierarchicalItem = {
  node: TreeNode;
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

  const { user } = useAuth();

  useEffect(() => {
    setItems(
      hierarchicalTree.map((node, index) => ({
        node,
        dragIndex: index,
      })),
    );
  }, [hierarchicalTree]);

  const upsertOrdering = useUpsertOrdering();

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
              style={{
                ...restProps.style,
                cursor: isDragged ? "grabbing" : "default",
              }}
            >
              <BaseNodeItem
                node={item.node}
                onEditStart={onEditStart}
                onDelete={onDelete}
                isDragging={isDragged}
                depth={depth}
                relatedNodes={item.node.related_nodes}
              >
                <HierarchicalMovableList
                  hierarchicalTree={item.node.children}
                  rootNode={item.node}
                  depth={depth + 1}
                  onEditStart={onEditStart}
                  onDelete={onDelete}
                />
              </BaseNodeItem>
            </div>
          );
        }}
      />
    </div>
  );
}
