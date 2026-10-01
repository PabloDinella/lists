import { useSettings } from "@/hooks/use-settings";
import type { TreeNode } from "./use-list-data";
import { useListData } from "./use-list-data";
import { GTDWorkflowDialog } from "./gtd-workflow-dialog";

interface GTDProcessingDialogProps {
  node: TreeNode;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onProcessNext?: (currentNodeId: number) => void;
  onEdit?: () => void;
}

function flatten(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((item) => [item, ...flatten(item.children)]);
}

/** The item-level Process entry point uses the same workflow dialog as the queues. */
export function GTDProcessingDialog({
  node,
  userId,
  isOpen,
  onClose,
  onProcessNext,
  onEdit,
}: GTDProcessingDialogProps) {
  const { data: settings } = useSettings(userId);
  const { hierarchicalTree } = useListData({ userId });
  const allNodes = flatten(hierarchicalTree);
  const nodeById = new Map(allNodes.map((item) => [item.id, item]));
  const currentNode = nodeById.get(node.id) ?? node;
  const tagCategories = [settings?.areasOfFocus, settings?.contexts]
    .filter((id): id is number => id != null)
    .map((id) => nodeById.get(id))
    .filter((item): item is TreeNode => !!item);
  const invalidMoveTargetIds = [
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
        if (candidate === node.id) return true;
        seen.add(candidate);
        candidate = nodeById.get(candidate)?.parent_node;
      }
      return false;
    });

  return (
    <GTDWorkflowDialog
      key={currentNode.id}
      mode="process"
      node={currentNode}
      userId={userId}
      settings={settings ?? null}
      tagCategories={tagCategories}
      invalidMoveTargetIds={invalidMoveTargetIds}
      isOpen={isOpen}
      onClose={onClose}
      onAdvance={() => onProcessNext ? onProcessNext(node.id) : onClose()}
      onEdit={onEdit}
    />
  );
}
