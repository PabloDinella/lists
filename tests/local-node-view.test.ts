import assert from "node:assert/strict";
import test from "node:test";
import { buildNodeViews, getOutgoingTagIds } from "../src/lib/local-node-view.ts";
import type { Tables } from "../src/database.types.ts";

const row = (id: number, parent_node: number | null = null): Tables<"node"> => ({
  id,
  name: `Node ${id}`,
  content: null,
  parent_node,
  user_id: "user",
  created_at: `2026-10-06T00:00:0${id}Z`,
  metadata: null,
});

test("local graph keeps ownership separate from list membership and tag direction", () => {
  const nodes = [row(1), row(2), row(3, 2), row(4)];
  const edges: Tables<"relationship">[] = [
    { id: 5, node_id_1: 3, node_id_2: 1, relation_type: "member_of", user_id: "user", created_at: "2026-10-06T00:00:00Z" },
    { id: 6, node_id_1: 3, node_id_2: 4, relation_type: "tagged_with", user_id: "user", created_at: "2026-10-06T00:00:00Z" },
  ];
  const views = buildNodeViews(nodes, edges, "user");
  const list = views.find((node) => node.id === 1)!;
  const action = views.find((node) => node.id === 3)!;
  const tag = views.find((node) => node.id === 4)!;

  assert.equal(action.parent_node, 2);
  assert.deepEqual(list.related_nodes.map((node) => [node.id, node.relation_type, node.relation_direction]), [
    [3, "member_of", "incoming"],
  ]);
  assert.deepEqual(getOutgoingTagIds(action), [4]);
  assert.deepEqual(getOutgoingTagIds(tag), []);
  assert.deepEqual(buildNodeViews(nodes, edges, "user", 1).map((node) => node.id), []);
  assert.deepEqual(buildNodeViews(nodes, edges, "user", 2).map((node) => node.id), [3]);
});
