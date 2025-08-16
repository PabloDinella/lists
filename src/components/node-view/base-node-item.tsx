import { GripVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { useNavigate } from "react-router-dom";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";
import clsx from "clsx";
import { TreeNode } from "./use-list-data";

interface BaseNodeItemProps {
  node: TreeNode;
  isChild?: boolean;
  onEditStart: (node: DBNode) => void;
  onDelete: (nodeId: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  children: React.ReactNode;
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
  children,
}: BaseNodeItemProps) {
  const deleteNodeMutation = useDeleteNode();
  const navigate = useNavigate();

  const handleNodeClick = () => {
    // Navigate to the list view for this node
    navigate(`/lists/${node.id}`);
  };

  const handleNodeRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Open the edit sheet on right-click
    onEditStart(node);
  };

  return (
    <div>
      <div className="p-2">
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
              <button
                // react-movable handle
                data-movable-handle
                // keep it focusable off the tab order to avoid stealing focus while still clickable
                tabIndex={-1}
                className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                aria-label="Drag to reorder"
                title="Drag to reorder"
              >
                {isChild ? (
                  <div className="relative">
                    <GripVertical className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="relative">
                    <GripVertical className="h-4 w-4" />
                  </div>
                )}
              </button>

              {/* Clickable node content area */}
              <div
                className="flex-1 cursor-pointer hover:bg-accent/50 rounded-md p-2 -m-2 transition-colors"
                onClick={handleNodeClick}
                onContextMenu={handleNodeRightClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNodeClick();
                  }
                }}
                aria-label={`View ${node.name}. Right-click to edit.`}
              >
                <h3 className="font-medium">{node.name}</h3>
                {node.content && (
                  <p className="text-sm text-muted-foreground">
                    {node.content}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering node click
                  onEditStart(node);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering node click
                  onDelete(node.id);
                }}
                disabled={deleteNodeMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
