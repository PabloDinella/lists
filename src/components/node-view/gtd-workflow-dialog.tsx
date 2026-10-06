import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useCreateNode } from "@/hooks/use-create-node";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { useListMembership } from "@/hooks/use-list-membership";
import { useSetNodeCategoryTags } from "@/hooks/use-set-node-category-tags";
import { useUpdateNode } from "@/hooks/use-update-node";
import type { GTDSettings } from "@/hooks/use-settings";
import type { Metadata } from "@/method/access/nodeAccess/models";
import { useListData, type TreeNode } from "./use-list-data";
import { DueDatePicker } from "./due-date-picker";
import { getWorkflowShortcut, type FollowUpStep, type WorkflowShortcut } from "./gtd-workflow-shortcuts";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { ShortcutHint } from "../ui/shortcut-hint";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { MultiSelectAutocomplete, type Option } from "../ui/multi-select-autocomplete";

export interface GTDWorkflowDialogProps {
  mode: "process" | "review";
  node: TreeNode;
  userId: string;
  settings: GTDSettings | null;
  tagCategories: TreeNode[];
  context?: string;
  invalidMoveTargetIds?: number[];
  isOpen: boolean;
  currentIndex?: number;
  totalCount?: number;
  onClose: () => void;
  onAdvance: () => void;
  onDeleted?: () => void;
  onPrevious?: () => void;
  onEdit?: () => void;
}

function formatReviewedAt(value?: string) {
  if (!value) return "Never reviewed";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Never reviewed"
    : `Last reviewed ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)}`;
}

function countDescendants(node: TreeNode): number {
  return node.children.reduce((count, child) => count + 1 + countDescendants(child), 0);
}

export function GTDWorkflowDialog({
  mode,
  node,
  userId,
  settings,
  tagCategories,
  context,
  invalidMoveTargetIds = [],
  isOpen,
  currentIndex = 0,
  totalCount = 1,
  onClose,
  onAdvance,
  onDeleted,
  onPrevious,
  onEdit,
}: GTDWorkflowDialogProps) {
  const updateNode = useUpdateNode();
  const deleteNode = useDeleteNode();
  const listMembership = useListMembership();
  const { hierarchicalTree, isLoading: listDataLoading } = useListData({ userId });
  const parentById = useMemo(() => {
    const parents = new Map<number, number | null>();
    const collect = (nodes: TreeNode[]) => {
      for (const item of nodes) {
        parents.set(item.id, item.parent_node);
        collect(item.children);
      }
    };
    collect(hierarchicalTree);
    return parents;
  }, [hierarchicalTree]);
  const setCategoryTags = useSetNodeCategoryTags();
  const createNode = useCreateNode();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const decisionPendingRef = useRef(false);
  const [decisionSaving, setDecisionSaving] = useState(false);
  const deletePendingRef = useRef(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(() => node.related_nodes.filter((related) => related.relation_type === "tagged_with").map((related) => related.id));
  const titleRef = useRef<HTMLHeadingElement>(null);
  const selectedTagIdsRef = useRef(selectedTagIds);
  const tagOperationPending = useRef(false);
  const [tagsSaving, setTagsSaving] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState<WorkflowShortcut | null>(null);
  const shortcutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shortcutFeedback = (shortcut: WorkflowShortcut) =>
    activeShortcut === shortcut ? "scale-[0.98] brightness-95 ring-2 ring-primary ring-offset-2" : "";

  useEffect(() => {
    if (!isOpen && shortcutTimerRef.current) {
      clearTimeout(shortcutTimerRef.current);
      shortcutTimerRef.current = null;
      setActiveShortcut(null);
    }
  }, [isOpen]);

  useEffect(() => () => {
    if (shortcutTimerRef.current) clearTimeout(shortcutTimerRef.current);
  }, []);
  const serverRelatedIds = node.related_nodes
    .filter((related) => related.relation_type === "tagged_with")
    .map((related) => related.id)
    .sort((a, b) => a - b)
    .join(",");

  useEffect(() => {
    if (tagsSaving) return;
    const ids = serverRelatedIds ? serverRelatedIds.split(",").map(Number) : [];
    selectedTagIdsRef.current = ids;
    setSelectedTagIds(ids);
  }, [node.id, serverRelatedIds, tagsSaving]);

  const saveDecision = async (decision: { metadata?: Metadata; parentNode?: number; name?: string }) => {
    if (decisionPendingRef.current) return;
    decisionPendingRef.current = true;
    setDecisionSaving(true);
    setSaveError(null);
    try {
      const result = await updateNode.mutateAsync({ nodeId: node.id, userId, ...decision });
      if ("error" in result) {
        setSaveError("Could not save this item. Please try again.");
        return;
      }
      onAdvance();
    } catch {
      setSaveError("Could not save this item. Please try again.");
    } finally {
      decisionPendingRef.current = false;
      setDecisionSaving(false);
    }
  };

  const decide = (decision: { metadata?: Metadata; parentNode?: number; name?: string }) =>
    saveDecision(mode === "review" ? { ...decision, metadata: { ...(decision.metadata ?? {}), lastReviewedAt: new Date().toISOString() } } : decision);

  const [membershipSaving, setMembershipSaving] = useState(false);
  const membershipPendingRef = useRef(false);
  const addToNextActions = async () => {
    const listId = settings?.nextActions;
    if (listId == null || membershipPendingRef.current) return;
    membershipPendingRef.current = true;
    setMembershipSaving(true);
    setSaveError(null);
    try {
      await listMembership.mutateAsync({ userId, nodeId: node.id, listId, member: true });
      if (mode === "review") await decide({ metadata: {} });
      else onAdvance();
    } catch {
      setSaveError("Could not add this item to Next Actions. Please try again.");
    } finally {
      membershipPendingRef.current = false;
      setMembershipSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deletePendingRef.current) return;
    deletePendingRef.current = true;
    setDeleteSaving(true);
    setSaveError(null);
    try {
      const result = await deleteNode.mutateAsync({ nodeId: node.id, userId });
      if ("error" in result) {
        setSaveError("Could not delete this item. Please try again.");
        return;
      }
      (onDeleted ?? onAdvance)();
    } catch {
      setSaveError("Could not delete this item. Please try again.");
    } finally {
      deletePendingRef.current = false;
      setDeleteSaving(false);
    }
  };

  const moveActions = [
    { id: settings?.nextActions, label: "Next Actions", description: "A single action you can do yourself.", shortcut: "N" },
    { id: settings?.waiting, label: "Waiting For", description: "Something delegated or pending.", shortcut: "W" },
    { id: settings?.projects, label: "Projects", description: "A multi step outcome.", shortcut: "P" },
    { id: settings?.scheduled, label: "Scheduled", description: "An item you intend to do on a specific date.", shortcut: "S" },
    { id: settings?.somedayMaybe, label: "Someday/Maybe", description: "A possibility for later.", shortcut: "M" },
    { id: settings?.reference, label: "Reference", description: "Information to keep for later.", shortcut: "R" },
  ];

  const [followUpStep, setFollowUpStep] = useState<FollowUpStep | null>(null);
  const [projectActionTitles, setProjectActionTitles] = useState(["", ""]);
  const [projectActionInNextActions, setProjectActionInNextActions] = useState([true, true]);
  const [createdProjectActions, setCreatedProjectActions] = useState<Record<number, number>>({});
  const [linkedProjectActions, setLinkedProjectActions] = useState<Record<number, boolean>>({});
  const [waitingPerson, setWaitingPerson] = useState("");
  const [scheduledDate, setScheduledDate] = useState(node.metadata?.dueDate ?? "");
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const followUpSavingRef = useRef(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const createdIds = new Set(Object.values(createdProjectActions));
  const activeChildCount = node.children.filter((child) =>
    child.metadata?.completed !== true &&
    !["root", "list", "tagging", "tag"].includes(child.metadata?.type ?? "") &&
    !createdIds.has(child.id)
  ).length;
  const createdActionCount = Object.keys(createdProjectActions).length;
  const activeChildNames = new Set(node.children
    .filter((child) => child.metadata?.completed !== true && !["root", "list", "tagging", "tag"].includes(child.metadata?.type ?? ""))
    .map((child) => child.name.trim().toLocaleLowerCase()));
  const createdActionNames = new Set(projectActionTitles
    .filter((_, index) => createdProjectActions[index] != null)
    .map((title) => title.trim().toLocaleLowerCase()));
  const enteredActionNames = new Set(projectActionTitles
    .filter((title, index) => title.trim() && createdProjectActions[index] == null)
    .map((title) => title.trim().toLocaleLowerCase())
    .filter((title) => !activeChildNames.has(title) && !createdActionNames.has(title)));
  const enteredActionCount = enteredActionNames.size;
  const enteredTitles = projectActionTitles
    .filter((title, index) => title.trim() && createdProjectActions[index] == null)
    .map((title) => title.trim().toLocaleLowerCase());
  const hasDuplicateActionTitles =
    enteredTitles.length !== new Set(enteredTitles).size ||
    enteredTitles.some((title) => activeChildNames.has(title) || createdActionNames.has(title));
  const projectActionCount = activeChildCount + createdActionCount + enteredActionCount;
  const busy = decisionSaving || updateNode.isPending || deleteSaving || membershipSaving || tagsSaving || createNode.isPending || followUpSaving;
  const descendantCount = countDescendants(node);
  let ancestorId = node.parent_node;
  const seenAncestorIds = new Set<number>();
  let ownedByNextActions = false;
  while (ancestorId != null && !seenAncestorIds.has(ancestorId)) {
    if (ancestorId === settings?.nextActions) {
      ownedByNextActions = true;
      break;
    }
    seenAncestorIds.add(ancestorId);
    ancestorId = parentById.get(ancestorId) ?? null;
  }
  const inNextActions = ownedByNextActions || node.related_nodes.some((related) =>
    related.id === settings?.nextActions && related.relation_type === "member_of" && related.relation_direction === "outgoing"
  );

  const beginMove = (targetId: number | null | undefined, targetLabel: string) => {
    if (targetId == null || busy) return;
    setSaveError(null);
    setFollowUpError(null);
    if (targetLabel === "Projects" || targetLabel === "Waiting For" || targetLabel === "Scheduled") {
      setFollowUpStep(targetLabel === "Projects" ? "projects" : targetLabel === "Waiting For" ? "waiting" : "scheduled");
      return;
    }
    void decide({ parentNode: targetId });
  };

  const parentTarget = followUpStep === "projects" ? settings?.projects
    : followUpStep === "waiting" ? settings?.waiting
      : followUpStep === "scheduled" ? settings?.scheduled : undefined;

  const submitProjectFollowUp = async () => {
    if (parentTarget == null || projectActionCount < 2 || hasDuplicateActionTitles || busy || followUpSavingRef.current) return;
    followUpSavingRef.current = true;
    setFollowUpSaving(true);
    setFollowUpError(null);
    setSaveError(null);
    const created = { ...createdProjectActions };
    const linked = { ...linkedProjectActions };
    try {
      for (let index = 0; index < projectActionTitles.length; index += 1) {
        const title = projectActionTitles[index].trim();
        if (!title) continue;
        if (created[index] == null) {
          try {
            const result = await createNode.mutateAsync({
              name: title,
              parentNode: node.id,
              userId,
              metadata: { type: "loop" },
            });
            if (!("result" in result)) {
              setFollowUpError("Could not create this next action. Created actions are saved; retry to continue.");
              return;
            }
            created[index] = result.result.id;
            setCreatedProjectActions({ ...created });
          } catch {
            setFollowUpError("Could not create this next action. Created actions are saved; retry to continue.");
            return;
          }
        }
        if (projectActionInNextActions[index] && settings?.nextActions != null && !linked[index]) {
          try {
            await listMembership.mutateAsync({ userId, nodeId: created[index], listId: settings.nextActions, member: true });
            linked[index] = true;
            setLinkedProjectActions({ ...linked });
          } catch {
            setFollowUpError("Could not add this action to Next Actions. Created actions are saved; retry to continue.");
            return;
          }
        }
      }
      await decide({ parentNode: parentTarget });
    } finally {
      followUpSavingRef.current = false;
      setFollowUpSaving(false);
    }
  };

  const baseTitle = node.metadata?.waitingFor && node.name.startsWith(`Waiting for ${node.metadata.waitingFor}: `)
    ? node.name.slice(`Waiting for ${node.metadata.waitingFor}: `.length)
    : node.name;

  const handleCreateTag = async (category: TreeNode, tagName: string) => {
    const result = await createNode.mutateAsync({ name: tagName, parentNode: category.id, userId, metadata: { type: "tag" } });
    if (!("result" in result)) throw new Error("Could not create tag");
    return result.result.id;
  };

  const handleCategoryChange = async (category: TreeNode, rawValues: (number | string)[]) => {
    if (tagOperationPending.current) return;
    tagOperationPending.current = true;
    setTagsSaving(true);
    setTagError(null);
    const previousIds = selectedTagIdsRef.current;
    const options = category.children ?? [];
    const categoryIds = options.map((tag) => tag.id);
    try {
      const chosen: number[] = [];
      for (const value of rawValues) {
        if (typeof value === "number") {
          chosen.push(value);
        } else {
          const name = value.trim();
          const existing = options.find((tag) => tag.name.trim().toLowerCase() === name.toLowerCase());
          if (existing) chosen.push(existing.id);
          else if (name) chosen.push(await handleCreateTag(category, name));
        }
      }
      const allowedIds = [...categoryIds, ...chosen];
      const nextIds = [...previousIds.filter((id) => !categoryIds.includes(id)), ...chosen];
      selectedTagIdsRef.current = nextIds;
      setSelectedTagIds(nextIds);
      await setCategoryTags.mutateAsync({
        userId,
        nodeId: node.id,
        categoryTagIds: allowedIds,
        selectedTagIds: nextIds,
      });
    } catch {
      selectedTagIdsRef.current = previousIds;
      setSelectedTagIds(previousIds);
      setTagError("Could not save Areas of Focus or Contexts. Please try again.");
    } finally {
      tagOperationPending.current = false;
      setTagsSaving(false);
    }
  };

  const addProjectActionRow = () => {
    setProjectActionTitles((previous) => [...previous, ""]);
    setProjectActionInNextActions((previous) => [...previous, true]);
  };

  const submitFollowUp = () => {
    if (parentTarget == null) return;
    if (followUpStep === "projects" && projectActionCount >= 2 && !hasDuplicateActionTitles) {
      void submitProjectFollowUp();
    } else if (followUpStep === "waiting" && waitingPerson.trim()) {
      void decide({ parentNode: parentTarget, name: `Waiting for ${waitingPerson.trim()}: ${baseTitle}`, metadata: { waitingFor: waitingPerson.trim() } });
    } else if (followUpStep === "scheduled" && scheduledDate) {
      void decide({ parentNode: parentTarget, metadata: { dueDate: scheduledDate } });
    }
  };

  const handleShortcut = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen || busy || shortcutTimerRef.current || event.nativeEvent.isComposing) return;
    const target = event.target;
    const editable = target instanceof HTMLElement && (
      target.isContentEditable || !!target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']")
    );
    if (editable && (followUpStep || confirmingDelete) && !(target instanceof HTMLElement && target.closest("[data-workflow-step]"))) return;
    const shortcut = getWorkflowShortcut(event, { followUpStep, confirmingDelete, editable });
    if (!shortcut) return;

    let action: (() => void) | null = null;
    if (shortcut.startsWith("move-")) {
      const move = moveActions[Number(shortcut.slice(-1))];
      if (move?.id != null && !invalidMoveTargetIds.includes(move.id)) {
        action = () => beginMove(move.id, move.label);
      }
    } else {
      switch (shortcut) {
        case "complete": action = () => void decide({ metadata: { completed: true } }); break;
        case "add-next-actions":
          if (settings?.nextActions != null && !listDataLoading && node.id !== settings.nextActions && !inNextActions) {
            action = () => void addToNextActions();
          }
          break;
        case "keep": if (mode === "review") action = () => void decide({ metadata: {} }); break;
        case "delete": action = () => { setSaveError(null); setConfirmingDelete(true); }; break;
        case "previous": if (onPrevious && currentIndex > 0) action = onPrevious; break;
        case "skip": action = onAdvance; break;
        case "edit": if (onEdit) action = onEdit; break;
        case "submit-follow-up":
          if (parentTarget != null && (followUpStep === "projects" ? projectActionCount >= 2 && !hasDuplicateActionTitles : followUpStep === "waiting" ? !!waitingPerson.trim() : !!scheduledDate)) {
            action = submitFollowUp;
          }
          break;
        case "add-project-action": action = addProjectActionRow; break;
        case "confirm-delete": action = () => void confirmDelete(); break;
      }
    }

    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    setActiveShortcut(shortcut);
    shortcutTimerRef.current = setTimeout(() => {
      shortcutTimerRef.current = null;
      setActiveShortcut(null);
      action();
    }, 180);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (open || busy) return;
      if (confirmingDelete) {
        setConfirmingDelete(false);
        setSaveError(null);
      } else onClose();
    }}>
      <DialogContent
        ref={dialogContentRef}
        className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl"
        onKeyDownCapture={handleShortcut}
        onEscapeKeyDown={(event) => {
          if (busy) {
            event.preventDefault();
          } else if (confirmingDelete) {
            event.preventDefault();
            setConfirmingDelete(false);
            setSaveError(null);
          } else if (followUpStep) {
            event.preventDefault();
            setFollowUpStep(null);
            setFollowUpError(null);
            setSaveError(null);
          }
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1} className="break-words focus:outline-none">{node.name}</DialogTitle>
          <DialogDescription>
            {mode === "review" ? `Reviewing item ${currentIndex + 1} of ${totalCount}` : `Processing item ${currentIndex + 1} of ${totalCount}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {context && <p className="text-sm text-muted-foreground">{context}</p>}
          {mode === "review" && <p className="text-xs text-muted-foreground">{formatReviewedAt(node.metadata?.lastReviewedAt)}</p>}
          {node.content && <div className="whitespace-pre-wrap break-words rounded-md bg-muted/50 p-4 text-sm">{node.content}</div>}
        </div>

        {tagCategories.length > 0 && (
          <section className="space-y-3 border-t pt-3" aria-label="Areas of Focus and Contexts">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Areas of Focus &amp; Contexts</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {tagCategories.map((category) => {
                const categoryTagIds = category.children.map((tag) => tag.id);
                const options: Option[] = category.children.map((tag) => ({ id: tag.id, label: tag.name, value: tag.id }));
                return <div key={category.id} className="space-y-2">
                  <label className="text-sm font-medium">{category.name}</label>
                  <MultiSelectAutocomplete
                    options={options}
                    value={selectedTagIds.filter((id) => categoryTagIds.includes(id))}
                    onChange={(values) => void handleCategoryChange(category, values)}
                    onSelectionComplete={() => titleRef.current?.focus()}
                    placeholder={`Add ${category.name.toLowerCase()}…`}
                    disabled={busy}
                    freeSolo
                    noOptionsText="No tags found"
                  />
                </div>;
              })}
            </div>
            {tagError && <p role="alert" className="text-sm text-destructive">{tagError}</p>}
          </section>
        )}

        {confirmingDelete ? (
          <section className="space-y-3 border-t pt-3" aria-label="Confirm deletion" data-workflow-step="">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Delete this item?</h3>
            <p className="break-words text-sm">This will permanently delete <strong>{node.name}</strong>{descendantCount > 0 && ` and ${descendantCount} child item${descendantCount === 1 ? "" : "s"}`}.</p>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => { setConfirmingDelete(false); setSaveError(null); }} disabled={busy}>Cancel <ShortcutHint shortcut="Esc" className="ml-2" /></Button>
              <Button type="button" variant="destructive" className={shortcutFeedback("confirm-delete")} onClick={() => void confirmDelete()} disabled={busy}>
                {deleteSaving ? "Deleting…" : `Delete ${descendantCount + 1} item${descendantCount === 0 ? "" : "s"}`}
                {!deleteSaving && <ShortcutHint shortcut="Mod+Enter" className="ml-2" />}
              </Button>
            </div>
          </section>
        ) : followUpStep ? (
          <section className="space-y-3 border-t pt-3" aria-label={`${followUpStep} follow-up`} data-workflow-step="">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {followUpStep === "projects" ? "Add next actions" : followUpStep === "waiting" ? "Who are you waiting for?" : "Choose a date"}
            </h3>
            {followUpStep === "projects" && <>
              <p className="text-sm text-muted-foreground">
                This project has {activeChildCount} active {activeChildCount === 1 ? "next action" : "next actions"}. Add actions until it has at least two.
              </p>
              <div className="space-y-2">
                {projectActionTitles.map((title, index) => {
                  const created = createdProjectActions[index] != null;
                  return <div key={index} className="space-y-1">
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setProjectActionTitles((previous) => previous.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                      disabled={created || busy}
                      placeholder={`Next action ${index + 1}`}
                      aria-label={`Next action ${index + 1}`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {settings?.nextActions != null && <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        id={`project-action-next-actions-${node.id}-${index}`}
                        checked={projectActionInNextActions[index] ?? true}
                        onCheckedChange={(checked) => setProjectActionInNextActions((previous) => previous.map((value, itemIndex) => itemIndex === index ? checked === true : value))}
                        disabled={created || busy}
                      />
                      <label htmlFor={`project-action-next-actions-${node.id}-${index}`}>Also show in Next Actions</label>
                    </div>}
                  </div>;
                })}
              </div>
              <Button type="button" variant="outline" className={shortcutFeedback("add-project-action")} onClick={addProjectActionRow} disabled={busy}>Add action <ShortcutHint shortcut="Mod+Shift+Enter" className="ml-2" /></Button>
              {projectActionCount < 2 && <p className="text-xs text-muted-foreground">Add at least {2 - projectActionCount} more {2 - projectActionCount === 1 ? "action" : "actions"} before moving this item.</p>}
              {hasDuplicateActionTitles && <p className="text-xs text-destructive">Give each new action a different title from the existing actions.</p>}
              {createdActionCount > 0 && <p className="text-xs text-muted-foreground">Created actions stay under this item if you go Back or the move fails.</p>}
            </>}
            {followUpStep === "waiting" && <div className="space-y-2">
              <label htmlFor="waiting-person" className="text-sm font-medium">Person or organization</label>
              <input
                id="waiting-person"
                type="text"
                value={waitingPerson}
                onChange={(event) => setWaitingPerson(event.target.value)}
                disabled={busy}
                placeholder="Who are you waiting for?"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-sm text-muted-foreground">Preview: Waiting for {waitingPerson.trim() || "…"}: {baseTitle}</p>
            </div>}
            {followUpStep === "scheduled" && <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="workflow-due-date">Due date</label>
              <DueDatePicker
                id="workflow-due-date"
                value={scheduledDate}
                onChange={setScheduledDate}
                disabled={busy}
                portalContainer={dialogContentRef.current}
              />
            </div>}
            {followUpError && <p role="alert" className="text-sm text-destructive">{followUpError}</p>}
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => { setFollowUpStep(null); setFollowUpError(null); setSaveError(null); }} disabled={busy}>Back · Cancel <ShortcutHint shortcut="Esc" className="ml-2" /></Button>
              <Button
                type="button"
                className={shortcutFeedback("submit-follow-up")}
                onClick={submitFollowUp}
                disabled={busy || parentTarget == null || (followUpStep === "projects" && (projectActionCount < 2 || hasDuplicateActionTitles)) || (followUpStep === "waiting" && !waitingPerson.trim()) || (followUpStep === "scheduled" && !scheduledDate)}
              >
                {followUpStep === "projects" ? "Create actions & move to Projects" : followUpStep === "waiting" ? "Move to Waiting For" : "Move to Scheduled"}
                <ShortcutHint shortcut="Mod+Enter" className="ml-2" />
              </Button>
            </div>
          </section>
        ) : <section className="space-y-3 border-t pt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{mode === "review" ? "Review decisions" : "Choose an outcome"}</h3>
          <Button type="button" variant="outline" className={`h-auto w-full justify-start whitespace-normal py-3 text-left ${shortcutFeedback("complete")}`} onClick={() => void decide({ metadata: { completed: true } })} disabled={busy}>
            <span className="min-w-0 flex-1"><span className="block font-medium">Mark complete</span><span className="block text-xs text-muted-foreground">Finish this item{mode === "review" ? " and record the review." : "."}</span></span>
            <ShortcutHint shortcut="C" className="ml-2" />
          </Button>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {moveActions.map(({ id, label, description, shortcut }, index) => {
              const invalid = id != null && invalidMoveTargetIds.includes(id);
              return <Button key={label} type="button" variant="outline" className={`h-auto justify-start whitespace-normal py-3 text-left ${shortcutFeedback(`move-${index}` as WorkflowShortcut)}`} onClick={() => beginMove(id, label)} disabled={busy || id == null || invalid}>
                <span className="min-w-0 flex-1"><span className="block font-medium">Move to {label}</span><span className="block text-xs text-muted-foreground">{id == null ? "Configure this list in settings to use this action." : invalid ? "This move would place an item inside itself." : description}</span></span>
                <ShortcutHint shortcut={shortcut} className="ml-2" />
              </Button>;
            })}
          </div>
          {settings?.nextActions != null && !listDataLoading && node.id !== settings.nextActions && !inNextActions && <Button type="button" variant="outline" className={`h-auto w-full justify-start whitespace-normal py-3 text-left ${shortcutFeedback("add-next-actions")}`} onClick={() => void addToNextActions()} disabled={busy}>
            <span className="min-w-0 flex-1"><span className="block font-medium">Also show in Next Actions</span><span className="block text-xs text-muted-foreground">Keep this item under its current parent and add it to the Next Actions list.</span></span>
            <ShortcutHint shortcut="A" className="ml-2" />
          </Button>}
          {mode === "review" && <Button type="button" variant="outline" className={`w-full ${shortcutFeedback("keep")}`} onClick={() => void decide({ metadata: {} })} disabled={busy}>Keep as is · Mark reviewed <ShortcutHint shortcut="K" className="ml-2" /></Button>}
          <Button type="button" variant="outline" className={`w-full text-destructive hover:text-destructive ${shortcutFeedback("delete")}`} onClick={() => { setSaveError(null); setConfirmingDelete(true); }} disabled={busy}>
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Delete item <ShortcutHint shortcut="D" className="ml-2" />
          </Button>
        </section>}

        {!followUpStep && !confirmingDelete && <>
        {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {onPrevious && <Button type="button" variant="outline" className={shortcutFeedback("previous")} onClick={onPrevious} disabled={currentIndex === 0 || busy}><ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />Previous <ShortcutHint shortcut="ArrowLeft" className="ml-2" /></Button>}
            <Button type="button" variant="outline" className={shortcutFeedback("skip")} onClick={onAdvance} disabled={busy}>Skip <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /><ShortcutHint shortcut="ArrowRight" className="ml-2" /></Button>
          </div>
          {onEdit && <Button type="button" variant="outline" className={shortcutFeedback("edit")} onClick={onEdit} disabled={busy}><Pencil className="mr-1 h-4 w-4" aria-hidden="true" />Edit <ShortcutHint shortcut="E" className="ml-2" /></Button>}
        </DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
  );
}
