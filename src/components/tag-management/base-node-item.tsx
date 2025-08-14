import { GripVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useDeleteNode } from "@/hooks/use-delete-node";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";
import clsx from "clsx";

interface BaseNodeItemProps {
  node: DBNode;
  isChild?: boolean;
  onEditStart: (node: DBNode) => void;
  onDelete: (nodeId: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  depth?: number;
}

export function BaseNodeItem({
  node,
  isChild = false,
  onEditStart,
  onDelete,
  dragHandleProps,
  isDragging = false,
  depth = 0,
}: BaseNodeItemProps) {
  const deleteNodeMutation = useDeleteNode();

  return (
    <div
      className={clsx(
        "p-4 border rounded-lg bg-background transition-[box-shadow,transform] duration-150",
        {
          "shadow-md ring-1 ring-border": isDragging,
          "hover:shadow-sm": !isDragging,
        }
      )}
      style={{ marginLeft: depth > 0 ? `${depth * 24}px` : undefined }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {/* drag handle with optional hierarchy indicator; supports react-movable via data-movable-handle and @hello-pangea/dnd via dragHandleProps */}
          <button
            // react-movable handle
            data-movable-handle
            // keep it focusable off the tab order to avoid stealing focus while still clickable
            tabIndex={-1}
            className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
            title="Drag to reorder"
            {...(dragHandleProps ?? {})}
          >
            {isChild ? (
              <div className="relative">
                <GripVertical className="h-4 w-4" />
              </div>
            ) : (
              <GripVertical className="h-4 w-4" />
            )}
          </button>

          <div className="flex-1">
            <h3 className="font-medium">{node.name}</h3>
            {node.content && (
              <p className="text-sm text-muted-foreground">{node.content}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Created {new Date(node.created_at).toLocaleString()} • ID:{" "}
              {node.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  );
}
