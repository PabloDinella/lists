import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useSettings } from "@/hooks/use-settings";
import { TreeNode } from "./use-list-data";
import { Separator } from "../ui/separator";
import { Edit } from "lucide-react";
import { renderMarkdown } from "@/lib/utils";
import { TagsSelector } from "./tags-selector";
import { useUpsertRelationships } from "@/hooks/use-upsert-relationships";
import { useCreateNode } from "@/hooks/use-create-node";
import { MultiSelectAutocomplete, Option } from "../ui/multi-select-autocomplete";

interface GTDOutlineDialogProps {
  node: TreeNode;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onProcessNext?: (currentNodeId: number) => void;
  currentIndex?: number;
  totalCount?: number;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  onEdit?: () => void;
  onNodeUpdated?: (updatedNode: TreeNode) => void;
  tagNodes?: TreeNode[];
}

export function GTDOutlineDialog({
  node,
  userId,
  isOpen,
  onClose,
  onProcessNext,
  currentIndex,
  totalCount,
  onNavigatePrevious,
  onNavigateNext,
  onEdit,
  onNodeUpdated,
  tagNodes = [],
}: GTDOutlineDialogProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRelatedNodes, setSelectedRelatedNodes] = useState<number[]>(
    node.related_nodes.map((n) => n.id)
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const updateNodeMutation = useUpdateNode();
  const { data: settings } = useSettings(userId);
  const upsertRelationshipsMutation = useUpsertRelationships();
  const createNodeMutation = useCreateNode();

  // Scroll to top when node changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Only update selected tags when navigating to a different node
    // Don't reset on related_nodes changes to preserve optimistic updates
    setSelectedRelatedNodes(node.related_nodes.map((n) => n.id));
  }, [node.id]); // Removed node.related_nodes from dependencies

  const handleProcessNext = () => {
    if (onProcessNext) {
      onProcessNext(node.id);
    } else {
      onClose();
    }
  };

  const handleTagSelectionChange = async (selectedIds: number[]) => {
    // Optimistic update - update UI immediately
    const previousSelection = selectedRelatedNodes;
    setSelectedRelatedNodes(selectedIds);
    
    // Optimistically update the node in parent's processing queue
    if (onNodeUpdated) {
      const updatedNode = {
        ...node,
        related_nodes: tagNodes
          .flatMap(tag => tag.children)
          .filter(tag => selectedIds.includes(tag.id)),
      };
      onNodeUpdated(updatedNode);
    }
    
    // Then make the async call in the background
    try {
      await upsertRelationshipsMutation.mutateAsync({
        nodeId: node.id,
        relatedNodeIds: selectedIds,
        relationType: "related",
        userId,
      });
    } catch (error) {
      console.error("Failed to update tags:", error);
      // Revert optimistic update on error
      setSelectedRelatedNodes(previousSelection);
      if (onNodeUpdated) {
        const revertedNode = {
          ...node,
          related_nodes: tagNodes
            .flatMap(tag => tag.children)
            .filter(tag => previousSelection.includes(tag.id)),
        };
        onNodeUpdated(revertedNode);
      }
    }
  };

  const handleCreateNewTag = async (
    categoryId: number,
    itemName: string
  ): Promise<number> => {
    const newNode = await createNodeMutation.mutateAsync({
      name: itemName,
      parentNode: categoryId,
      userId,
      metadata: {},
    });
    return newNode.id;
  };

  const handleAction = async (action: string, targetListId?: number | null) => {
    setIsProcessing(true);

    try {
      let updatedNode: TreeNode;
      switch (action) {
        case "complete":
          await updateNodeMutation.mutateAsync({
            nodeId: node.id,
            userId,
            metadata: { completed: true },
          });
          updatedNode = { ...node, metadata: { ...node.metadata, completed: true } };
          break;
        case "delete":
          await updateNodeMutation.mutateAsync({
            nodeId: node.id,
            userId,
            metadata: { completed: true },
          });
          updatedNode = { ...node, metadata: { ...node.metadata, completed: true } };
          break;
        default:
          if (targetListId) {
            await updateNodeMutation.mutateAsync({
              nodeId: node.id,
              userId,
              parentNode: targetListId,
            });
            updatedNode = { ...node, parent_node: targetListId };
          } else {
            updatedNode = node;
          }
          break;
      }
      
      // Notify parent of the update
      if (onNodeUpdated) {
        onNodeUpdated(updatedNode);
      }
      
      handleProcessNext();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent ref={contentRef} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {isProcessing && (
          <div className="sticky top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm h-screen">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Processing...</p>
            </div>
          </div>
        )}
        <DialogHeader>
          <DialogTitle>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="text-sm font-normal text-muted-foreground">
                  GTD Processing
                </div>
                {currentIndex !== undefined && totalCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onNavigatePrevious}
                      disabled={
                        !onNavigatePrevious ||
                        currentIndex === 0 ||
                        isProcessing
                      }
                      className="h-7 w-7 p-0 text-muted-foreground"
                    >
                      <span className="sr-only">Previous</span>←
                    </Button>
                    <span className="text-sm font-normal text-muted-foreground">
                      {currentIndex + 1} of {totalCount}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onNavigateNext}
                      disabled={
                        !onNavigateNext ||
                        currentIndex >= totalCount - 1 ||
                        isProcessing
                      }
                      className="h-7 w-7 p-0 text-muted-foreground"
                    >
                      <span className="sr-only">Next</span>→
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2 rounded-md border bg-muted/50 px-3 py-2">
                <div className="text-base font-semibold">
                  {node.name}
                  {node.related_nodes.length > 0 && (
                    <span className="ml-2 font-normal text-muted-foreground text-xs">
                      · {node.related_nodes.map((related) => related.name).join(", ")}
                    </span>
                  )}
                </div>
                {node.content && (
                  <div className="text-sm text-muted-foreground">
                    <div
                      className={isDescriptionExpanded ? "markdown-content" : "line-clamp-1 markdown-content"}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(node.content) }}
                      onClick={(e) => {
                        // Allow clicks on links within the markdown content
                        if ((e.target as HTMLElement).tagName === 'A') {
                          e.stopPropagation();
                        }
                      }}
                    />
                    <button
                      onClick={() =>
                        setIsDescriptionExpanded(!isDescriptionExpanded)
                      }
                      className="mt-1 text-xs text-primary hover:underline"
                    >
                      {isDescriptionExpanded ? "Show less" : "Show more"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Choose the appropriate action based on the Getting Things Done
            methodology.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Tag Assignment and Edit Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            {tagNodes && tagNodes.length > 0 && tagNodes.map((category) => {
              const options: Option[] = category.children.map((child) => ({
                id: child.id,
                label: child.name,
                value: child.id,
              }));
              
              const categorySelectedValues = selectedRelatedNodes.filter((nodeId) =>
                options.some((option) => option.value === nodeId)
              );
              
              return (
                <div key={category.id} className="flex-1">
                  <MultiSelectAutocomplete
                    options={options}
                    value={categorySelectedValues}
                    onChange={async (newValues) => {
                      // Process new values (handle string inputs as new items to create)
                      const processedValues: number[] = [];
                      
                      for (const value of newValues) {
                        if (typeof value === 'number') {
                          processedValues.push(value);
                        } else if (typeof value === 'string') {
                          // Create new item
                          try {
                            const newItemId = await handleCreateNewTag(category.id, value);
                            processedValues.push(newItemId);
                          } catch (error) {
                            console.error('Failed to create new tag:', error);
                          }
                        }
                      }
                      
                      // Remove old selections from this category and add new ones
                      const otherCategorySelections = selectedRelatedNodes.filter(
                        (nodeId) => !options.some((option) => option.value === nodeId)
                      );
                      
                      handleTagSelectionChange([...otherCategorySelections, ...processedValues]);
                    }}
                    placeholder={category.name}
                    disabled={isProcessing}
                    className="w-full"
                  />
                </div>
              );
            })}
            
            {onEdit && (
              <Button
                onClick={onEdit}
                disabled={isProcessing}
                variant="outline"
                className="h-10 whitespace-nowrap flex-shrink-0"
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit item</span>
              </Button>
            )}
          </div>

          {/* Quick Action */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                1
              </div>
              <h3 className="font-semibold">Can you do it in 2 minutes?</h3>
            </div>
            <div className="ml-8">
              <Button
                onClick={() => handleAction("move", settings?.nextActions)}
                disabled={!settings?.nextActions}
                className="h-auto w-full justify-start py-3"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Yes - Do it now</div>
                  <div className="text-xs text-muted-foreground">
                    Mark item as completed
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Actionable Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                2
              </div>
              <h3 className="font-semibold">
                If it takes longer, what type of action is it?
              </h3>
            </div>
            <div className="ml-8 space-y-2">
              <Button
                onClick={() => handleAction("move", settings?.nextActions)}
                disabled={!settings?.nextActions}
                className="h-auto w-full justify-start py-3"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Single action (myself)</div>
                  <div className="text-xs text-muted-foreground">
                    Move to Next Actions
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => handleAction("move", settings?.waiting)}
                disabled={!settings?.waiting}
                className="h-auto w-full justify-start py-3"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Single action (delegate)</div>
                  <div className="text-xs text-muted-foreground">
                    Move to Waiting For
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => handleAction("move", settings?.projects)}
                disabled={!settings?.projects}
                className="h-auto w-full justify-start py-3"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Multi-step project</div>
                  <div className="text-xs text-muted-foreground">
                    Move to Projects
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Non-Actionable Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                3
              </div>
              <h3 className="font-semibold">
                Or is it not actionable right now?
              </h3>
            </div>
            <div className="ml-8 space-y-2">
              <Button
                onClick={() => handleAction("move", settings?.somedayMaybe)}
                disabled={!settings?.somedayMaybe}
                className="h-auto w-full justify-start py-3"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Might do someday</div>
                  <div className="text-xs text-muted-foreground">
                    Move to Someday/Maybe
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => handleAction("move", settings?.reference)}
                disabled={!settings?.reference}
                className="h-auto w-full justify-start py-3"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Keep for reference</div>
                  <div className="text-xs text-muted-foreground">
                    Move to Reference
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => handleAction("delete")}
                className="h-auto w-full justify-start py-3"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Not needed</div>
                  <div className="text-xs text-muted-foreground">
                    Delete this item
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Cancel */}
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-muted-foreground"
            >
              Cancel Processing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
