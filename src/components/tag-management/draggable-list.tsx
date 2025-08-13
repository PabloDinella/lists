import { useCallback, useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  type DropResult,
  type DroppableProvided,
} from "@hello-pangea/dnd";
import { NodeItem } from "./node-item";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

type FlattenedItem = {
  node: DBNode;
  dragIndex: number;
};

interface DraggableListProps {
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

export function DraggableList({
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
}: DraggableListProps) {
  // const upsertOrdering = useUpsertOrdering();

  const [items, setItems] = useState(flattenedItems);

  // Sync with external prop changes
  useEffect(() => {
    setItems(flattenedItems);
  }, [flattenedItems]);

  console.log({ items});
  

  // Simple arrayMove helper
  const arrayMove = useCallback(
    <T,>(arr: readonly T[], from: number, to: number): T[] => {
      const result = [...arr];
      const [item] = result.splice(from, 1);
      result.splice(to, 0, item);
      return result;
    },
    []
  );

  // Simple onDragEnd handler
  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination } = result;
      if (!destination || source.index === destination.index) return;

      // Reorder the items array
      const reorderedItems = arrayMove(
        items,
        source.index,
        destination.index
      );

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
    },
    [items, arrayMove]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="root">
        {(provided: DroppableProvided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            {items.map((item, index) => (
              <NodeItem
                key={item.node.id}
                node={item.node}
                index={index}
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
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
