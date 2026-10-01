import assert from "node:assert/strict";
import test from "node:test";

import type { TreeNode } from "../src/components/node-view/use-list-data.ts";
import type { Metadata } from "../src/method/access/nodeAccess/models.ts";
import { getReviewItems } from "../src/lib/review-items.ts";

const node = (
  id: number,
  name: string,
  type: Metadata["type"],
  children: TreeNode[] = [],
  metadata: Metadata | null = { type },
  related_nodes: TreeNode[] = [],
): TreeNode => ({
  id,
  name,
  content: null,
  parent_node: null,
  user_id: "user",
  created_at: "2026-09-30T00:00:00Z",
  metadata,
  children,
  related_nodes,
});

test("weekly review includes never reviewed and week-old items with ownership context", () => {
  const tree = [
    node(1, "Root", "root", [
      node(2, "Projects", "list", [
        node(3, "Website", "loop", [
          node(4, "Write copy", undefined, [], { lastReviewedAt: "2026-09-23T12:00:00.000Z" }),
        ]),
        node(5, "Call Sam", undefined, [], { lastReviewedAt: "2026-09-23T12:00:00.001Z" }),
        node(6, "Never reviewed", undefined),
      ]),
    ]),
  ];

  const items = getReviewItems(tree, new Date("2026-09-30T12:00:00.000Z"), null);
  assert.deepEqual(items.map(({ node: item, context }) => [item.name, context]), [
    ["Website", "Projects"],
    ["Write copy", "Projects › Website"],
    ["Never reviewed", "Projects"],
  ]);
});

test("review excludes completed and structural nodes and the configured Reference subtree", () => {
  const linked = node(20, "Related only", undefined);
  const tree = [
    node(1, "Root", "root", [
      node(2, "Reference", "list", [node(3, "Stored note", undefined)]),
      node(4, "Tasks", "list", [
        node(5, "Done", undefined, [], { completed: true }),
        node(6, "Tag group", "tagging", [node(7, "Tag", "tag")]),
        node(8, "Action", undefined, [], null, [linked]),
      ]),
    ]),
  ];

  const items = getReviewItems(tree, new Date("2026-09-30T12:00:00.000Z"), 2);
  assert.deepEqual(items.map(({ node: item }) => item.id), [8]);
});

test("reviewed items become due exactly seven days after their timestamp", () => {
  const item = node(1, "Task", undefined, [], {
    lastReviewedAt: "2026-09-23T12:00:00.000Z",
  });
  assert.equal(getReviewItems([item], new Date("2026-09-30T11:59:59.999Z"), null).length, 0);
  assert.equal(getReviewItems([item], new Date("2026-09-30T12:00:00.000Z"), null).length, 1);
});

test("duplicate ownership entries are returned once", () => {
  const shared = node(3, "Shared", undefined);
  const tree = [node(1, "Root", "root", [node(2, "A", "list", [shared]), node(4, "B", "list", [shared])])];
  assert.equal(getReviewItems(tree, new Date("2026-09-30T12:00:00.000Z"), null).length, 1);
});
