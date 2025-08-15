import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "./app-layout";
import { Container } from "./ui/container";
import { supabase } from "@/lib/supabase";
import { useCreateNode } from "@/hooks/use-create-node";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { HierarchicalMovableList } from "./tag-management/hierarchical-movable-list";
import { EditNodeSheet } from "./tag-management/edit-node-sheet";
import { useListData } from "./tag-management/use-list-data";
import { Button } from "./ui/button";
import { Edit } from "lucide-react";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

export function TagManagement() {
  const { listId } = useParams<{ listId: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<DBNode | null>(null);
  const [sheetMode, setSheetMode] = useState<"edit" | "create">("edit");


  // Determine if we're managing lists (root level) or viewing a specific list
  const isManagingLists = !listId;

  const createNodeMutation = useCreateNode();
  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();

  // Get data using custom hook
  const { hierarchicalTree, parentNode, isLoading, isError } = useListData({
    userId,
    parentNodeId: listId ? parseInt(listId, 10) : null,
    maxDepth: isManagingLists ? 2 : undefined, // Limit to 2 levels when managing lists
  });

  // Get all nodes to find second-level items for available parents
  const { hierarchicalTree: allNodesTree } = useListData({
    userId,
    parentNodeId: null,
    maxDepth: 2, // Always limit to 2 levels for available parents
  });

  // Get all first level nodes (nodes without parents) for the relationship fields
  const { hierarchicalTree: allFirstLevelNodes } = useListData({
    userId,
    parentNodeId: null,
    maxDepth: undefined, // No depth limit to get all first level nodes
  });

  // Calculate available parents (second level items - nodes with parent_node that is not null)
  const availableParents = isManagingLists
    ? allNodesTree
        .flatMap((rootNode) => rootNode.children)
        .filter((node) => node.parent_node !== null)
    : allNodesTree.filter((node) => node.parent_node === null);

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
    setSheetMode("edit");
  };

  const handleCreateStart = () => {
    setEditingNode(null);
    setSheetMode("create");
  };

  const handleSave = async (
    name: string,
    description: string,
    parentId: number | null
  ) => {
    if (!userId) return;

    try {
      if (sheetMode === "create") {
        await createNodeMutation.mutateAsync({
          name: name,
          content: description || undefined,
          parent_node: parentId || undefined,
          user_id: userId,
        });
      } else if (sheetMode === "edit" && editingNode) {
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
    setSheetMode("edit"); // Reset to edit mode
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
      title={isManagingLists ? "Manage Lists" : "List Items"}
      onNewItem={handleCreateStart}
      newItemLabel={isManagingLists ? "New List" : "New Item"}
    >
      <Container size="md">
        {isLoading && <p>Loading lists…</p>}
        {isError && (
          <p className="text-red-500 text-sm">Failed to load lists.</p>
        )}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {isManagingLists && (
              <h2 className="text-xl font-semibold">Your lists</h2>
            )}

            {/* Show current list name and description when viewing a specific list */}
            {!isManagingLists && parentNode && (
              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{parentNode.name}</h1>
                    {parentNode.content && (
                      <p className="text-muted-foreground">{parentNode.content}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditStart(parentNode)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {hierarchicalTree.length > 0 ? (
              <HierarchicalMovableList
                hierarchicalTree={hierarchicalTree}
                userId={userId}
                onEditStart={handleEditStart}
                onDelete={handleDelete}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {isManagingLists
                  ? "No lists found."
                  : "No items found in this list."}
              </p>
            )}
          </div>
        )}
      </Container>

      <EditNodeSheet
        node={editingNode}
        availableParents={availableParents}
        firstLevelNodes={allFirstLevelNodes.filter(node => {
          // Filter out the root node that contains the current editing item
          if (!editingNode) return true;
          
          // Find which root level node contains the editing item by traversing up the hierarchy
          const findContainingRoot = (nodeId: number): number | null => {
            const node = allNodesTree.find(n => n.id === nodeId);
            if (!node) return null;
            
            // If this node has no parent, it's a root
            if (node.parent_node === null) {
              return node.id;
            }
            
            // Otherwise, traverse up to find the root
            return findContainingRoot(node.parent_node);
          };
          
          const containingRootId = findContainingRoot(editingNode.id);

          console.log({containingRootId, nodeId: node.id, editingNode});
          
          // Filter out the root node that contains the editing item
          return containingRootId !== node.id;
        })}
        defaultParentId={isManagingLists ? undefined : parseInt(listId!, 10)}
        isOpen={sheetMode === "create" || editingNode !== null}
        onClose={handleSheetClose}
        onSave={handleSave}
        isSaving={createNodeMutation.isPending || updateNodeMutation.isPending}
        mode={sheetMode}
      />
    </AppLayout>
  );
}
