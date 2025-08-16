import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "../app-layout";
import { Container } from "../ui/container";
import { supabase } from "@/lib/supabase";
import { useCreateNode } from "@/hooks/use-create-node";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { HierarchicalMovableList } from "./hierarchical-movable-list";
import { EditNodeSheet } from "./edit-node-sheet";
import { TreeNode, useListData } from "./use-list-data";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";

const findNodeById = (
  nodeTree: TreeNode[],
  nodeId: number
): TreeNode | null => {
  return nodeTree.reduce<TreeNode | null>((found, node) => {
    if (found) return found;
    if (node.id === nodeId) return node;
    return findNodeById(node.children, nodeId);
  }, null);
};

const flattenNodesTree = (all: TreeNode[], node: TreeNode) => {
  if (node.children.length > 0) {
    return [
      ...all,
      node,
      ...node.children.reduce<TreeNode[]>(flattenNodesTree, []),
    ];
  }
  return [...all, node];
};

export function NodeView() {
  const { listId: listIdString } = useParams<{ listId: string }>();
  const listId = listIdString ? parseInt(listIdString, 10) : 0;
  const [userId, setUserId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<DBNode | null>(null);
  const [sheetMode, setSheetMode] = useState<"edit" | "create">("edit");

  // Determine if we're managing lists (root level) or viewing a specific list
  const isManagingLists = !listId;

  const filter = (node: TreeNode) =>
    node.metadata?.type === "list" ||
    node.metadata?.type === "structure" ||
    node.metadata?.type === "tagging";

  const createNodeMutation = useCreateNode();
  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();

  // Get all nodes to find second-level items for available parents
  const {
    hierarchicalTree: allNodesTree,
    isLoading,
    isError,
  } = useListData({
    userId,
  });

  const flattenedAllItems = allNodesTree.reduce<TreeNode[]>(
    flattenNodesTree,
    []
  );

  // Calculate available parents (second level items - nodes with parent_node that is not null)
  const availableParents = isManagingLists
    ? flattenedAllItems.filter(filter)
    : editingNode?.metadata?.type === "loop"
    ? flattenedAllItems.filter((item) => item.metadata?.type === "list")
    : undefined;

  const currentNode =
    findNodeById(allNodesTree, listId) ||
    allNodesTree.find((item) => item.parent_node === null);

  console.log({
    isManagingLists,
    availableParents,
    allNodesTree,
    flattenedAllItems,
    currentNode,
    editingNode,
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

  const reduce = (final: TreeNode[], node: TreeNode) => {
    const isManageable = filter(node);

    if (isManageable) {
      return [
        ...final,
        {
          ...node,
          children: node.children.reduce<TreeNode[]>(reduce, []),
        },
      ];
    }

    return final;
  };

  const tree = isManagingLists
    ? currentNode?.children.reduce(reduce, [])
    : currentNode?.children;

  console.log({ tree });

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
            {!isManagingLists && currentNode && (
              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{currentNode.name}</h1>
                    {currentNode.content && (
                      <p className="text-muted-foreground">
                        {currentNode.content}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditStart(currentNode)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {tree ? (
              <HierarchicalMovableList
                hierarchicalTree={tree}
                rootNode={currentNode!}
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
        firstLevelNodes={
          editingNode?.metadata?.type === "loop"
            ? currentNode?.children.filter((node) => {
                const targetNode = editingNode || currentNode;
                // Filter out the root node that contains the current editing item
                if (!targetNode) return true;

                const nodeContainsTargetNode = findNodeById(
                  node.children,
                  targetNode.id
                );

                return !nodeContainsTargetNode;
              })
            : undefined
        }
        defaultParentId={
          isManagingLists ? undefined : parseInt(listIdString!, 10)
        }
        isOpen={sheetMode === "create" || editingNode !== null}
        onClose={handleSheetClose}
        onSave={handleSave}
        isSaving={createNodeMutation.isPending || updateNodeMutation.isPending}
        mode={sheetMode}
      />
    </AppLayout>
  );
}
