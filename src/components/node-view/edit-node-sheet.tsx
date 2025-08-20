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
  const [nodeType, setNodeType] = useState<"list" | "tagging" | "tag" | "loop">("list");
  const [selectedRelatedNodes, setSelectedRelatedNodes] = useState<number[]>(
    [],
  );

  const { user } = useAuth();
  const addUpdateNodeMutation = useAddUpdateNode();

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

  const filter = (node: TreeNode) =>
    node.metadata?.type === "list" || node.metadata?.type === "tagging";

  // Compute derived data
  const flattenedAllItems = allNodesTree.reduce<TreeNode[]>(
    flattenNodesTree,
    [],
  );
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
        if (
          node?.metadata?.type === "list" ||
          node?.metadata?.type === "tagging" ||
          node?.metadata?.type === "tag" ||
          node?.metadata?.type === "loop"
        ) {
          setNodeType(node.metadata.type);
        } else {
          setNodeType("list");
        }
        // Reset related nodes - we'll need to load existing relationships if needed
        setSelectedRelatedNodes([]);
      } else if (mode === "create") {
        setName("");
        setDescription("");
        setParentId(defaultParentId || null);
        setNodeType("list");
        setSelectedRelatedNodes([]);
      }
    }
  }, [node, isOpen, mode, defaultParentId]);

  const handleSave = async () => {
    if (!name.trim() || !user?.id) return;

    let metadata: Metadata | undefined = undefined;

    // Always use the selected node type
    metadata = { type: nodeType };

    // Add default children metadata for lists
    if (nodeType === "list") {
      metadata.defaultChildrenMetadata = { type: "loop" };
    }

    try {
      await addUpdateNodeMutation.mutateAsync({
        nodeId: mode === "edit" && node ? node.id : undefined,
        name: name.trim(),
        content: description.trim() || undefined,
        parentNode: parentId || undefined,
        userId: user.id,
        metadata: metadata, // Always provide metadata
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

    // Always use the selected node type
    metadata = { type: nodeType };

    // Add default children metadata for lists
    if (nodeType === "list") {
      metadata.defaultChildrenMetadata = { type: "loop" };
    }

    try {
      if (mode === "create") {
        const result = await addUpdateNodeMutation.mutateAsync({
          name: name.trim(),
          content: description.trim() || undefined,
          parentNode: parentId || undefined,
          userId: user.id,
          metadata: metadata, // Always provide metadata
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
      setSelectedRelatedNodes([]);
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
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{modeContent.title}</SheetTitle>
          <SheetDescription>{modeContent.description}</SheetDescription>
        </SheetHeader>

        <div 
          className="flex flex-col gap-7 py-4 pr-3 flex-1 overflow-y-auto custom-scrollbar"
        >
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

          {/* Show parent selection for create mode or edit mode with existing parent */}
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
            </div>
          )}

          {/* Show related nodes selection when not in structural mode or when creating items in a list */}
          <TagsSelector
            tagNodes={tagNodes || []}
            selectedRelatedNodes={selectedRelatedNodes}
            onSelectionChange={setSelectedRelatedNodes}
            disabled={isSaving}
            defaultExpanded={!isManagingLists}
            onCreateNewItem={handleCreateNewItem}
          />

          {/* Node type selection when managing lists or editing existing nodes */}
          <NodeTypeSelector
            nodeType={nodeType}
            onNodeTypeChange={setNodeType}
            disabled={isSaving}
            defaultExpanded={isManagingLists || (mode === "edit" && !!node?.metadata?.type)}
          />
        </div>

        <SheetFooter className="flex-shrink-0">
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
