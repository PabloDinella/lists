import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../app-layout";
import { Container } from "../ui/container";
import { ResponsiveBreadcrumb } from "../ui/responsive-breadcrumb";
import { useNodeId } from "@/hooks/use-node-id";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { useListMembership } from "@/hooks/use-list-membership";
import { HierarchicalMovableList } from "./hierarchical-movable-list";
import { BaseNodeItem } from "./base-node-item";
import { EditNodeSheet } from "./edit-node-sheet";
import { GTDWorkflowDialog } from "./gtd-workflow-dialog";
import { EisenhowerMatrixDialog } from "./eisenhower-matrix-dialog";
import { TreeNode, useListData } from "./use-list-data";
import { TagFilters } from "./tag-filters";
import { Button } from "../ui/button";
import { Edit, Plus } from "lucide-react";
import { BrushCleaning } from "lucide-react";
import { Settings } from "lucide-react";
import { Grid2x2 } from "lucide-react";
import { Node } from "@/method/access/nodeAccess/models";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { renderMarkdown } from "@/lib/utils";
import { formatDueDate } from "@/lib/due-date";
import { getListMembers } from "@/lib/list-membership";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  filterTreeByTags,
  getProcessingQueue,
  getRefiningQueue,
} from "./node-view-queues";

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
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<number[]>([]);
  const [processingNode, setProcessingNode] = useState<TreeNode | null>(null);
  const [processingQueue, setProcessingQueue] = useState<TreeNode[]>([]);
  const [processingIndex, setProcessingIndex] = useState<number>(0);
  const [refiningNode, setRefiningNode] = useState<TreeNode | null>(null);
  const [refiningQueue, setRefiningQueue] = useState<TreeNode[]>([]);
  const [refiningIndex, setRefiningIndex] = useState<number>(0);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  const { user } = useAuth();

  const userId = user?.id || null;
  const { data: settings } = useSettings(userId);

  // Determine if we're managing lists (root level) or viewing a specific list
  const isManagingLists = !nodeId;

  const filter = (node: TreeNode) =>
    node.metadata?.type === "list" || node.metadata?.type === "tagging";

  const deleteNodeMutation = useDeleteNode();
  const listMembership = useListMembership();

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
  };

  const handleSheetClose = () => {
    setEditingNode(null);
    setIsCreatingList(false);
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

  const handleRemoveMembership = async (memberId: number) => {
    if (!userId || !currentNode) return;
    setMembershipError(null);
    try {
      await listMembership.mutateAsync({ userId, nodeId: memberId, listId: currentNode.id, member: false });
    } catch {
      setMembershipError("Could not remove this item from the list. Please try again.");
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
      // TODO: Instead of multiple calls, use a single call to delete all completed items with an array of nodeIds
      await Promise.allSettled(
        completedChildren.map((item) =>
          deleteNodeMutation.mutateAsync({ nodeId: item.id, userId: userId }),
        ),
      );
    } catch (error) {
      console.error("Failed to remove completed items:", error);
    }
  };

  const handleStartProcessing = () => {
    if (processingCandidates.length > 0) {
      setProcessingQueue(processingCandidates);
      setProcessingIndex(0);
      setProcessingNode(processingCandidates[0]);
    }
  };

  const handleProcessingClose = () => {
    setProcessingNode(null);
    setProcessingQueue([]);
    setProcessingIndex(0);
  };

  const handleProcessNext = () => {
    const nextIndex = processingIndex + 1;

    if (nextIndex < processingQueue.length) {
      setProcessingIndex(nextIndex);
      setProcessingNode(processingQueue[nextIndex]);
    } else {
      // No more items to process, close the dialog
      handleProcessingClose();
    }
  };

  const handleProcessDeleted = () => {
    if (!processingNode) return;
    const nextQueue = processingQueue.filter((item) => item.id !== processingNode.id);
    if (processingIndex < nextQueue.length) {
      setProcessingQueue(nextQueue);
      setProcessingNode(nextQueue[processingIndex]);
    } else {
      handleProcessingClose();
    }
  };

  const handleNavigatePrevious = () => {
    if (processingIndex > 0) {
      const prevIndex = processingIndex - 1;
      setProcessingIndex(prevIndex);
      setProcessingNode(processingQueue[prevIndex]);
    }
  };

  const handleEditFromProcessing = () => {
    if (processingNode) {
      handleEditStart(findNodeById(allNodesTree, processingNode.id) ?? processingNode);
    }
  };

  const handleStartRefining = () => {
    if (refiningCandidates.length > 0) {
      setRefiningQueue(refiningCandidates);
      setRefiningIndex(0);
      setRefiningNode(refiningCandidates[0]);
    }
  };

  const handleRefiningClose = () => {
    setRefiningNode(null);
    setRefiningQueue([]);
    setRefiningIndex(0);
  };

  const handleRefineNext = () => {
    const nextIndex = refiningIndex + 1;

    if (nextIndex < refiningQueue.length) {
      setRefiningIndex(nextIndex);
      setRefiningNode(refiningQueue[nextIndex]);
    } else {
      // No more items to refine, close the dialog
      handleRefiningClose();
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
  const membershipItems = !isManagingLists && currentNode
    ? getListMembers(currentNode, flattenedAllItems)
    : [];
  const otherRelatedItems = currentNode?.related_nodes.filter((related) => related.relation_type !== "member_of") ?? [];

  // Get tag nodes for filtering (only when viewing a specific list, not when managing lists)
  const tagNodes =
    !isManagingLists && rootNode
      ? rootNode.children.filter((node) => node.metadata?.type === "tagging")
      : [];
  const workflowTagCategories = [settings?.areasOfFocus, settings?.contexts]
    .filter((id): id is number => id != null)
    .map((id) => flattenedAllItems.find((node) => node.id === id))
    .filter((node): node is TreeNode => !!node);

  // Filter tree based on selected filters
  const filteredTree =
    tree && selectedFilters.length > 0
      ? filterTreeByTags(tree, selectedFilters)
      : tree;
  const filteredMembershipItems = selectedFilters.length > 0
    ? filterTreeByTags(membershipItems, selectedFilters)
    : membershipItems;

  // Use the same filtered candidates for button counts and processing queues.
  const visibleItems = [...(tree ?? []), ...membershipItems];
  const processingCandidates = getProcessingQueue(visibleItems, selectedFilters);
  const refiningCandidates = getRefiningQueue(visibleItems, selectedFilters);

  const unprocessedCount = processingCandidates.length;
  const unclassifiedCount = refiningCandidates.length;

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
      searchNodes={allNodesTree}
    >
      {/* Tag filters - full width outside container */}
      {!isLoading && !isError && !isManagingLists && tagNodes.length > 0 && (
        <Container size="full" className="mb-3">
          <TagFilters
            tagNodes={tagNodes}
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
          />
        </Container>
      )}

      <Container size="full">
        {isLoading && <p>Loading lists…</p>}
        {isError && (
          <p className="text-sm text-red-500">Failed to load lists.</p>
        )}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {isManagingLists && (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your lists</h2>
                <Button onClick={() => setIsCreatingList(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New List
                </Button>
              </div>
            )}

            {/* Show current list name and description when viewing a specific list */}
            {!isManagingLists && currentNode && (
              <div className="group space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{currentNode.name}</h1>
                    {otherRelatedItems.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">
                          {otherRelatedItems
                            .map((related) => related.name)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100">
                    {!isManagingLists && unprocessedCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleStartProcessing}
                          >
                            <Settings className="h-4 w-4" />
                            Process ({unprocessedCount})
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Process items using GTD workflow</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {!isManagingLists && unclassifiedCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleStartRefining}
                          >
                            <Grid2x2 className="h-4 w-4" />
                            Refine ({unclassifiedCount})
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Classify items using Eisenhower Matrix</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
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
                {currentNode.metadata?.dueDate && (
                  <p className="text-sm text-muted-foreground">
                    Due {formatDueDate(currentNode.metadata.dueDate)}
                  </p>
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

            {membershipError && <p role="alert" className="mt-3 text-sm text-destructive">{membershipError}</p>}
            {filteredMembershipItems.length > 0 && currentNode && (
              <section className="mt-6" aria-label="Items also in this list">
                <h2 className="mb-2 text-xl">Also in this list</h2>
                <p className="mb-2 text-sm text-muted-foreground">These items live elsewhere and are also shown here.</p>
                {filteredMembershipItems.map((item) => {
                  const ownerPath = buildBreadcrumbPath(flattenedAllItems, item.parent_node)
                    .map((ancestor) => ancestor.name);
                  return <div key={item.id}>
                    {ownerPath.length > 0 && <p className="ml-1 text-xs text-muted-foreground">{ownerPath.join(" › ")}</p>}
                    <BaseNodeItem
                      node={item}
                      onEditStart={handleEditStart}
                      onDelete={handleDelete}
                      onRemoveMembership={handleRemoveMembership}
                      hideMembershipListId={currentNode.id}
                      relatedNodes={item.related_nodes.filter((related) => related.relation_type === "tagged_with")}
                    >{null}</BaseNodeItem>
                  </div>;
                })}
              </section>
            )}

            {otherRelatedItems.length > 0 && currentNode && (
              <section className="mt-10" aria-label="Related items">
                <h2 className="mb-2 text-xl">Related items</h2>
                <div className="flex flex-wrap gap-2">
                  {otherRelatedItems.map((related) => <Button
                    key={`${related.id}-${related.relation_type}-${related.relation_direction}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/lists/${related.id}`)}
                  >{related.name}</Button>)}
                </div>
              </section>
            )}
          </div>
        )}
      </Container>

      {(editingNode !== null || isCreatingList) && (
        <EditNodeSheet
          node={editingNode}
          isOpen={editingNode !== null || isCreatingList}
          onClose={handleSheetClose}
          mode={isCreatingList ? "create" : "edit"}
          defaultParentId={currentNode?.id ?? 1}
          defaultMetadata={
            isCreatingList
              ? { type: "list" }
              : currentNode?.metadata?.defaultChildrenMetadata ?? undefined
          }
        />
      )}

      {processingNode &&
        userId &&
        processingQueue.length > 0 &&
        tree &&
        (() => {
          // Find the current node from the live tree to get updated data
          const currentLiveNode =
            flattenedAllItems.find((item) => item.id === processingNode.id) ||
            processingNode;
          return (
            <GTDWorkflowDialog
              key={currentLiveNode.id}
              mode="process"
              node={currentLiveNode}
              userId={userId}
              settings={settings ?? null}
              tagCategories={workflowTagCategories}
              context={currentLiveNode.parent_node === currentNode?.id
                ? currentNode?.name
                : flattenedAllItems.find((item) => item.id === currentLiveNode.parent_node)?.name}
              invalidMoveTargetIds={[
                settings?.nextActions,
                settings?.waiting,
                settings?.projects,
                settings?.scheduled,
                settings?.somedayMaybe,
                settings?.reference,
              ]
                .filter((id): id is number => id != null)
                .filter((targetId) => {
                  const seen = new Set<number>();
                  let candidate: number | null | undefined = targetId;
                  while (candidate != null && !seen.has(candidate)) {
                    if (candidate === currentLiveNode.id) return true;
                    seen.add(candidate);
                    candidate = flattenedAllItems.find((node) => node.id === candidate)?.parent_node;
                  }
                  return false;
                })}
              isOpen={!!processingNode}
              onClose={handleProcessingClose}
              onAdvance={handleProcessNext}
              onDeleted={handleProcessDeleted}
              currentIndex={processingIndex}
              totalCount={processingQueue.length}
              onPrevious={handleNavigatePrevious}
              onEdit={handleEditFromProcessing}
            />
          );
        })()}
      {refiningNode &&
        (() => {
          // Find the current node from the live tree to get updated data
          const currentLiveNode =
            tree?.find((item) => item.id === refiningNode.id) || refiningNode;
          return (
            <EisenhowerMatrixDialog
              key={currentLiveNode.id}
              node={currentLiveNode}
              userId={userId}
              isOpen={!!refiningNode}
              onClose={handleRefiningClose}
              onProcessNext={handleRefineNext}
            />
          );
        })()}
    </AppLayout>
  );
}
