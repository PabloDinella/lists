import assert from "node:assert/strict";
import test from "node:test";

import {
  filterTreeByTags,
  getProcessingQueue,
  getRefiningQueue,
} from "../src/components/node-view/node-view-queues.ts";
import type { TreeNode } from "../src/components/node-view/use-list-data.ts";

const tag = (id: number, name: string): TreeNode => ({
  id,
  name,
  content: null,
  parent_node: null,
  user_id: "user",
  created_at: "2026-09-17T00:00:00Z",
  metadata: { type: "tag" },
  children: [],
  related_nodes: [],
});

const item = (
  id: number,
  relatedNodes: TreeNode[],
  metadata: TreeNode["metadata"] = null,
): TreeNode => ({
  id,
  name: `Item ${id}`,
  content: null,
  parent_node: 1,
  user_id: "user",
  created_at: "2026-09-17T00:00:00Z",
  metadata,
  children: [],
  related_nodes: relatedNodes,
});

test("Process and Refine queues contain only items matching the applied tag filters", () => {
  const work = tag(10, "Work");
  const personal = tag(11, "Personal");
  const visibleWorkItem = item(100, [work]);
  const hiddenPersonalItem = item(101, [personal]);
  const hiddenClassifiedItem = item(102, [personal], {
    eisenhowerQuadrant: "urgent-important",
  });
  const tree = [visibleWorkItem, hiddenPersonalItem, hiddenClassifiedItem];

  assert.deepEqual(
    getProcessingQueue(tree, [work.id]).map(({ id }) => id),
    [visibleWorkItem.id],
  );
  assert.deepEqual(
    getRefiningQueue(tree, [work.id]).map(({ id }) => id),
    [visibleWorkItem.id],
  );
});

test("tag filtering retains a nonmatching parent only as a path to matching children", () => {
  const work = tag(10, "Work");
  const child = item(201, [work]);
  const parent = { ...item(200, []), children: [child] };

  const filteredTree = filterTreeByTags([parent], [work.id]);

  assert.equal(filteredTree.length, 1);
  assert.equal(filteredTree[0].id, parent.id);
  assert.deepEqual(
    filteredTree[0].children.map(({ id }) => id),
    [child.id],
  );
});
