import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Plus, Trash2, Edit } from "lucide-react";
import { AppLayout } from "./app-layout";
import { useLists } from "@/hooks/use-lists";
import { useCreateList } from "@/hooks/use-create-list";
import { supabase } from "@/lib/supabase";

interface EditableList {
  id: number;
  name: string;
  description?: string;
}

export function ListManagement() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const { data: lists, isLoading, isError, refetch } = useLists(user ? user.id : "");
  const createListMutation = useCreateList();
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

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

  if (!user) {
    return <div>Please sign in to manage lists.</div>;
  }

  const handleCreateList = async () => {
    if (newListName.trim() && user?.id) {
      try {
        await createListMutation.mutateAsync({ 
          name: newListName.trim(), 
          userId: user.id 
        });
        setNewListName("");
        setNewListDescription("");
        setShowCreateForm(false);
      } catch (error) {
        console.error("Failed to create list:", error);
        // You could add a toast notification here
      }
    }
  };

  // TODO: Replace with mutation and refetch
  const handleDeleteList = async () => {
    // TODO: Call backend to delete list
    await refetch();
  };

  const handleEditList = (list: EditableList) => {
    setEditingId(list.id);
    setEditName(list.name);
    setEditDescription(list.description || "");
  };

  // TODO: Replace with mutation and refetch
  const handleSaveEdit = async () => {
    // TODO: Call backend to update list
    setEditingId(null);
    await refetch();
  };

  return (
    <AppLayout 
      title="List Management" 
      onNewItem={() => setShowCreateForm(true)}
      newItemLabel="New List"
    >
      {/* Create new list form */}
      {showCreateForm && (
        <div className="bg-card border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New List</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="listName" className="block text-sm font-medium mb-2">
                List Name
              </label>
              <Input
                id="listName"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
                disabled={createListMutation.isPending}
              />
            </div>
            <div>
              <label htmlFor="listDescription" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <Input
                id="listDescription"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Enter description"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
                disabled={createListMutation.isPending}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleCreateList} 
                disabled={!newListName.trim() || createListMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                {createListMutation.isPending ? "Creating..." : "Create List"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                disabled={createListMutation.isPending}
              >
                Cancel
              </Button>
            </div>
            {createListMutation.isError && (
              <p className="text-red-500 text-sm">
                Failed to create list. Please try again.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Existing lists */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Lists</h2>
        {isLoading && <p>Loading lists...</p>}
        {isError && <p className="text-red-500">Failed to load lists.</p>}
        <div className="space-y-4">
          {lists && lists.map((list) => (
            <div key={list.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                {editingId === list.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={handleSaveEdit}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-medium">{list.name}</h3>
                    {/* No description field in backend yet */}
                  </div>
                )}
              </div>
              {editingId !== list.id && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditList(list)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeleteList}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {lists && lists.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-8">
              No lists created yet. Create your first list using the "New List" button!
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 