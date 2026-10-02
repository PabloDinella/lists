import assert from "node:assert/strict";
import test from "node:test";

import { getListMembers } from "../src/lib/list-membership.ts";
import type { TreeNode } from "../src/components/node-view/use-list-data.ts";

const node = (id: number, parent: number | null = null): TreeNode => ({
  id,
  name: `Item ${id}`,
  content: null,
  parent_node: parent,
  user_id: "user",
  created_at: "2026-10-02T00:00:00Z",
  metadata: { type: "loop" },
  children: [],
  related_nodes: [],
});

test("a list shows incoming members as their live owned nodes, once", () => {
  const projectAction = node(3, 2);
  const directAction = node(4, 1);
  const nestedOwnedAction = node(7, 4);
  const nextActions = {
    ...node(1),
    children: [{ ...directAction, children: [nestedOwnedAction] }],
    related_nodes: [
      { ...projectAction, relation_type: "member_of", relation_direction: "incoming" as const },
      { ...projectAction, relation_type: "member_of", relation_direction: "incoming" as const },
      { ...directAction, relation_type: "member_of", relation_direction: "incoming" as const },
      { ...nestedOwnedAction, relation_type: "member_of", relation_direction: "incoming" as const },
      { ...node(5), relation_type: "tagged_with", relation_direction: "incoming" as const },
      { ...node(6), relation_type: "member_of", relation_direction: "outgoing" as const },
    ],
  };

  assert.deepEqual(getListMembers(nextActions, [projectAction, directAction]).map((item) => item.id), [3]);
  assert.equal(getListMembers(nextActions, [projectAction])[0], projectAction);
});
