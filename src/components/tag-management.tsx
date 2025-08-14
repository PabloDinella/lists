import { useEffect, useState } from "react";
import { AppLayout } from "./app-layout";
import { Container } from "./ui/container";
import { supabase } from "@/lib/supabase";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { CreateListForm } from "./tag-management/create-list-form";
import { DraggableList } from "./tag-management/draggable-list";
import { MovableList } from "./tag-management/movable-list";
import { EditNodeSheet } from "./tag-management/edit-node-sheet";
import { useListData } from "./tag-management/use-list-data";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

export function TagManagement() {
  const [userId, setUserId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<DBNode | null>(null);
  const [creating, setCreating] = useState(false);

  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();

  // Get data using custom hook
  const { flattenedItems, ordering, isLoading, isError } = useListData({
    userId,
  });

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleEditStart = (node: DBNode) => {
    setEditingNode(node);
  };

  const handleEditSave = async (name: string, description: string) => {
    if (!editingNode || !userId) return;
    try {
      await updateNodeMutation.mutateAsync({
        node_id: editingNode.id,
        name: name,
        content: description || undefined,
        user_id: userId,
      });
      setEditingNode(null);
    } catch (error) {
      console.error("Failed to update list:", error);
    }
  };

  const handleEditCancel = () => {
    setEditingNode(null);
  };

  const handleDelete = async (nodeId: number) => {
    if (!userId) return;
    try {
      await deleteNodeMutation.mutateAsync({
        node_id: nodeId,
        user_id: userId,
      });
    } catch (error) {
      console.error("Failed to delete list:", error);
    }
  };

  if (!userId) {
    return (
      <AppLayout title="Manage Lists">
        <p>Please sign in to manage lists.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Manage Lists"
      onNewItem={() => setCreating(true)}
      newItemLabel="New List"
    >
      <Container size="md">
        {isLoading && <p>Loading lists…</p>}
        {isError && (
          <p className="text-red-500 text-sm">Failed to load lists.</p>
        )}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {creating && (
              <CreateListForm
                userId={userId}
                ordering={ordering}
                onCancel={() => setCreating(false)}
              />
            )}

            {flattenedItems.length > 0 ? (
              <MovableList
                flattenedItems={flattenedItems}
                userId={userId}
                onEditStart={handleEditStart}
                onDelete={handleDelete}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No lists found.
              </p>
            )}
          </div>
        )}
      </Container>

      <EditNodeSheet
        node={editingNode}
        isOpen={editingNode !== null}
        onClose={handleEditCancel}
        onSave={handleEditSave}
        isSaving={updateNodeMutation.isPending}
      />
      {/* <Container size="md">
        {isLoading && <p>Loading lists…</p>}
        {isError && <p className="text-red-500 text-sm">Failed to load lists.</p>}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {creating && (
              <CreateListForm
                userId={userId}
                ordering={ordering}
                onCancel={() => setCreating(false)}
              />
            )}

            {flattenedItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">React Beautiful DnD</h2>
                  <DraggableList
                    flattenedItems={flattenedItems}
                    userId={userId}
                    editingId={editingId}
                    editName={editName}
                    editDescription={editDescription}
                    onEditStart={handleEditStart}
                    onEditNameChange={setEditName}
                    onEditDescriptionChange={setEditDescription}
                    onEditSave={handleEditSave}
                    onEditCancel={handleEditCancel}
                    onDelete={handleDelete}
                  />
                </div>
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">React Movable</h2>
                  <MovableList
                    flattenedItems={flattenedItems}
                    userId={userId}
                    editingId={editingId}
                    editName={editName}
                    editDescription={editDescription}
                    onEditStart={handleEditStart}
                    onEditNameChange={setEditName}
                    onEditDescriptionChange={setEditDescription}
                    onEditSave={handleEditSave}
                    onEditCancel={handleEditCancel}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No lists found.
              </p>
            )}
          </div>
        )}
      </Container> */}
    </AppLayout>
  );
}
