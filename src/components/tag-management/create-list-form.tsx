import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCreateNode } from "@/hooks/use-create-node";
import { useUpsertOrdering } from "@/hooks/use-ordering";

interface CreateListFormProps {
  userId: string;
  ordering?: { order: number[] } | null;
  onCancel: () => void;
}

export function CreateListForm({ userId, ordering, onCancel }: CreateListFormProps) {
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const createNodeMutation = useCreateNode();
  const upsertOrdering = useUpsertOrdering();

  const handleCreateList = async () => {
    if (!userId) return;
    const name = newName.trim();
    const content = newDescription.trim();
    if (!name) return;
    
    try {
      const res = await createNodeMutation.mutateAsync({
        name,
        content: content || undefined,
        user_id: userId,
      });
      
      // Reset form state functionally
      setNewName("");
      setNewDescription("");
      onCancel();
      
      // Update ordering functionally
      if (res && "result" in res) {
        const currentOrder = ordering?.order ?? [];
        const newOrder = [...currentOrder, res.result.id];
        await upsertOrdering.mutateAsync({ user_id: userId, root_node: null, order: newOrder });
      }
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  const handleCancel = () => {
    setNewName("");
    setNewDescription("");
    onCancel();
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="List name"
        />
        <Input
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <Button
          size="sm"
          onClick={handleCreateList}
          disabled={createNodeMutation.isPending || !newName.trim()}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={createNodeMutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
