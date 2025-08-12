import { useCallback } from "react";
import { DragDropContext, Droppable, type DropResult, type DroppableProvided } from '@hello-pangea/dnd';
import { NodeItem } from "./node-item";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useUpsertOrdering } from "@/hooks/use-ordering";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

type FlattenedItem = {
  type: 'parent' | 'child';
  node: DBNode;
  parentId?: number;
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
  userId,
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
  const updateNodeMutation = useUpdateNode();
  const upsertOrdering = useUpsertOrdering();

  // Functional arrayMove helper
  const arrayMove = useCallback(<T,>(arr: readonly T[], from: number, to: number): T[] => {
    const result = [...arr];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  }, []);

  // onDragEnd handler for library
  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.index === destination.index) return;

    const isChild = draggableId.startsWith('child-');
    const nodeId = parseInt(isChild ? draggableId.replace('child-', '') : draggableId);

    if (isChild) {
      // Handle child node movement
      const sourceItem = flattenedItems.find(item => item.node.id === nodeId);
      const sourceParentId = sourceItem?.type === 'child' ? sourceItem.parentId : null;
      
      // Find the new parent based on destination index using functional approach
      const newParentId = flattenedItems
        .slice(0, destination.index + 1)
        .reverse()
        .find(item => item.type === 'parent')
        ?.node.id || sourceParentId;

      // Update parent if changed
      if (newParentId !== sourceParentId && userId && newParentId) {
        try {
          await updateNodeMutation.mutateAsync({
            node_id: nodeId,
            parent_node: newParentId,
            user_id: userId,
          });
        } catch (error) {
          console.error('Failed to update parent:', error);
        }
      }
    } else {
      // Handle parent list movement using functional approach
      const sourceIndex = flattenedItems.findIndex(item => item.type === 'parent' && item.node.id === nodeId);
      const destinationIndex = flattenedItems
        .slice(0, destination.index + 1)
        .filter(item => item.type === 'parent').length - 1;
      
      if (sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex !== destinationIndex) {
        const parentItems = flattenedItems.filter(item => item.type === 'parent');
        const reorderedParents = arrayMove(parentItems, sourceIndex, destinationIndex);
        const newOrder = reorderedParents.map(item => item.node.id);
        
        // Persist asynchronously
        if (userId) {
          try {
            await upsertOrdering.mutateAsync({ user_id: userId, root_node: null, order: newOrder });
          } catch (error) {
            console.error('Failed to persist ordering:', error);
          }
        }
      }
    }
  }, [flattenedItems, userId, updateNodeMutation, upsertOrdering, arrayMove]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="root">
        {(provided: DroppableProvided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
            {flattenedItems.map((item, index) => (
              <NodeItem
                key={item.type === 'parent' ? item.node.id : `child-${item.node.id}`}
                node={item.node}
                index={index}
                isChild={item.type === 'child'}
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
