import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { SingleSelectAutocomplete } from "../ui/single-select-autocomplete";

import { NodeTypeSelector } from "./node-type-selector";
import { TagsSelector } from "./tags-selector";
import { useAddUpdateNode } from "@/hooks/use-add-update-node";
import { useAuth } from "@/hooks/use-auth";
import { useNodeId } from "@/hooks/use-node-id";
import { TreeNode, useListData } from "./use-list-data";
import { Metadata, Node } from "@/method/access/nodeAccess/models";

interface EditNodeSheetProps {
  node: Node | null; // The node being edited (null for create)
  isOpen: boolean;
  onClose: () => void;
  mode: "edit" | "create";
  defaultParentId: number;
  defaultMetadata?: Metadata; // Default metadata for create mode
}

interface FormData {
  name: string;
  description: string;
  parentId: number | null;
  nodeType: "list" | "tagging" | "tag" | "loop";
  selectedRelatedNodes: number[];
}

export function EditNodeSheet({
  node,
  isOpen,
  onClose,
  mode,
  defaultParentId,
  defaultMetadata,
}: EditNodeSheetProps) {
  const nodeId = useNodeId();
  const navigate = useNavigate();

  const { user } = useAuth();
  const addUpdateNodeMutation = useAddUpdateNode();
  
  // State for "create more" option
  const [createMore, setCreateMore] = useState(false);

  // Determine if we're managing lists (root level) or viewing a specific list
  const isManagingLists = !nodeId;

  // Get all nodes to compute derived data
  const { hierarchicalTree: allNodesTree } = useListData({
    userId: user?.id || null,
  });

  // Helper functions moved from parent
  const flattenNodesTree = (all: TreeNode[], node: TreeNode) => {
    if (node.children.length > 0) {
      return [
        ...all,
        node,
        ...node.children.reduce<TreeNode[]>(flattenNodesTree, []),
      ];
    }
    return [...all, node];
  };

  // Convert tree structure to hierarchical options for dropdown
  const convertToHierarchicalOptions = (
    nodes: TreeNode[],
    level: number = 0,
    result: Array<{
      id: number;
      label: string;
      value: number;
      level: number;
    }> = [],
  ): Array<{ id: number; label: string; value: number; level: number }> => {
    for (const node of nodes) {
      result.push({
        id: node.id,
        label: node.name,
        value: node.id,
        level: level,
      });
      if (node.children && node.children.length > 0) {
        convertToHierarchicalOptions(node.children, level + 1, result);
      }
    }
    return result;
  };

  // Compute derived data
  const flattenedAllItems = allNodesTree.reduce<TreeNode[]>(
    flattenNodesTree,
    [],
  );
  const rootNode = allNodesTree.find((item) => item.parent_node === null);

  // Calculate available parents
  const availableParents = flattenedAllItems;

  // Get tag nodes for relationships
  const tagNodes = rootNode?.children.filter(
    (node) => node.metadata?.type === "tagging",
  );

  // Initialize form with react-hook-form
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      parentId: defaultParentId,
      nodeType:
        defaultMetadata?.type === "root" || !defaultMetadata?.type
          ? "loop"
          : defaultMetadata.type,
      selectedRelatedNodes: [],
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    register,
    formState: { isSubmitting },
  } = form;

  // Populate form when editing an existing node
  useEffect(() => {
    if (mode === "edit" && node) {
      reset({
        name: node.name || "",
        description: node.content || "",
        parentId: node.parent_node || defaultParentId,
        nodeType: (node.metadata?.type as "list" | "tagging" | "tag" | "loop") || "loop",
        selectedRelatedNodes: node.related_nodes?.map(rn => rn.id) || [],
      });
    } else if (mode === "create") {
      reset({
        name: "",
        description: "",
        parentId: defaultParentId,
        nodeType:
          defaultMetadata?.type === "root" || !defaultMetadata?.type
            ? "loop"
            : defaultMetadata.type,
        selectedRelatedNodes: [],
      });
    }
  }, [mode, node, defaultParentId, defaultMetadata, reset]);

  // Watch form values
  const parentId = watch("parentId");
  const nodeType = watch("nodeType");
  const selectedRelatedNodes = watch("selectedRelatedNodes");
  const name = watch("name");

  // Check if saving
  const isSaving = addUpdateNodeMutation.isPending || isSubmitting;

  // Function to create new items in categories
  const handleCreateNewItem = async (
    categoryId: number,
    itemName: string,
  ): Promise<number> => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const result = await addUpdateNodeMutation.mutateAsync({
      name: itemName,
      parentNode: categoryId,
      userId: user.id,
      // Give the new item the same metadata type as the category (tagging)
      metadata: { type: "tagging" },
    });

    if ("result" in result) {
      return result.result.id;
    } else {
      throw new Error("Failed to create new item");
    }
  };

  // Determine if the current node is structural based on metadata
  const isStructuralMode = node?.metadata?.type === "list";

  const handleSave = handleSubmit(async (data: FormData) => {
    if (!data.name.trim() || !user?.id) return;

    let metadata: Metadata | undefined = undefined;

    // Always use the selected node type
    metadata = { type: data.nodeType };

    // Add default children metadata for lists
    if (data.nodeType === "list") {
      metadata.defaultChildrenMetadata = { type: "loop" };
    }

    try {
      await addUpdateNodeMutation.mutateAsync({
        nodeId: mode === "edit" && node ? node.id : undefined,
        name: data.name.trim(),
        content: data.description.trim() || undefined,
        parentNode: data.parentId || undefined,
        userId: user.id,
        metadata: metadata, // Always provide metadata
        relatedNodeIds: data.selectedRelatedNodes,
        relationType: "tagged_with",
      });

      // In create mode, check if user wants to create more
      if (mode === "create" && createMore) {
        // Reset form for next item but keep parent and type
        reset({
          name: "",
          description: "",
          parentId: data.parentId, // Keep the same parent
          nodeType: data.nodeType, // Keep the same type
          selectedRelatedNodes: [], // Clear tags for new item
        });

        // Focus back to name field for next item
        setTimeout(() => {
          const nameInput = document.getElementById("name");
          if (nameInput) {
            nameInput.focus();
          }
        }, 100);
      } else {
        handleClose(); // Close the sheet after successful save
      }
    } catch (error) {
      console.error(`Failed to ${mode} node:`, error);
    }
  });

  const handleSaveAndOpen = handleSubmit(async (data: FormData) => {
    if (!data.name.trim() || !user?.id) return;

    let metadata: Metadata | undefined = undefined;

    // Always use the selected node type
    metadata = { type: data.nodeType };

    // Add default children metadata for lists
    if (data.nodeType === "list") {
      metadata.defaultChildrenMetadata = { type: "loop" };
    }

    try {
      if (mode === "create") {
        const result = await addUpdateNodeMutation.mutateAsync({
          name: data.name.trim(),
          content: data.description.trim() || undefined,
          parentNode: data.parentId || undefined,
          userId: user.id,
          metadata: metadata, // Always provide metadata
          relatedNodeIds: data.selectedRelatedNodes,
          relationType: "tagged_with",
        });

        handleClose(); // Close the sheet after successful save

        // Navigate to the created item
        if ("result" in result) {
          navigate(`/lists/${result.result.id}`);
        }
      }
    } catch (error) {
      console.error(`Failed to ${mode} node:`, error);
    }
  });

  const handleClose = () => {
    onClose();
    // Reset form after close animation
    setTimeout(() => {
      if (mode === "create") {
        reset({
          name: "",
          description: "",
          parentId: defaultParentId,
          nodeType:
            defaultMetadata?.type === "root" || !defaultMetadata?.type
              ? "loop"
              : defaultMetadata.type,
          selectedRelatedNodes: [],
        });
      } else if (mode === "edit" && node) {
        // Reset to original node values when canceling edit
        reset({
          name: node.name || "",
          description: node.content || "",
          parentId: node.parent_node || defaultParentId,
          nodeType: (node.metadata?.type as "list" | "tagging" | "tag" | "loop") || "loop",
          selectedRelatedNodes: node.related_nodes?.map(rn => rn.id) || [],
        });
      }
    }, 300);
  };

  // Determine the mode-specific title and description
  const getModeSpecificContent = () => {
    if (isStructuralMode) {
      return {
        title: mode === "create" ? "Create New List" : "Edit List",
        description:
          mode === "create"
            ? "Create a new list to organize your tasks and projects."
            : "Make changes to your list. Click save when you're done.",
        namePlaceholder: "Enter list name",
        descriptionPlaceholder: "Enter list description (optional)",
      };
    } else {
      return {
        title: mode === "create" ? "Create New Task" : "Edit Task",
        description:
          mode === "create"
            ? "Create a new task. You can optionally assign it to a parent."
            : "Make changes to your task. Click save when you're done.",
        namePlaceholder: "Enter task name",
        descriptionPlaceholder: "Enter task description (optional)",
      };
    }
  };

  const modeContent = getModeSpecificContent();

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{modeContent.title}</SheetTitle>
          <SheetDescription>{modeContent.description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className="flex flex-1 flex-col">
          <div className="custom-scrollbar flex flex-1 flex-col gap-7 overflow-y-auto py-4 pr-3">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder={modeContent.namePlaceholder}
                disabled={isSaving}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={modeContent.descriptionPlaceholder}
                rows={3}
                disabled={isSaving}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded">Enter</kbd> to save
              </p>
            </div>

            {/* Show parent selection for create mode or edit mode with existing parent */}
            {availableParents && availableParents.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium">Parent Item</Label>
                </div>
                <div>
                  <SingleSelectAutocomplete
                    hierarchicalOptions={[
                      ...convertToHierarchicalOptions(allNodesTree),
                    ]}
                    value={parentId}
                    onChange={(selectedId) => {
                      setValue("parentId", selectedId as number | null);
                    }}
                    placeholder="Select a parent item..."
                    disabled={isSaving}
                    freeSolo={false}
                    noOptionsText="No parent items found"
                  />
                </div>
              </div>
            )}

            {/* Show related nodes selection when not in structural mode or when creating items in a list */}
            <TagsSelector
              tagNodes={tagNodes || []}
              selectedRelatedNodes={selectedRelatedNodes}
              onSelectionChange={(newSelection) =>
                setValue("selectedRelatedNodes", newSelection)
              }
              disabled={isSaving}
              defaultExpanded={!isManagingLists}
              onCreateNewItem={handleCreateNewItem}
            />

            {/* Node type selection when managing lists or editing existing nodes */}
            <NodeTypeSelector
              nodeType={nodeType}
              onNodeTypeChange={(newType) => {
                setValue("nodeType", newType);
              }}
              disabled={isSaving}
              defaultExpanded={isManagingLists}
            />
          </div>

          {/* Create more option for create mode */}
          {mode === "create" && (
            <div className="flex items-center justify-end space-x-2 px-1 py-2 mb-2">
              <Checkbox
                id="create-more"
                checked={createMore}
                onCheckedChange={(checked) => setCreateMore(checked === true)}
              />
              <Label htmlFor="create-more" className="text-sm font-normal cursor-pointer">
                Create more items
              </Label>
            </div>
          )}

          <SheetFooter className="flex-shrink-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            {mode === "create" && (
              <Button
                type="button"
                onClick={handleSaveAndOpen}
                disabled={!name.trim() || isSaving}
                variant="outline"
              >
                {isSaving ? "Creating..." : "Create and open"}
              </Button>
            )}
            <Button type="submit" disabled={!name.trim() || isSaving}>
              {isSaving
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create"
                  : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
