import type { TreeNode } from "@/components/node-view/use-list-data";

export interface ReviewItem {
  node: TreeNode;
  /** Owning list/project path, with structural and root nodes omitted. */
  context: string;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const canBeReviewed = (node: TreeNode): boolean => {
  const type = node.metadata?.type;
  return type !== "root" && type !== "list" && type !== "tagging" && type !== "tag";
};

const canProvideContext = (node: TreeNode): boolean => {
  const type = node.metadata?.type;
  return type !== "root" && type !== "tagging" && type !== "tag";
};

/**
 * Collects active items that have never been reviewed or were last reviewed
 * at least a week ago. Traversal follows ownership children only; related
 * nodes are links and are deliberately ignored.
 */
export function getReviewItems(
  tree: TreeNode[],
  now: Date,
  referenceListId: number | null,
): ReviewItem[] {
  const result: ReviewItem[] = [];
  const visited = new Set<number>();
  const cutoff = now.getTime() - WEEK_MS;

  const visit = (nodes: TreeNode[], ancestors: TreeNode[]) => {
    for (const node of nodes) {
      // Protect against malformed duplicate/cyclic ownership data.
      if (visited.has(node.id)) continue;
      visited.add(node.id);

      if (node.id === referenceListId) continue;

      const lastReviewedAt = node.metadata?.lastReviewedAt;
      const reviewedTime = lastReviewedAt ? Date.parse(lastReviewedAt) : Number.NaN;
      const isDue = !lastReviewedAt || !Number.isFinite(reviewedTime) || reviewedTime <= cutoff;

      if (canBeReviewed(node) && !node.metadata?.completed && isDue) {
        const context = ancestors
          .filter(canProvideContext)
          .map((ancestor) => ancestor.name)
          .join(" › ");
        result.push({ node, context });
      }

      visit(node.children, [...ancestors, node]);
    }
  };

  visit(tree, []);
  return result;
}
