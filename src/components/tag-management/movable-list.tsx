import { useState, useEffect } from "react";
import { List, arrayMove } from "react-movable";
import { BaseNodeItem } from "./base-node-item";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

type FlattenedItem = {
  node: DBNode;
  dragIndex: number;
};

interface MovableListProps {
  flattenedItems: FlattenedItem[];
  userId: string;
  onEditStart: (node: DBNode) => void;
  onDelete: (nodeId: number) => void;
}

export function MovableList({
  flattenedItems,
  // userId,
  onEditStart,
  onDelete,
}: MovableListProps) {
  // const upsertOrdering = useUpsertOrdering();
  const [items, setItems] = useState(flattenedItems);

  // Sync with external prop changes
  useEffect(() => {
    setItems(flattenedItems);
  }, [flattenedItems]);

  console.log({ movableItems: items });

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
    //     await upsertOrdering.mutateAsync({
    //       user_id: userId,
    //       root_node: null,
    //       order: newOrder,
    //     });
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
                // only the handle should show grab; item itself keeps default cursor
                cursor: isDragged ? "grabbing" : "default",
              }}
            >
              <BaseNodeItem
                node={item.node}
                isChild={item.node.parent_node !== null}
                onEditStart={onEditStart}
                onDelete={onDelete}
                isDragging={isDragged}
              />
            </div>
          );
        }}
      />
    </div>
  );
}
