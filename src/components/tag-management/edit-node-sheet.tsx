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
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

interface EditNodeSheetProps {
  node: DBNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  isSaving?: boolean;
}

export function EditNodeSheet({
  node,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: EditNodeSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Reset form when node changes or sheet opens
  useEffect(() => {
    if (node && isOpen) {
      setName(node.name);
      setDescription(node.content || "");
    }
  }, [node, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
  };

  const handleClose = () => {
    onClose();
    // Reset form after close animation
    setTimeout(() => {
      setName("");
      setDescription("");
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
