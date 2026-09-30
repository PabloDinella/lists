import type { TreeNode } from "@/components/node-view/use-list-data";

export type DueGroup = "overdue" | "today" | "upcoming";

export interface DueItem {
  node: TreeNode;
  dueDate: string;
  group: DueGroup;
  context: string;
}

const isValidDateOnly = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
};

const getGroup = (date: string, today: string): DueGroup => {
  if (date < today) return "overdue";
  if (date === today) return "today";
  return "upcoming";
};

const canHaveDueDate = (node: TreeNode): boolean => {
  const type = node.metadata?.type;
  return type !== "root" && type !== "tagging" && type !== "tag";
};

/**
 * Collect due items by walking only the owning children tree. Related nodes
 * are intentionally ignored because they are references, not owned items.
 */
export function getDueItems(tree: TreeNode[], today: string): DueItem[] {
  if (!isValidDateOnly(today)) return [];

  const result: DueItem[] = [];

  const visit = (nodes: TreeNode[], ancestors: TreeNode[]) => {
    for (const node of nodes) {
      const dueDate = node.metadata?.dueDate;
      if (
        canHaveDueDate(node) &&
        !node.metadata?.completed &&
        dueDate &&
        isValidDateOnly(dueDate)
      ) {
        const context = ancestors
          .filter((ancestor) => canHaveDueDate(ancestor))
          .map((ancestor) => ancestor.name)
          .join(" › ");
        result.push({ node, dueDate, group: getGroup(dueDate, today), context });
      }

      visit(node.children, [...ancestors, node]);
    }
  };

  visit(tree, []);
  return result.sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      a.node.name.localeCompare(b.node.name),
  );
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
