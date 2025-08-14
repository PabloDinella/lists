import { useEffect, useState } from "react";
import { AppLayout } from "./app-layout";
import { Container } from "./ui/container";
import { supabase } from "@/lib/supabase";
import { useCreateNode } from "@/hooks/use-create-node";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { MovableList } from "./tag-management/movable-list";
import { EditNodeSheet } from "./tag-management/edit-node-sheet";
import { useListData } from "./tag-management/use-list-data";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

export function TagManagement() {
  const [userId, setUserId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<DBNode | null>(null);
  const [sheetMode, setSheetMode] = useState<'edit' | 'create'>('edit');

  const createNodeMutation = useCreateNode();
  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();

  // Get data using custom hook
  const { flattenedItems, isLoading, isError } = useListData({
    userId,
  });

  // Calculate available parents (only root nodes)
  const availableParents = flattenedItems
    .filter(item => item.node.parent_node === null)
    .map(item => item.node);

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
    setSheetMode('edit');
  };

  const handleCreateStart = () => {
    setEditingNode(null);
    setSheetMode('create');
  };

  const handleSave = async (name: string, description: string, parentId: number | null) => {
    if (!userId) return;
    
    try {
      if (sheetMode === 'create') {
        await createNodeMutation.mutateAsync({
          name: name,
          content: description || undefined,
          parent_node: parentId || undefined,
          user_id: userId,
        });
      } else if (sheetMode === 'edit' && editingNode) {
        await updateNodeMutation.mutateAsync({
          node_id: editingNode.id,
          name: name,
          content: description || undefined,
          parent_node: parentId,
          user_id: userId,
        });
      }
      handleSheetClose(); // Close the sheet after successful save
    } catch (error) {
      console.error(`Failed to ${sheetMode} node:`, error);
    }
  };

  const handleSheetClose = () => {
    setEditingNode(null);
    setSheetMode('edit'); // Reset to edit mode
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
      onNewItem={handleCreateStart}
      newItemLabel="New List"
    >
      <Container size="md">
        {isLoading && <p>Loading lists…</p>}
        {isError && (
          <p className="text-red-500 text-sm">Failed to load lists.</p>
        )}
        {!isLoading && !isError && (
          <div className="space-y-4">
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
        availableParents={availableParents}
        isOpen={sheetMode === 'create' || editingNode !== null}
        onClose={handleSheetClose}
        onSave={handleSave}
        isSaving={createNodeMutation.isPending || updateNodeMutation.isPending}
        mode={sheetMode}
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
