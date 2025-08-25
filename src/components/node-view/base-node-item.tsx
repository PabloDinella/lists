import { GripVertical, Edit, Trash2, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { GTDProcessingDialog } from "./gtd-processing-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useFeatureFlagEnabled } from "posthog-js/react";
import clsx from "clsx";
import { TreeNode } from "./use-list-data";
import { Node } from "@/method/access/nodeAccess/models";

interface BaseNodeItemProps {
  node: TreeNode;
  isChild?: boolean;
  onEditStart: (node: Node) => void;
  onDelete: (nodeId: number) => void | Promise<void>;
  children: React.ReactNode;
  isDragging?: boolean;
  depth?: number;
  relatedNodes?: { id: number; name: string }[];
}

export function BaseNodeItem({
  node,
  isChild = false,
  onEditStart,
  onDelete,
  isDragging = false,
  depth = 0,
  children,
  relatedNodes = [],
}: BaseNodeItemProps) {
  const deleteNodeMutation = useDeleteNode();
  const updateNodeMutation = useUpdateNode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGTDDialogOpen, setIsGTDDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isGtdProcessingFeatureEnabled = useFeatureFlagEnabled(
    "gtd-processing-feature",
  );

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

  const handleToggleCompleted = (checked: boolean) => {
    if (!user?.id) return;

    updateNodeMutation.mutate({
      nodeId: node.id,
      userId: user.id,
      metadata: {
        completed: checked,
      },
    });
  };

  const handleOpenGTDDialog = () => {
    setIsGTDDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const result = onDelete(node.id);
      if (result instanceof Promise) {
        await result;
      }
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete node:", error);
      // Keep dialog open on error so user can retry
    }
  };

  return (
    <div>
      <div className="p-2">
        <div
          className={clsx(
            "rounded-lg border bg-background p-4 transition-[box-shadow,transform] duration-150",
            {
              "shadow-md ring-1 ring-border": isDragging,
              "hover:shadow-sm": !isDragging,
            },
          )}
          style={{ marginLeft: depth > 0 ? `${depth * 24}px` : undefined }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <button
                // react-movable handle
                data-movable-handle
                // keep it focusable off the tab order to avoid stealing focus while still clickable
                tabIndex={-1}
                className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
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

              {/* Checkbox for completion status - only show for loop type nodes */}
              {node.metadata?.type === "loop" && (
                <Checkbox
                  checked={node.metadata?.completed || false}
                  onCheckedChange={handleToggleCompleted}
                  aria-label={`Mark ${node.name} as ${node.metadata?.completed ? "incomplete" : "complete"}`}
                />
              )}

              {/* Clickable node content area */}
              <div
                className={clsx(
                  "-m-2 min-w-0 flex-1 cursor-pointer rounded-md p-2 transition-colors hover:bg-accent/50",
                  {
                    "opacity-60": node.metadata?.completed,
                  },
                )}
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
                <h3
                  className={clsx("font-medium", {
                    "line-through": node.metadata?.completed,
                  })}
                >
                  {node.name}
                  {relatedNodes.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      · {relatedNodes.map((related) => related.name).join(", ")}
                    </span>
                  )}
                </h3>
                {node.content && (
                  <p
                    className={clsx(
                      "max-w-full hyphens-auto break-all text-sm text-muted-foreground",
                      {
                        "line-through": node.metadata?.completed,
                      },
                    )}
                  >
                    {node.content}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* GTD Processing button - only show for items in inbox and when feature flag is enabled */}
              {isGtdProcessingFeatureEnabled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenGTDDialog();
                  }}
                  title="GTD Process this item"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
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
                  handleDeleteClick();
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

      {/* GTD Processing Dialog */}
      {user?.id && (
        <GTDProcessingDialog
          node={node}
          userId={user.id}
          isOpen={isGTDDialogOpen}
          onClose={() => setIsGTDDialogOpen(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        node={node}
        isDeleting={deleteNodeMutation.isPending}
      />
    </div>
  );
}
