import assert from "node:assert/strict";
import test from "node:test";

import { getWorkflowShortcut } from "../src/components/node-view/gtd-workflow-shortcuts.ts";

const key = (name: string, overrides: Partial<Parameters<typeof getWorkflowShortcut>[0]> = {}) => ({
  key: name,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  repeat: false,
  ...overrides,
});

const decisions = { followUpStep: null, confirmingDelete: false, editable: false };

test("review decisions have distinct keys and ignore typing or modified keys", () => {
  for (const [shortcut, action] of Object.entries({
    n: "move-0", w: "move-1", p: "move-2",
    s: "move-3", m: "move-4", r: "move-5",
  })) {
    assert.equal(getWorkflowShortcut(key(shortcut), decisions), action);
  }
  assert.equal(getWorkflowShortcut(key("1"), decisions), null);
  assert.equal(getWorkflowShortcut(key("6"), decisions), null);
  assert.equal(getWorkflowShortcut(key("c"), decisions), "complete");
  assert.equal(getWorkflowShortcut(key("a"), decisions), "add-next-actions");
  assert.equal(getWorkflowShortcut(key("k"), decisions), "keep");
  assert.equal(getWorkflowShortcut(key("d"), decisions), "delete");
  assert.equal(getWorkflowShortcut(key("ArrowLeft"), decisions), "previous");
  assert.equal(getWorkflowShortcut(key("ArrowRight"), decisions), "skip");
  assert.equal(getWorkflowShortcut(key("c"), { ...decisions, editable: true }), null);
  assert.equal(getWorkflowShortcut(key("n", { ctrlKey: true }), decisions), null);
  assert.equal(getWorkflowShortcut(key("d", { repeat: true }), decisions), null);
});

test("follow-up and delete confirmation accept only their own shortcuts", () => {
  assert.equal(getWorkflowShortcut(key("c"), { ...decisions, followUpStep: "waiting" }), null);
  assert.equal(getWorkflowShortcut(key("Enter", { ctrlKey: true }), { ...decisions, followUpStep: "waiting", editable: true }), "submit-follow-up");
  assert.equal(getWorkflowShortcut(key("Enter", { metaKey: true, shiftKey: true }), { ...decisions, followUpStep: "projects", editable: true }), "add-project-action");
  assert.equal(getWorkflowShortcut(key("Enter", { metaKey: true, shiftKey: true }), { ...decisions, followUpStep: "scheduled" }), null);
  assert.equal(getWorkflowShortcut(key("d"), { ...decisions, confirmingDelete: true }), null);
  assert.equal(getWorkflowShortcut(key("Enter", { ctrlKey: true }), { ...decisions, confirmingDelete: true }), "confirm-delete");
});
