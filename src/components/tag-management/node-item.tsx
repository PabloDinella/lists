import { Draggable, type DraggableProvided, type DraggableStateSnapshot } from '@hello-pangea/dnd';
import { BaseNodeItem } from './base-node-item';
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

interface NodeItemProps {
  node: DBNode;
  index: number;
  isChild?: boolean;
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

export function NodeItem({
  node,
  index,
  isChild = false,
  editingId,
  editName,
  editDescription,
  onEditStart,
  onEditNameChange,
  onEditDescriptionChange,
  onEditSave,
  onEditCancel,
  onDelete,
}: NodeItemProps) {
  const draggableId = isChild ? `child-${node.id}` : node.id.toString();

  return (
    <Draggable key={node.id} draggableId={draggableId} index={index}>
      {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
        >
          <BaseNodeItem
            node={node}
            isChild={isChild}
            editingId={editingId}
            editName={editName}
            editDescription={editDescription}
            onEditStart={onEditStart}
            onEditNameChange={onEditNameChange}
            onEditDescriptionChange={onEditDescriptionChange}
            onEditSave={onEditSave}
            onEditCancel={onEditCancel}
            onDelete={onDelete}
            dragHandleProps={dragProvided.dragHandleProps || undefined}
            isDragging={snapshot.isDragging}
          />
        </div>
      )}
    </Draggable>
  );
}

// Keep the old component name as an alias for backward compatibility
export function ChildNodeItem(props: Omit<NodeItemProps, 'isChild'>) {
  return <NodeItem {...props} isChild={true} />;
}
