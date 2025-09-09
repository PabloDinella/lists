import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../app-layout";
import { Container } from "../ui/container";
import { ResponsiveBreadcrumb } from "../ui/responsive-breadcrumb";
import { useNodeId } from "@/hooks/use-node-id";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { HierarchicalMovableList } from "./hierarchical-movable-list";
import { EditNodeSheet } from "./edit-node-sheet";
import { TreeNode, useListData } from "./use-list-data";
import { TagFilters } from "./tag-filters";
import { Button } from "../ui/button";
import { Edit } from "lucide-react";
import { BrushCleaning } from "lucide-react";
import { Node } from "@/method/access/nodeAccess/models";
import { useAuth } from "@/hooks/use-auth";
import { renderMarkdown } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
  const nodeId = useNodeId();
  const navigate = useNavigate();
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [sheetMode, setSheetMode] = useState<"edit" | "create">("edit");
  const [selectedFilters, setSelectedFilters] = useState<number[]>([]);

  const { user } = useAuth();

  const userId = user?.id || null;

  // Determine if we're managing lists (root level) or viewing a specific list
  const isManagingLists = !nodeId;

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

  console.log("All nodes:", { allNodesTree, isLoading, isError, userId });

  const flattenedAllItems = allNodesTree.reduce<TreeNode[]>(
    flattenNodesTree,
    [],
  );

  const rootNode = allNodesTree.find((item) => item.parent_node === null);
  const currentNode = findNodeById(allNodesTree, nodeId) || rootNode;

  // Build breadcrumb path
  const breadcrumbPath = buildBreadcrumbPath(flattenedAllItems, nodeId);

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

  const handleRemoveCompleted = async () => {
    if (!userId || !tree) return;
    const completedChildren = tree.filter((item) => !!item.metadata?.completed);
    if (completedChildren.length === 0) return;
    const confirmed = window.confirm(
      `Remove ${completedChildren.length} completed item${completedChildren.length === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      await Promise.allSettled(
        completedChildren.map((item) =>
          deleteNodeMutation.mutateAsync({ nodeId: item.id, userId: userId }),
        ),
      );
    } catch (error) {
      console.error("Failed to remove completed items:", error);
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

  // Get tag nodes for filtering (only when viewing a specific list, not when managing lists)
  const tagNodes =
    !isManagingLists && rootNode
      ? rootNode.children.filter((node) => node.metadata?.type === "tagging")
      : [];

  // Filter tree based on selected filters
  const filteredTree =
    tree && selectedFilters.length > 0
      ? filterTreeByTags(tree, selectedFilters)
      : tree;

  // Helper function to filter tree based on selected tag filters
  function filterTreeByTags(
    nodes: TreeNode[],
    filterTagIds: number[],
  ): TreeNode[] {
    return nodes.reduce<TreeNode[]>((filteredNodes, node) => {
      // Check if this node has ALL of the selected tags in its related_nodes (AND logic)
      const hasAllSelectedTags = filterTagIds.every((tagId) =>
        node.related_nodes.some((relatedNode) => relatedNode.id === tagId),
      );

      // If it has all selected tags or if no filters are applied, include it
      if (hasAllSelectedTags || filterTagIds.length === 0) {
        const filteredChildren = filterTreeByTags(node.children, filterTagIds);
        filteredNodes.push({
          ...node,
          children: filteredChildren,
        });
      } else {
        // Even if the node doesn't match, check if any children match
        const filteredChildren = filterTreeByTags(node.children, filterTagIds);
        if (filteredChildren.length > 0) {
          filteredNodes.push({
            ...node,
            children: filteredChildren,
          });
        }
      }

      return filteredNodes;
    }, []);
  }

  // Create breadcrumb title component
  const breadcrumbTitle = isManagingLists ? (
    <span>Manage Lists</span>
  ) : breadcrumbPath.length > 0 ? (
    <ResponsiveBreadcrumb
      breadcrumbPath={breadcrumbPath}
      onNavigate={navigate}
    />
  ) : (
    <span>List Items</span>
  );

  return (
    <AppLayout
      title={breadcrumbTitle}
      onNewItem={handleCreateStart}
      newItemLabel={isManagingLists ? "New List" : "New Item"}
      searchNodes={allNodesTree}
    >
      {/* Tag filters - full width outside container */}
      {!isLoading && !isError && !isManagingLists && tagNodes.length > 0 && (
        <Container size="md" className="mb-3">
          <TagFilters
            tagNodes={tagNodes}
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
          />
        </Container>
      )}

      <Container size="md">
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
              <div className="group space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{currentNode.name}</h1>
                    {currentNode.related_nodes.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">
                          {currentNode.related_nodes
                            .map((related) => related.name)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRemoveCompleted}
                          disabled={
                            !tree ||
                            tree.every((item) => !item.metadata?.completed)
                          }
                        >
                          <BrushCleaning className="h-4 w-4" />
                          <span className="sr-only">
                            Clean up completed items
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Clean up completed items</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStart(currentNode)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                {currentNode.content && (
                  <div
                    className="markdown-content max-w-full text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(currentNode.content),
                    }}
                    onClick={(e) => {
                      // Allow clicks on links within the markdown content
                      if ((e.target as HTMLElement).tagName === "A") {
                        e.stopPropagation();
                      }
                    }}
                  />
                )}
              </div>
            )}

            {filteredTree ? (
              <HierarchicalMovableList
                hierarchicalTree={filteredTree}
                rootNode={currentNode!}
                onEditStart={handleEditStart}
                onDelete={handleDelete}
              />
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                {isManagingLists
                  ? "No lists found."
                  : selectedFilters.length > 0
                    ? "No items match the selected filters."
                    : "No items found in this list."}
              </p>
            )}

            {currentNode?.related_nodes &&
              currentNode.related_nodes.length > 0 && (
                <div>
                  <h2 className="mb-2 mt-10 text-xl">Related items</h2>

                  <HierarchicalMovableList
                    hierarchicalTree={currentNode.related_nodes}
                    rootNode={currentNode!}
                    onEditStart={handleEditStart}
                    onDelete={handleDelete}
                  />
                </div>
              )}
          </div>
        )}
      </Container>

      {(sheetMode === "create" || editingNode !== null) && (
        <EditNodeSheet
          node={editingNode}
          isOpen={sheetMode === "create" || editingNode !== null}
          onClose={handleSheetClose}
          mode={sheetMode}
          defaultParentId={currentNode?.id ?? 1}
          defaultMetadata={
            currentNode?.metadata?.defaultChildrenMetadata ?? undefined
          }
        />
      )}
    </AppLayout>
  );
}
