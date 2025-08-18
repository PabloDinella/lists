import { useState, useEffect } from "react";
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

import type { Json } from "@/database.types";
import { CategoryMultiSelect } from "./category-multi-select";
import { useCreateNode } from "@/hooks/use-create-node";
import { useAuth } from "@/hooks/use-auth";
import { Metadata, Node } from "@/method/access/nodeAccess/models";

type TreeNode = {
  id: number;
  name: string;
  content: string | null;
  parent_node: number | null;
  user_id: string;
  created_at: string;
  metadata: Json | null;
  children: TreeNode[];
};

interface EditNodeSheetProps {
  node: Node | null; // null when creating a new item
  rootNode?: TreeNode;
  availableParents?: TreeNode[];
  firstLevelNodes?: TreeNode[]; // All first level (root) nodes for relationship selection
  defaultParentId?: number; // Default parent ID when creating new items
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    description: string,
    parentId: number | null,
    metadata?: Metadata
  ) => void;
  onSaveAndOpen?: (
    name: string,
    description: string,
    parentId: number | null,
    metadata?: Metadata
  ) => Promise<void>;
  isSaving?: boolean;
  mode: "edit" | "create";
  isManagingLists?: boolean; // Whether we're managing lists (shows node type selection)
}

export function EditNodeSheet({
  node,
  rootNode,
  availableParents,
  firstLevelNodes,
  defaultParentId,
  isOpen,
  onClose,
  onSave,
  onSaveAndOpen,
  isSaving = false,
  mode,
  isManagingLists = false,
}: EditNodeSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [nodeType, setNodeType] = useState<"list" | "tagging">("list");
  const [selectedRelatedNodes, setSelectedRelatedNodes] = useState<number[]>(
    []
  );

  const createNodeMutation = useCreateNode();
  const { user } = useAuth();

  // Function to create new items in categories
  const handleCreateNewItem = async (
    categoryId: number,
    itemName: string
  ): Promise<number> => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const result = await createNodeMutation.mutateAsync({
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
  const isStructuralMode =
    node?.metadata &&
    typeof node.metadata === "object" &&
    node.metadata !== null &&
    !Array.isArray(node.metadata) &&
    "type" in node.metadata &&
    typeof node.metadata.type === "string" &&
    node.metadata.type === "structure";

  // Reset form when node changes or sheet opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && node) {
        setName(node.name);
        setDescription(node.content || "");
        setParentId(node.parent_node);
        // Set node type based on existing metadata
        if (
          node.metadata &&
          typeof node.metadata === "object" &&
          node.metadata !== null &&
          !Array.isArray(node.metadata) &&
          "type" in node.metadata &&
          (node.metadata.type === "list" || node.metadata.type === "tagging")
        ) {
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

  const handleSave = () => {
    if (!name.trim()) return;

    let metadata: Metadata | undefined = undefined;

    if (isManagingLists) {
      metadata = { type: nodeType };

      // Add default children metadata for lists
      if (nodeType === "list") {
        metadata.defaultChildrenMetadata = { type: "loop" };
      }
    }

    onSave(name.trim(), description.trim(), parentId, metadata);
  };

  const handleSaveAndOpen = async () => {
    if (!name.trim()) return;

    let metadata: Metadata | undefined = undefined;

    if (isManagingLists) {
      metadata = { type: nodeType };

      // Add default children metadata for lists
      if (nodeType === "list") {
        metadata.defaultChildrenMetadata = { type: "loop" };
      }
    }

    if (onSaveAndOpen) {
      await onSaveAndOpen(name.trim(), description.trim(), parentId, metadata);
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
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    nodeType === "list"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setNodeType("list")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-md ${
                        nodeType === "list"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">List</h4>
                      <p className="text-xs text-muted-foreground">
                        Lists are intended to be used for organizing your items,
                        tasks, projects, etc.
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        nodeType === "list"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {nodeType === "list" && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    nodeType === "tagging"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setNodeType("tagging")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-md ${
                        nodeType === "tagging"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <Tag className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">Tagging</h4>
                      <p className="text-xs text-muted-foreground">
                        Tagging is for items that can be attached to List's
                        items, like Context and Area of Focus.
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        nodeType === "tagging"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {nodeType === "tagging" && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
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
          {firstLevelNodes && firstLevelNodes.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Related Items by Category
              </Label>

              <CategoryMultiSelect
                firstLevelNodes={firstLevelNodes}
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
          {mode === "create" && onSaveAndOpen && (
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
