import { Draggable, type DraggableProvided, type DraggableStateSnapshot } from '@hello-pangea/dnd';
import { GripVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useDeleteNode } from "@/hooks/use-delete-node";
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
  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();

  const draggableId = isChild ? `child-${node.id}` : node.id.toString();
  const containerClassName = isChild 
    ? "ml-8 p-4 border rounded-lg bg-background transition-[box-shadow,transform] duration-150"
    : "p-4 border rounded-lg bg-background transition-[box-shadow,transform] duration-150";

  return (
    <Draggable key={node.id} draggableId={draggableId} index={index}>
      {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          className={`${containerClassName} ${
            snapshot.isDragging ? 'shadow-md ring-1 ring-border' : 'hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              {/* drag handle with optional hierarchy indicator */}
              <button
                className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                {...dragProvided.dragHandleProps}
                aria-label="Drag to reorder"
                title="Drag to reorder"
              >
                {isChild ? (
                  <div className="relative">
                    <GripVertical className="h-4 w-4" />
                  </div>
                ) : (
                  <GripVertical className="h-4 w-4" />
                )}
              </button>
              {editingId === node.id ? (
                <div className="flex-1 grid gap-2 sm:grid-cols-2">
                  <Input 
                    value={editName} 
                    onChange={(e) => onEditNameChange(e.target.value)} 
                  />
                  <Input 
                    value={editDescription} 
                    onChange={(e) => onEditDescriptionChange(e.target.value)} 
                    placeholder="Description (optional)" 
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <h3 className="font-medium">{node.name}</h3>
                  {node.content && (
                    <p className="text-sm text-muted-foreground">{node.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(node.created_at).toLocaleString()} • ID: {node.id}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editingId === node.id ? (
                <>
                  <Button 
                    size="sm" 
                    onClick={onEditSave} 
                    disabled={updateNodeMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onEditCancel} 
                    disabled={updateNodeMutation.isPending}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onEditStart(node)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onDelete(node.id)} 
                    disabled={deleteNodeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// Keep the old component name as an alias for backward compatibility
export function ChildNodeItem(props: Omit<NodeItemProps, 'isChild'>) {
  return <NodeItem {...props} isChild={true} />;
}
