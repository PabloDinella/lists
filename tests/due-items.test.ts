import assert from "node:assert/strict";
import test from "node:test";

import { getDueItems, getLocalDateString } from "../src/lib/due-items.ts";
import type { TreeNode } from "../src/components/node-view/use-list-data.ts";
import type { Metadata } from "../src/method/access/nodeAccess/models.ts";

const node = (
  id: number,
  name: string,
  type: Metadata["type"],
  dueDate?: string,
  children: TreeNode[] = [],
  related_nodes: TreeNode[] = [],
): TreeNode => ({
  id,
  name,
  content: null,
  parent_node: null,
  user_id: "user",
  created_at: "2026-09-30T00:00:00Z",
  metadata: { type, dueDate },
  children,
  related_nodes,
});

test("due items are grouped by local date, exclude structural/completed/invalid nodes, and sort by date then name", () => {
  const tree = [
    node(1, "Root", "root", "2026-09-30", [
      node(2, "Work", "list", undefined, [
        node(3, "Later", undefined, "2026-10-02"),
        node(4, "Today Z", "loop", "2026-09-30"),
        node(5, "Today A", undefined, "2026-09-30"),
        node(6, "Old", undefined, "2026-09-29"),
        node(7, "Invalid", undefined, "2026-02-29"),
        node(8, "Done", undefined, "2026-09-29"),
        node(9, "Tag", "tag", "2026-09-29"),
      ]),
      node(10, "Tagging", "tagging", "2026-09-29"),
    ]),
  ];
  tree[0].children[0].children[5].metadata = {
    type: undefined,
    completed: true,
    dueDate: "2026-09-29",
  };

  const items = getDueItems(tree, "2026-09-30");

  assert.deepEqual(items.map(({ node: item, group }) => [item.name, group]), [
    ["Old", "overdue"],
    ["Today A", "today"],
    ["Today Z", "today"],
    ["Later", "upcoming"],
  ]);
  assert.equal(items[1].context, "Work");
});

test("local date formatting uses the local calendar fields", () => {
  const localDate = new Date(2026, 8, 30, 23, 59);
  assert.equal(getLocalDateString(localDate), "2026-09-30");
});
