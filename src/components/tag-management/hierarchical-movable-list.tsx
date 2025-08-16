import { useState, useEffect } from "react";
import { List, arrayMove } from "react-movable";
import { BaseNodeItem } from "./base-node-item";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";
import type { Json } from "@/database.types";

type TreeNode = {
  id: number;
  name: string;
  content: string | null;
  parent_node: number | null;
  user_id: string;
  created_at: string;
  order: number | null;
  metadata: Json | null;
  children: TreeNode[];
};

type HierarchicalItem = {
  node: DBNode;
  depth: number;
  dragIndex: number;
};

interface HierarchicalMovableListProps {
  hierarchicalTree: TreeNode[];
  onEditStart: (node: DBNode) => void;
  onDelete: (nodeId: number) => void;
}

export function HierarchicalMovableList({
  hierarchicalTree,
  onEditStart,
  onDelete,
}: HierarchicalMovableListProps) {
  // Convert hierarchical tree to flat list with depth information
  const flattenTree = (nodes: TreeNode[], depth: number = 0): HierarchicalItem[] => {
    const items: HierarchicalItem[] = [];
    
    nodes.forEach((node) => {
      items.push({
        node: {
          id: node.id,
          name: node.name,
          content: node.content,
          parent_node: node.parent_node,
          user_id: node.user_id,
          created_at: node.created_at,
          order: node.order,
          metadata: node.metadata,
        },
        depth,
        dragIndex: items.length,
      });
      
      // Recursively add children
      if (node.children && node.children.length > 0) {
        items.push(...flattenTree(node.children, depth + 1));
      }
    });
    
    return items;
  };

  const [items, setItems] = useState<HierarchicalItem[]>([]);

  // Sync with external prop changes
  useEffect(() => {
    setItems(flattenTree(hierarchicalTree));
  }, [hierarchicalTree]);

  const handleChange = async ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    setItems(reorderedItems);

    // Persist the new order
    // const newOrder = reorderedItems.map((item) => item.node.id);
    // if (userId) {
    //   try {
    //   await upsertOrdering.mutateAsync({
    //     user_id: userId,
    //     root_node: null,
    //     order: newOrder,
    //   });
    //   } catch (error) {
    //     console.error("Failed to persist ordering:", error);
    //   }
    // }
  };

  return (
    <div className="space-y-2">
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
              className="p-2"
              style={{
                ...restProps.style,
                cursor: isDragged ? "grabbing" : "default",
              }}
            >
              <BaseNodeItem
                node={item.node}
                isChild={item.depth > 0}
                onEditStart={onEditStart}
                onDelete={onDelete}
                isDragging={isDragged}
                depth={item.depth}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
