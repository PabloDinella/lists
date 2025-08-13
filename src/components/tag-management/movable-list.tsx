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
  editingId: number | null;
  editName: string;
  editDescription: string;
  onEditStart: (node: DBNode) => void;
  onEditNameChange: (name: string) => void;
  onEditDescriptionChange: (description: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: (nodeId: number) => void;
}

export function MovableList({
  flattenedItems,
  // userId,
  editingId,
  editName,
  editDescription,
  onEditStart,
  onEditNameChange,
  onEditDescriptionChange,
  onEditSave,
  onEditCancel,
  onDelete,
}: MovableListProps) {
  // const upsertOrdering = useUpsertOrdering();
  const [items, setItems] = useState(flattenedItems);

  // Sync with external prop changes
  useEffect(() => {
    setItems(flattenedItems);
  }, [flattenedItems]);

  console.log({ movableItems: items });

  const handleChange = async ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
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
        renderList={({ children, props }) => (
          <div {...props} className="space-y-2">
            {children}
          </div>
        )}
        renderItem={({ value: item, props, isDragged }) => (
          <div {...props} key={item.node.id} style={{ ...props.style, cursor: isDragged ? 'grabbing' : 'grab' }}>
            <BaseNodeItem
              node={item.node}
              isChild={false}
              editingId={editingId}
              editName={editName}
              editDescription={editDescription}
              onEditStart={onEditStart}
              onEditNameChange={onEditNameChange}
              onEditDescriptionChange={onEditDescriptionChange}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
              onDelete={onDelete}
              isDragging={isDragged}
              dragHandleProps={{}}
            />
          </div>
        )}
      />
    </div>
  );
}
