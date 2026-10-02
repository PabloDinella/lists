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
import { ShortcutHint } from "../ui/shortcut-hint";
import { SingleSelectAutocomplete } from "../ui/single-select-autocomplete";

import { NodeTypeSelector } from "./node-type-selector";
import { TagsSelector } from "./tags-selector";
import { ListMembershipField } from "./list-membership-field";
import { DueDatePicker } from "./due-date-picker";
import { useAddUpdateNode } from "@/hooks/use-add-update-node";
import { useAuth } from "@/hooks/use-auth";
import { useNodeId } from "@/hooks/use-node-id";
import { useSettings } from "@/hooks/use-settings";
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
  dueDate: string;
  parentId: number | null;
  nodeType: "list" | "tagging" | "tag" | "loop";
  selectedRelatedNodes: number[];
}

const normalizeDescription = (description: string): string | null => {
  const trimmedDescription = description.trim();
  return trimmedDescription ? trimmedDescription : null;
};

export function EditNodeSheet({
  node,
  isOpen,
  onClose,
  mode,
  defaultParentId,
  defaultMetadata,
}: EditNodeSheetProps) {
  const nodeId = useNodeId();

  const { user } = useAuth();
  const addUpdateNodeMutation = useAddUpdateNode();

  // Get user settings for quick list buttons
  const { data: settings } = useSettings(user?.id || null);

  const [sheetContent, setSheetContent] = useState<HTMLDivElement | null>(null);

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

  const getSelectedTagIds = (relatedNodes: Node["related_nodes"] = []) =>
    relatedNodes
      .filter((relatedNode) => relatedNode.relation_type === "tagged_with")
      .map((relatedNode) => relatedNode.id);

  // Initialize form with react-hook-form
  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      dueDate: "",
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
        dueDate: node.metadata?.dueDate || "",
        parentId: node.parent_node || defaultParentId,
        nodeType:
          (node.metadata?.type as "list" | "tagging" | "tag" | "loop") ||
          "loop",
        selectedRelatedNodes: getSelectedTagIds(node.related_nodes),
      });
    } else if (mode === "create") {
      reset({
        name: "",
        description: "",
        dueDate: "",
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
  const dueDate = watch("dueDate");
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

  const saveNode = async (data: FormData, createAnother: boolean) => {
    if (!data.name.trim() || !user?.id) return;

    const metadata: Metadata = {
      ...(mode === "edit" ? node?.metadata : defaultMetadata),
      type: data.nodeType,
    };

    if (data.dueDate) {
      metadata.dueDate = data.dueDate;
    } else {
      delete metadata.dueDate;
    }

    // Add default children metadata for lists
    if (data.nodeType === "list") {
      metadata.defaultChildrenMetadata = { type: "loop" };
    }

    try {
      await addUpdateNodeMutation.mutateAsync({
        nodeId: mode === "edit" && node ? node.id : undefined,
        name: data.name.trim(),
        content: normalizeDescription(data.description),
        parentNode: data.parentId || undefined,
        userId: user.id,
        metadata: metadata, // Always provide metadata
        relatedNodeIds: data.selectedRelatedNodes,
        relationType: "tagged_with",
      });

      if (mode === "create" && createAnother) {
        // Reset form for next item but keep parent and type
        reset({
          name: "",
          description: "",
          dueDate: "",
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
  };

  const handleSave = handleSubmit((data) => saveNode(data, false));
  const handleCreateMore = handleSubmit((data) => saveNode(data, true));

  const handleClose = () => {
    onClose();
    // Reset form after close animation
    setTimeout(() => {
      if (mode === "create") {
        reset({
          name: "",
          description: "",
          dueDate: "",
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
          dueDate: node.metadata?.dueDate || "",
          parentId: node.parent_node || defaultParentId,
          nodeType:
            (node.metadata?.type as "list" | "tagging" | "tag" | "loop") ||
            "loop",
          selectedRelatedNodes: getSelectedTagIds(node.related_nodes),
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
      <SheetContent
        ref={setSheetContent}
        className="flex h-full w-full flex-col sm:w-[36rem] sm:max-w-[90vw]"
        onKeyDownCapture={(event) => {
          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey) &&
            !event.altKey &&
            !event.repeat
          ) {
            if (event.shiftKey && mode !== "create") return;
            event.preventDefault();
            event.stopPropagation();
            if (!isSaving && name.trim()) {
              void (event.shiftKey ? handleCreateMore() : handleSave());
            }
          }
        }}
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>{modeContent.title}</SheetTitle>
          <SheetDescription>{modeContent.description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className="flex flex-1 flex-col min-h-0">
          <div className="custom-scrollbar flex flex-1 flex-col gap-7 overflow-y-auto py-4 pr-3 min-h-0">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder={modeContent.namePlaceholder}
                disabled={isSaving}
                autoComplete="off"
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
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due date</Label>
              <DueDatePicker
                id="dueDate"
                value={dueDate}
                onChange={(value) => setValue("dueDate", value)}
                disabled={isSaving}
                portalContainer={sheetContent}
              />
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

                {/* Quick list buttons */}
                {settings && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Quick Lists
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {settings.inbox && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValue("parentId", settings.inbox)}
                          disabled={isSaving}
                          className={
                            parentId === settings.inbox ? "bg-accent" : ""
                          }
                        >
                          Inbox
                        </Button>
                      )}
                      {settings.nextActions && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setValue("parentId", settings.nextActions)
                          }
                          disabled={isSaving}
                          className={
                            parentId === settings.nextActions ? "bg-accent" : ""
                          }
                        >
                          Next Actions
                        </Button>
                      )}
                      {settings.projects && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setValue("parentId", settings.projects)
                          }
                          disabled={isSaving}
                          className={
                            parentId === settings.projects ? "bg-accent" : ""
                          }
                        >
                          Projects
                        </Button>
                      )}
                      {settings.waiting && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValue("parentId", settings.waiting)}
                          disabled={isSaving}
                          className={
                            parentId === settings.waiting ? "bg-accent" : ""
                          }
                        >
                          Waiting
                        </Button>
                      )}
                      {settings.somedayMaybe && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setValue("parentId", settings.somedayMaybe)
                          }
                          disabled={isSaving}
                          className={
                            parentId === settings.somedayMaybe
                              ? "bg-accent"
                              : ""
                          }
                        >
                          Someday/Maybe
                        </Button>
                      )}
                      {settings.scheduled && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setValue("parentId", settings.scheduled)
                          }
                          disabled={isSaving}
                          className={
                            parentId === settings.scheduled ? "bg-accent" : ""
                          }
                        >
                          Scheduled
                        </Button>
                      )}
                    </div>
                  </div>
                )}
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

            {mode === "edit" && node && user?.id && (
              <ListMembershipField
                node={node}
                allNodes={flattenedAllItems}
                userId={user.id}
              />
            )}

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

          <SheetFooter className="mt-auto flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
              <ShortcutHint shortcut="Esc" />
            </Button>
            {mode === "create" && (
              <Button
                type="button"
                onClick={handleCreateMore}
                disabled={!name.trim() || isSaving}
                variant="outline"
              >
                {isSaving ? "Creating..." : "Create and add another"}
                <ShortcutHint shortcut="Mod+Shift+Enter" />
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
              <ShortcutHint shortcut="Mod+Enter" />
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
