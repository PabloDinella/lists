export type FollowUpStep = "projects" | "waiting" | "scheduled";

export type WorkflowShortcut =
  | "complete"
  | "move-0"
  | "move-1"
  | "move-2"
  | "move-3"
  | "move-4"
  | "move-5"
  | "add-next-actions"
  | "keep"
  | "delete"
  | "previous"
  | "skip"
  | "edit"
  | "submit-follow-up"
  | "add-project-action"
  | "confirm-delete";

type ShortcutKey = Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey" | "repeat">;

interface WorkflowShortcutContext {
  followUpStep: FollowUpStep | null;
  confirmingDelete: boolean;
  editable: boolean;
}

/** Resolve only shortcuts that belong to the currently visible decision step. */
export function getWorkflowShortcut(
  event: ShortcutKey,
  { followUpStep, confirmingDelete, editable }: WorkflowShortcutContext,
): WorkflowShortcut | null {
  if (event.repeat || event.altKey) return null;

  const modEnter = (event.ctrlKey || event.metaKey) && event.key === "Enter";
  if (confirmingDelete) return modEnter && !event.shiftKey ? "confirm-delete" : null;
  if (followUpStep) {
    if (!modEnter) return null;
    if (event.shiftKey) return followUpStep === "projects" ? "add-project-action" : null;
    return "submit-follow-up";
  }

  if (editable || event.ctrlKey || event.metaKey || event.shiftKey) return null;
  const key = event.key.toLowerCase();

  const actions: Record<string, WorkflowShortcut> = {
    a: "add-next-actions",
    c: "complete",
    d: "delete",
    e: "edit",
    k: "keep",
    n: "move-0",
    w: "move-1",
    p: "move-2",
    s: "move-3",
    m: "move-4",
    r: "move-5",
    arrowleft: "previous",
    arrowright: "skip",
  };
  return actions[key] ?? null;
}
