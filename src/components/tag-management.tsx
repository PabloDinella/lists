import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "./app-layout";
import { Container } from "./ui/container";
import { supabase } from "@/lib/supabase";
import { useCreateNode } from "@/hooks/use-create-node";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { MovableList } from "./tag-management/movable-list";
import { HierarchicalMovableList } from "./tag-management/hierarchical-movable-list";
import { EditNodeSheet } from "./tag-management/edit-node-sheet";
import { useListData } from "./tag-management/use-list-data";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

export function TagManagement() {
  const { listId } = useParams<{ listId: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<DBNode | null>(null);
  const [sheetMode, setSheetMode] = useState<'edit' | 'create'>('edit');
  const [viewMode, setViewMode] = useState<'flat' | 'hierarchical'>('flat');

  const createNodeMutation = useCreateNode();
  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();

  // Get data using custom hook
  const { hierarchicalTree, flattenedItems, isLoading, isError } = useListData({
    userId,
    parentNodeId: listId ? parseInt(listId, 10) : null,
  });

  // Calculate available parents (only root nodes)
  const availableParents = hierarchicalTree
    .filter(node => node.parent_node === null);

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
      title={listId ? "List Items" : "Manage Lists"}
      onNewItem={handleCreateStart}
      newItemLabel={listId ? "New Item" : "New List"}
    >
      <Container size="md">
        {isLoading && <p>Loading lists…</p>}
        {isError && (
          <p className="text-red-500 text-sm">Failed to load lists.</p>
        )}
        {!isLoading && !isError && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {listId ? "Items" : "Your lists"}
            </h2>
            
            {/* Toggle between views */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'flat' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                Flat List
              </button>
              <button
                onClick={() => setViewMode('hierarchical')}
                className={`px-3 py-1 rounded text-sm ${
                  viewMode === 'hierarchical' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                Tree View
              </button>
            </div>

            {flattenedItems.length > 0 ? (
              viewMode === 'flat' ? (
                <MovableList
                  flattenedItems={flattenedItems}
                  userId={userId}
                  onEditStart={handleEditStart}
                  onDelete={handleDelete}
                />
              ) : (
                <HierarchicalMovableList
                  hierarchicalTree={hierarchicalTree}
                  userId={userId}
                  onEditStart={handleEditStart}
                  onDelete={handleDelete}
                />
              )
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {listId ? "No items found in this list." : "No lists found."}
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
