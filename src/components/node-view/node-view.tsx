import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "../app-layout";
import { Container } from "../ui/container";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { supabase } from "@/lib/supabase";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { HierarchicalMovableList } from "./hierarchical-movable-list";
import { EditNodeSheet } from "./edit-node-sheet";
import { TreeNode, useListData } from "./use-list-data";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";
import { Node } from "@/method/access/nodeAccess/models";

const findNodeById = (
  nodeTree: TreeNode[],
  nodeId: number,
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

// Function to build breadcrumb path from root to current node
const buildBreadcrumbPath = (
  allNodes: TreeNode[],
  targetNodeId: number | null,
): TreeNode[] => {
  if (!targetNodeId) return [];

  const findPath = (nodeId: number): TreeNode[] => {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return [];

    if (node.parent_node === null) {
      return [];
    }

    return [...findPath(node.parent_node), node];
  };

  return findPath(targetNodeId);
};

export function NodeView() {
  const { listId: listIdString } = useParams<{ listId: string }>();
  const listId = listIdString ? parseInt(listIdString, 10) : 0;
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [sheetMode, setSheetMode] = useState<"edit" | "create">("edit");

  // Determine if we're managing lists (root level) or viewing a specific list
  const isManagingLists = !listId;

  const filter = (node: TreeNode) =>
    node.metadata?.type === "list" || node.metadata?.type === "tagging";

  const deleteNodeMutation = useDeleteNode();

  // Get all nodes to find current node for display
  const {
    hierarchicalTree: allNodesTree,
    isLoading,
    isError,
  } = useListData({
    userId,
  });

  const flattenedAllItems = allNodesTree.reduce<TreeNode[]>(
    flattenNodesTree,
    [],
  );

  const rootNode = allNodesTree.find((item) => item.parent_node === null);
  const currentNode = findNodeById(allNodesTree, listId) || rootNode;

  // Build breadcrumb path
  const breadcrumbPath = buildBreadcrumbPath(flattenedAllItems, listId);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      },
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleEditStart = (node: Node) => {
    setEditingNode(node);
    setSheetMode("edit");
  };

  const handleCreateStart = () => {
    setEditingNode(null);
    setSheetMode("create");
  };

  const handleSheetClose = () => {
    setEditingNode(null);
    setSheetMode("edit"); // Reset to edit mode
  };

  const handleDelete = async (nodeId: number) => {
    if (!userId) return;
    try {
      await deleteNodeMutation.mutateAsync({
        nodeId: nodeId,
        userId: userId,
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

  return (
    <AppLayout
      title={isManagingLists ? "Manage Lists" : "List Items"}
      onNewItem={handleCreateStart}
      newItemLabel={isManagingLists ? "New List" : "New Item"}
    >
      <Container size="md">
        {/* Breadcrumb navigation */}
        {!isManagingLists && breadcrumbPath.length > 0 && (
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbPath.map((node, index) => (
                <React.Fragment key={node.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === breadcrumbPath.length - 1 ? (
                      <BreadcrumbPage>{node.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        className="cursor-pointer"
                        onClick={() => navigate(`/lists/${node.id}`)}
                      >
                        {node.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {isLoading && <p>Loading lists…</p>}
        {isError && (
          <p className="text-sm text-red-500">Failed to load lists.</p>
        )}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {isManagingLists && (
              <h2 className="text-xl font-semibold">Your lists</h2>
            )}

            {/* Show current list name and description when viewing a specific list */}
            {!isManagingLists && currentNode && (
              <div className="group space-y-2">
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
                    className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
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
              <p className="py-8 text-center text-muted-foreground">
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
        isOpen={sheetMode === "create" || editingNode !== null}
        onClose={handleSheetClose}
        mode={sheetMode}
      />
    </AppLayout>
  );
}
