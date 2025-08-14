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
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

interface EditNodeSheetProps {
  node: DBNode | null;
  availableParents: DBNode[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, parentId: number | null) => void;
  isSaving?: boolean;
}

export function EditNodeSheet({
  node,
  availableParents,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: EditNodeSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);

  // Reset form when node changes or sheet opens
  useEffect(() => {
    if (node && isOpen) {
      setName(node.name);
      setDescription(node.content || "");
      setParentId(node.parent_node);
    }
  }, [node, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), parentId);
  };

  const handleClose = () => {
    onClose();
    // Reset form after close animation
    setTimeout(() => {
      setName("");
      setDescription("");
      setParentId(null);
    }, 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Item</SheetTitle>
          <SheetDescription>
            Make changes to your item. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
              disabled={isSaving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Enter item description (optional)"
              rows={3}
              disabled={isSaving}
            />
          </div>
          {/* Only show parent selection if node already has a parent */}
          {node && node.parent_node !== null && (
            <div className="grid gap-2">
              <Label htmlFor="parent">Parent Item</Label>
              <Select
                id="parent"
                value={parentId?.toString() || ""}
                onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value) : null)}
                disabled={isSaving}
              >
                <option value="">No parent (make it a root item)</option>
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id.toString()}>
                    {parent.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Only root items (items without parents) can be selected as parents.
              </p>
            </div>
          )}
          {node && (
            <div className="text-xs text-muted-foreground">
              Created {new Date(node.created_at).toLocaleString()} • ID: {node.id}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
