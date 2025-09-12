import { GripVertical, Edit, Trash2, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
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
  isCompactView?: boolean;
}

export function BaseNodeItem({
  node,
  onEditStart,
  onDelete,
  isDragging = false,
  depth = 0,
  children,
  relatedNodes = [],
  isCompactView = false,
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
      <div className={clsx("px-0", isCompactView ? "py-1" : "py-2")}>
        <div
          className={clsx(
            "group rounded-lg border bg-background transition-[box-shadow,transform] duration-150",
            isCompactView 
              ? "p-1 sm:p-2" 
              : "p-2 sm:p-4",
            {
              "shadow-md ring-1 ring-border": isDragging,
              "hover:shadow-sm": !isDragging,
            },
          )}
          style={{ marginLeft: depth > 0 ? `${depth * (isCompactView ? 8 : 16)}px` : undefined }} // reduce indent in compact mode
        >
          <div className={clsx("flex items-center justify-between", isCompactView ? "gap-1 sm:gap-2" : "gap-2 sm:gap-3")}>
            <div className={clsx("flex flex-1 items-center", isCompactView ? "gap-1 sm:gap-2" : "gap-2 sm:gap-3")}>
              <button
                // react-movable handle
                data-movable-handle
                tabIndex={-1}
                className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                aria-label="Drag to reorder"
                title="Drag to reorder"
              >
                <div className="relative">
                  <GripVertical className={clsx(isCompactView ? "h-3 w-3" : "h-4 w-4")} />
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
                  isCompactView ? "-m-1 p-1" : "-m-1 p-1 sm:-m-2 sm:p-2",
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
                    isCompactView ? "text-sm" : "text-base sm:text-base",
                    {
                      "line-through": node.metadata?.completed,
                    }
                  )}
                >
                  {node.name}
                  {relatedNodes.length > 0 && (
                    <span className={clsx(
                      "ml-2 font-normal text-muted-foreground",
                      isCompactView ? "text-xs" : "text-xs"
                    )}>
                      · {relatedNodes.map((related) => related.name).join(", ")}
                    </span>
                  )}
                </h3>
                {/* Hide description on mobile or in compact mode */}
                {node.content && !isCompactView && (
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
            <div className={clsx("flex items-center", isCompactView ? "gap-1" : "gap-2")}>
              {isGtdProcessingFeatureEnabled && (
                <Button
                  size={isCompactView ? "sm" : "sm"}
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenGTDDialog();
                  }}
                  title="GTD Process this item"
                >
                  <Sparkles className={clsx(isCompactView ? "h-3 w-3" : "h-4 w-4")} />
                </Button>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size={isCompactView ? "sm" : "sm"}
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStart(node);
                    }}
                  >
                    <Edit className={clsx(isCompactView ? "h-3 w-3" : "h-4 w-4")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit (or right-click the item)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size={isCompactView ? "sm" : "sm"}
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick();
                    }}
                    disabled={deleteNodeMutation.isPending}
                  >
                    <Trash2 className={clsx(isCompactView ? "h-3 w-3" : "h-4 w-4")} />
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
