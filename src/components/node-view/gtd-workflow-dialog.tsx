import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useCreateNode } from "@/hooks/use-create-node";
import { useSetNodeCategoryTags } from "@/hooks/use-set-node-category-tags";
import { useUpdateNode } from "@/hooks/use-update-node";
import type { GTDSettings } from "@/hooks/use-settings";
import type { Metadata } from "@/method/access/nodeAccess/models";
import type { TreeNode } from "./use-list-data";
import { Button } from "../ui/button";
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
  onPrevious,
  onEdit,
}: GTDWorkflowDialogProps) {
  const updateNode = useUpdateNode();
  const setCategoryTags = useSetNodeCategoryTags();
  const createNode = useCreateNode();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(() => node.related_nodes.map((related) => related.id));
  const titleRef = useRef<HTMLHeadingElement>(null);
  const selectedTagIdsRef = useRef(selectedTagIds);
  const tagOperationPending = useRef(false);
  const [tagsSaving, setTagsSaving] = useState(false);
  const serverRelatedIds = node.related_nodes
    .map((related) => related.id)
    .sort((a, b) => a - b)
    .join(",");

  useEffect(() => {
    if (tagsSaving) return;
    const ids = serverRelatedIds ? serverRelatedIds.split(",").map(Number) : [];
    selectedTagIdsRef.current = ids;
    setSelectedTagIds(ids);
  }, [node.id, serverRelatedIds, tagsSaving]);

  const saveDecision = async (decision: { metadata?: Metadata; parentNode?: number }) => {
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
    }
  };

  const decide = (decision: { metadata?: Metadata; parentNode?: number }) =>
    saveDecision(mode === "review" ? { ...decision, metadata: { ...(decision.metadata ?? {}), lastReviewedAt: new Date().toISOString() } } : decision);

  const moveActions = [
    { id: settings?.nextActions, label: "Next Actions", description: "A single action you can do yourself." },
    { id: settings?.waiting, label: "Waiting For", description: "Something delegated or pending." },
    { id: settings?.projects, label: "Projects", description: "A multi step outcome." },
    { id: settings?.scheduled, label: "Scheduled", description: "An item you intend to do on a specific date." },
    { id: settings?.somedayMaybe, label: "Someday/Maybe", description: "A possibility for later." },
    { id: settings?.reference, label: "Reference", description: "Information to keep for later." },
  ];

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl"
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
                    placeholder={`Add ${category.name.toLowerCase()}…`}
                    disabled={tagsSaving || updateNode.isPending}
                    freeSolo
                    noOptionsText="No tags found"
                  />
                </div>;
              })}
            </div>
            {tagError && <p role="alert" className="text-sm text-destructive">{tagError}</p>}
          </section>
        )}

        <section className="space-y-3 border-t pt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{mode === "review" ? "Review decisions" : "Choose an outcome"}</h3>
          <Button type="button" variant="outline" className="h-auto w-full justify-start whitespace-normal py-3 text-left" onClick={() => void decide({ metadata: { completed: true } })} disabled={updateNode.isPending || tagsSaving}>
            <span><span className="block font-medium">Mark complete</span><span className="block text-xs text-muted-foreground">Finish this item{mode === "review" ? " and record the review." : "."}</span></span>
          </Button>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {moveActions.map(({ id, label, description }) => {
              const invalid = id != null && invalidMoveTargetIds.includes(id);
              return <Button key={label} type="button" variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => id != null && void decide({ parentNode: id })} disabled={updateNode.isPending || tagsSaving || id == null || invalid}>
                <span><span className="block font-medium">Move to {label}</span><span className="block text-xs text-muted-foreground">{id == null ? "Configure this list in settings to use this action." : invalid ? "This move would place an item inside itself." : description}</span></span>
              </Button>;
            })}
          </div>
          {mode === "review" && <Button type="button" variant="outline" className="w-full" onClick={() => void decide({ metadata: {} })} disabled={updateNode.isPending || tagsSaving}>Keep as is · Mark reviewed</Button>}
        </section>

        {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {onPrevious && <Button type="button" variant="outline" onClick={onPrevious} disabled={currentIndex === 0 || updateNode.isPending || tagsSaving}><ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />Previous</Button>}
            <Button type="button" variant="outline" onClick={onAdvance} disabled={updateNode.isPending || tagsSaving}>Skip <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
          </div>
          {onEdit && <Button type="button" variant="outline" onClick={onEdit} disabled={updateNode.isPending || tagsSaving}><Pencil className="mr-1 h-4 w-4" aria-hidden="true" />Edit</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
