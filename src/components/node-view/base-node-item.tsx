import { GripVertical, Edit, Trash2, Sparkles, Grid2x2 } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { GTDProcessingDialog } from "./gtd-processing-dialog";
import { EisenhowerMatrixDialog } from "./eisenhower-matrix-dialog";
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
import { renderMarkdown } from "@/lib/utils";

interface BaseNodeItemProps {
  node: TreeNode;
  isChild?: boolean;
  onEditStart: (node: Node) => void;
  onDelete: (nodeId: number) => void | Promise<void>;
  children: React.ReactNode;
  isDragging?: boolean;
  depth?: number;
  relatedNodes?: { id: number; name: string }[];
  siblings?: TreeNode[];
  currentIndex?: number;
}

export function BaseNodeItem({
  node,
  onEditStart,
  onDelete,
  isDragging = false,
  depth = 0,
  children,
  relatedNodes = [],
  siblings = [],
  currentIndex = -1,
}: BaseNodeItemProps) {
  const deleteNodeMutation = useDeleteNode();
  const updateNodeMutation = useUpdateNode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGTDDialogOpen, setIsGTDDialogOpen] = useState(false);
  const [isEisenhowerDialogOpen, setIsEisenhowerDialogOpen] = useState(false);
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

  const handleOpenEisenhowerDialog = () => {
    setIsEisenhowerDialogOpen(true);
  };

  const handleNextUnclassifiedItem = () => {
    // Find next unclassified item in siblings
    if (siblings.length === 0 || currentIndex === -1) {
      setIsEisenhowerDialogOpen(false);
      return;
    }

    // Search forward from current item
    for (let i = currentIndex + 1; i < siblings.length; i++) {
      if (!siblings[i].metadata?.eisenhowerQuadrant) {
        setIsEisenhowerDialogOpen(false);
        // Use a small timeout to ensure state update before opening new dialog
        setTimeout(() => {
          // We need to trigger opening the dialog for the next item
          // This is a bit tricky since we need to update which item's dialog is open
          // For now, just close the current dialog
          setIsEisenhowerDialogOpen(false);
        }, 100);
        return;
      }
    }

    // If no next item found, just close
    setIsEisenhowerDialogOpen(false);
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
      <div className="px-0 py-1">
        <div
          className={clsx(
            "group rounded-lg border bg-background transition-[box-shadow,transform] duration-150",
            "p-1 sm:p-2",
            {
              "shadow-md ring-1 ring-border": isDragging,
              "hover:shadow-sm": !isDragging,
            },
          )}
          style={{ marginLeft: depth > 0 ? `${depth * 12}px` : undefined }} // reduce indent in compact mode
        >
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex flex-1 items-center gap-1 sm:gap-2">
              <button
                // react-movable handle
                data-movable-handle
                tabIndex={-1}
                className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                aria-label="Drag to reorder"
                title="Drag to reorder"
              >
                <div className="relative">
                  <GripVertical className="h-3 w-3" />
                </div>
              </button>
              {node.metadata?.type === "loop" && (
                <Checkbox
                  checked={node.metadata?.completed || false}
                  onCheckedChange={handleToggleCompleted}
                  aria-label={`Mark ${node.name} as ${node.metadata?.completed ? "incomplete" : "complete"}`}
                />
              )}
              <div
                className={clsx(
                  "min-w-0 flex-1 cursor-pointer rounded-md transition-colors hover:bg-accent/50",
                  "-m-1 p-1",
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
                  className={clsx(
                    "font-medium wrap-anywhere break-all",
                    "text-sm",
                    {
                      "line-through": node.metadata?.completed,
                    }
                  )}
                >
                  {node.name}
                  {relatedNodes.length > 0 && (
                    <span className="ml-2 font-normal text-muted-foreground text-xs">
                      · {relatedNodes.map((related) => related.name).join(", ")}
                    </span>
                  )}
                </h3>
                {/* Show description content */}
                {node.content && (
                  <div
                    className={clsx(
                      "hidden sm:block max-w-full text-sm text-muted-foreground markdown-content",
                      {
                        "line-through": node.metadata?.completed,
                      },
                    )}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(node.content) }}
                    onClick={(e) => {
                      // Allow clicks on links within the markdown content
                      if ((e.target as HTMLElement).tagName === 'A') {
                        e.stopPropagation();
                      }
                    }}
                  />
                )}
              </div>
            </div>
            {/* Show edit/delete buttons - always visible */}
            <div className="flex items-center gap-1">
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
                  <Sparkles className="h-3 w-3" />
                </Button>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEisenhowerDialog();
                    }}
                    title="Eisenhower Matrix"
                  >
                    <Grid2x2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Classify in Eisenhower Matrix</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStart(node);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit (or right-click the item)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick();
                    }}
                    disabled={deleteNodeMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
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
      {/* Eisenhower Matrix Dialog */}
      {user?.id && (
        <EisenhowerMatrixDialog
          node={node}
          userId={user.id}
          isOpen={isEisenhowerDialogOpen}
          onClose={() => setIsEisenhowerDialogOpen(false)}
          onNext={handleNextUnclassifiedItem}
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
