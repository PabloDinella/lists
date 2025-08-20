import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Select } from "../ui/select";
import { List, Tag } from "lucide-react";

import { CategoryMultiSelect } from "./category-multi-select";
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
}

export function EditNodeSheet({
  node,
  isOpen,
  onClose,
  mode,
}: EditNodeSheetProps) {
  const nodeId = useNodeId();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [nodeType, setNodeType] = useState<"list" | "tagging">("list");
  const [selectedRelatedNodes, setSelectedRelatedNodes] = useState<number[]>([]);

  const { user } = useAuth();
  const addUpdateNodeMutation = useAddUpdateNode();

  // Determine if we're managing lists (root level) or viewing a specific list
  const isManagingLists = !nodeId;

  // Get all nodes to compute derived data
  const {
    hierarchicalTree: allNodesTree,
  } = useListData({
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

  const filter = (node: TreeNode) =>
    node.metadata?.type === "list" || node.metadata?.type === "tagging";

  // Compute derived data
  const flattenedAllItems = allNodesTree.reduce<TreeNode[]>(flattenNodesTree, []);
  const rootNode = allNodesTree.find((item) => item.parent_node === null);
  
  // Calculate available parents
  const availableParents = isManagingLists
    ? flattenedAllItems.filter(filter)
    : node?.metadata?.type === "loop"
      ? flattenedAllItems.filter((item) => item.metadata?.type === "list")
      : undefined;

  // Get tag nodes for relationships
  const tagNodes = rootNode?.children.filter(
    (node) => node.metadata?.type === "tagging",
  );

  // Default parent ID
  const defaultParentId = isManagingLists ? rootNode?.id : nodeId;

  // Check if saving
  const isSaving = addUpdateNodeMutation.isPending;

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

  // Reset form when node changes or sheet opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && node) {
        setName(node.name);
        setDescription(node.content || "");
        setParentId(node.parent_node);
        // Set node type based on existing metadata
        if (node?.metadata?.type === "list" || node?.metadata?.type === "tagging") {
          setNodeType(node.metadata.type);
        } else {
          setNodeType("list");
        }
      } else if (mode === "create") {
        setName("");
        setDescription("");
        setParentId(defaultParentId || null);
        setNodeType("list");
      }
    }
  }, [node, isOpen, mode, defaultParentId]);

  const handleSave = async () => {
    if (!name.trim() || !user?.id) return;

    let metadata: Metadata | undefined = undefined;

    if (isManagingLists) {
      metadata = { type: nodeType };

      // Add default children metadata for lists
      if (nodeType === "list") {
        metadata.defaultChildrenMetadata = { type: "loop" };
      }
    }

    try {
      await addUpdateNodeMutation.mutateAsync({
        nodeId: mode === "edit" && node ? node.id : undefined,
        name: name.trim(),
        content: description.trim() || undefined,
        parentNode: parentId || undefined,
        userId: user.id,
        metadata: metadata || undefined,
        relatedNodeIds: selectedRelatedNodes,
        relationType: "tagged_with",
      });

      handleClose(); // Close the sheet after successful save
    } catch (error) {
      console.error(`Failed to ${mode} node:`, error);
    }
  };

  const handleSaveAndOpen = async () => {
    if (!name.trim() || !user?.id) return;

    let metadata: Metadata | undefined = undefined;

    if (isManagingLists) {
      metadata = { type: nodeType };

      // Add default children metadata for lists
      if (nodeType === "list") {
        metadata.defaultChildrenMetadata = { type: "loop" };
      }
    }

    try {
      if (mode === "create") {
        const result = await addUpdateNodeMutation.mutateAsync({
          name: name.trim(),
          content: description.trim() || undefined,
          parentNode: parentId || undefined,
          userId: user.id,
          metadata: metadata || undefined,
          relatedNodeIds: selectedRelatedNodes,
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
  };

  const handleClose = () => {
    onClose();
    // Reset form after close animation
    setTimeout(() => {
      setName("");
      setDescription("");
      setParentId(null);
      setNodeType("list");
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
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{modeContent.title}</SheetTitle>
          <SheetDescription>{modeContent.description}</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={modeContent.namePlaceholder}
              disabled={isSaving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder={modeContent.descriptionPlaceholder}
              rows={3}
              disabled={isSaving}
            />
          </div>

          {/* Node type selection when managing lists */}
          {isManagingLists && mode === "create" && (
            <div className="grid gap-3">
              <Label>Type</Label>
              <p className="text-sm text-muted-foreground">
                What's the purpose of this item
              </p>
              <div className="grid gap-3">
                <div
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                    nodeType === "list"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setNodeType("list")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-md p-2 ${
                        nodeType === "list"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-1 text-sm font-medium">List</h4>
                      <p className="text-xs text-muted-foreground">
                        Lists are intended to be used for organizing your items,
                        tasks, projects, etc.
                      </p>
                    </div>
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        nodeType === "list"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {nodeType === "list" && (
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                    nodeType === "tagging"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setNodeType("tagging")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-md p-2 ${
                        nodeType === "tagging"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <Tag className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-1 text-sm font-medium">Tagging</h4>
                      <p className="text-xs text-muted-foreground">
                        Tagging is for items that can be attached to List's
                        items, like Context and Area of Focus.
                      </p>
                    </div>
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        nodeType === "tagging"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {nodeType === "tagging" && (
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show parent selection for create mode or edit mode with existing parent */}
          {/* {(mode === 'create' || (mode === 'edit' && node && node.parent_node !== null)) && ( */}
          {availableParents && availableParents.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="parent">Parent Item</Label>
              <Select
                id="parent"
                value={parentId?.toString() || ""}
                onChange={(e) =>
                  setParentId(e.target.value ? parseInt(e.target.value) : null)
                }
                disabled={isSaving}
              >
                <option value={rootNode?.id.toString() ?? ""}>
                  No parent (make it a root item)
                </option>
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id.toString()}>
                    {parent.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Only root items (items without parents) can be selected as
                parents.
              </p>
            </div>
          )}
          {/* )} */}

          {/* Show related nodes selection when not in structural mode or when creating items in a list */}
          {tagNodes && tagNodes.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Related Items by Category
              </Label>

              <CategoryMultiSelect
                firstLevelNodes={tagNodes}
                selectedRelatedNodes={selectedRelatedNodes}
                onSelectionChange={setSelectedRelatedNodes}
                disabled={isSaving}
                onCreateNewItem={handleCreateNewItem}
              />
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          {mode === "create" && (
            <Button
              onClick={handleSaveAndOpen}
              disabled={!name.trim() || isSaving}
              variant="outline"
            >
              {isSaving ? "Creating..." : "Create and open"}
            </Button>
          )}
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Create"
                : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
