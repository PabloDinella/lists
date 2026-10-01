import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import type { Node } from "@/method/access/nodeAccess/models";
import { canBeReviewed, getReviewItems } from "@/lib/review-items";
import { AppLayout } from "./app-layout";
import { Button } from "./ui/button";
import { Container } from "./ui/container";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { EditNodeSheet } from "./node-view/edit-node-sheet";
import { GTDWorkflowDialog } from "./node-view/gtd-workflow-dialog";
import { TreeNode, useListData } from "./node-view/use-list-data";

interface QueuedItem {
  id: number;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}

export function ReviewView() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { hierarchicalTree, isLoading, isError } = useListData({ userId });
  const { data: settings, isLoading: settingsLoading, isError: settingsError } = useSettings(userId);
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);

  const referenceId = settings?.reference ?? null;
  const dueItems = useMemo(
    () => getReviewItems(hierarchicalTree, new Date(), referenceId),
    [hierarchicalTree, referenceId],
  );
  const allNodes = useMemo(() => flattenTree(hierarchicalTree), [hierarchicalTree]);
  const nodeById = useMemo(() => new Map(allNodes.map((node) => [node.id, node])), [allNodes]);
  const parents = useMemo(() => new Map(allNodes.map((node) => [node.id, node.parent_node])), [allNodes]);
  const tagCategories = [settings?.areasOfFocus, settings?.contexts]
    .filter((id): id is number => id != null)
    .map((id) => nodeById.get(id))
    .filter((node): node is TreeNode => !!node);

  const isInReference = (id: number) => {
    let current: number | null | undefined = id;
    const seen = new Set<number>();
    while (current != null && !seen.has(current)) {
      if (current === referenceId) return true;
      seen.add(current);
      current = parents.get(current);
    }
    return false;
  };

  const getContext = (id: number) => {
    const names: string[] = [];
    const seen = new Set<number>();
    let parentId = parents.get(id);
    while (parentId != null && !seen.has(parentId)) {
      seen.add(parentId);
      const parent = nodeById.get(parentId);
      if (!parent) break;
      const type = parent.metadata?.type;
      if (type !== "root" && type !== "tagging" && type !== "tag") {
        names.unshift(parent.name);
      }
      parentId = parent.parent_node;
    }
    return names.join(" › ");
  };

  // Resolve queue IDs against the latest tree so edits are reflected and
  // deleted, completed, or reclassified items are left out when reached.
  const remaining = queue.flatMap((entry, queueIndex) => {
    if (queueIndex < cursor) return [];
    const node = nodeById.get(entry.id);
    if (!node || !canBeReviewed(node) || node.metadata?.completed || isInReference(node.id)) return [];
    return [{ ...entry, node, queueIndex }];
  });
  const current = remaining[0];
  const invalidMoveTargetIds = current
    ? [...new Set([settings?.nextActions, settings?.waiting, settings?.projects, settings?.scheduled, settings?.somedayMaybe, settings?.reference].filter((id): id is number => id != null))]
        .filter((targetId) => {
          let ancestor: number | null | undefined = targetId;
          const seen = new Set<number>();
          while (ancestor != null && !seen.has(ancestor)) {
            if (ancestor === current.id) return true;
            seen.add(ancestor);
            ancestor = parents.get(ancestor);
          }
          return false;
        })
    : [];
  const previous = queue
    .map((entry, queueIndex) => ({ ...entry, queueIndex, node: nodeById.get(entry.id) }))
    .filter((entry) => entry.queueIndex < (current?.queueIndex ?? cursor) && entry.node && canBeReviewed(entry.node) && !entry.node.metadata?.completed && !isInReference(entry.id))
    .at(-1);

  const startReview = () => {
    setQueue(dueItems.map(({ node }) => ({ id: node.id })));
    setCursor(0);
    setIsReviewing(true);
  };

  const advance = (queueIndex: number) => {
    setCursor(queueIndex + 1);
  };

  const closeReview = () => setIsReviewing(false);

  return (
    <AppLayout title="Review" searchNodes={hierarchicalTree}>
      <Container size="full">
        {(isLoading || settingsLoading) && <p>Loading items…</p>}
        {(isError || settingsError) && <p className="text-sm text-red-500">Failed to load review items.</p>}
        {!isLoading && !settingsLoading && !isError && !settingsError && dueItems.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h2 className="font-medium">You’re all caught up</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Items you haven’t reviewed in the last week will appear here.
            </p>
          </div>
        )}
        {!isLoading && !settingsLoading && !isError && !settingsError && dueItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {dueItems.length} {dueItems.length === 1 ? "item" : "items"} due for review
              </p>
              <Button type="button" onClick={startReview}>Start review</Button>
            </div>
            <ul className="space-y-2">
              {dueItems.map(({ node, context }) => (
                <li key={node.id} className="flex items-center gap-3 rounded-lg border bg-background p-3">
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{node.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {context || "No list context"}
                    </span>
                    {!node.metadata?.lastReviewedAt && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">Never reviewed</span>
                    )}
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingNode(node)} aria-label={`Edit ${node.name}`}>
                    Edit
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>

      {isReviewing && current && userId && !settingsLoading && !settingsError && (
        <GTDWorkflowDialog
          key={current.node.id}
          mode="review"
          node={current.node}
          userId={userId}
          context={getContext(current.id)}
          settings={settings ?? null}
          tagCategories={tagCategories}
          invalidMoveTargetIds={invalidMoveTargetIds}
          isOpen
          currentIndex={current.queueIndex}
          totalCount={queue.length}
          onClose={closeReview}
          onAdvance={() => advance(current.queueIndex)}
          onPrevious={() => previous && setCursor(previous.queueIndex)}
          onEdit={() => setEditingNode(current.node)}
        />
      )}
      {isReviewing && !current && !settingsLoading && !settingsError && (
        <GTDReviewDialogCompleted onClose={closeReview} />
      )}
      {editingNode && (
        <EditNodeSheet
          node={editingNode}
          isOpen
          onClose={() => setEditingNode(null)}
          mode="edit"
          defaultParentId={editingNode.parent_node ?? 1}
        />
      )}
    </AppLayout>
  );
}

function GTDReviewDialogCompleted({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review complete</DialogTitle>
          <DialogDescription>You’ve reached the end of this review.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
