import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "./ui/button";
import { AppLayout } from "./app-layout";
import { Input } from "./ui/input";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useItems } from "@/hooks/use-items";
import { useCreateItem } from "@/hooks/use-create-item";
import { useLists } from "@/hooks/use-lists";
import { supabase } from "@/lib/supabase";

export function ItemManager() {
  const { listId } = useParams<{ listId: string }>();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: { id: string } | null } | null) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Get the list data to show the list name
  const { data: lists } = useLists(user ? user.id : "");
  const currentList = lists?.find(list => list.id === parseInt(listId || "0"));

  // Get items for this list
  const { data: items, isLoading } = useItems(listId ? parseInt(listId) : null);
  
  // Create item mutation
  const createItemMutation = useCreateItem();

  if (!user) {
    return <div>Please sign in to view list items.</div>;
  }

  if (!listId) {
    return <div>No list selected.</div>;
  }

  const handleCreateItem = async () => {
    if (!newItemTitle.trim() || !user?.id) return;
    
    try {
      await createItemMutation.mutateAsync({
        title: newItemTitle.trim(),
        listId: parseInt(listId),
        userId: user.id
      });
      setNewItemTitle("");
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    // TODO: Implement deleteItem API call
    console.log("Deleting item:", itemId);
    // When delete API is implemented, it should also invalidate the query
  };

  return (
    <AppLayout 
      title={currentList ? `${currentList.name} Items` : "List Items"}
      onNewItem={() => {}}
      newItemLabel="New Item"
    >
      {/* Quick Add Item */}
      <div className="flex items-center space-x-2 mb-6">
        <Input
          placeholder="Add a new item..."
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateItem()}
          className="flex-1"
          disabled={createItemMutation.isPending}
        />
        <Button 
          onClick={handleCreateItem}
          disabled={!newItemTitle.trim() || createItemMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          {createItemMutation.isPending ? "Adding..." : "Add"}
        </Button>
      </div>

      {createItemMutation.isError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-500 text-sm">
            Failed to create item. Please try again.
          </p>
        </div>
      )}

      {/* Item List */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Items</h2>
        {isLoading && <p>Loading items...</p>}
        <div className="space-y-4">
          {items && items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created: {item.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement edit functionality
                      console.log("Edit item:", item.id);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No items in this list yet. Add your first item using the form above!
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
