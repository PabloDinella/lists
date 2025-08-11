import type React from "react";
import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import { AppLayout } from "./app-layout";
import { supabase } from "@/lib/supabase";
import { useNodes } from "@/hooks/use-nodes";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash2, Edit, GripVertical } from "lucide-react";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { useCreateNode } from "@/hooks/use-create-node";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";
import { useOrdering, useUpsertOrdering } from "@/hooks/use-ordering";

export function TagManagement() {
  const [userId, setUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  // creation state
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  // local ordered lists and DnD state
  const [localLists, setLocalLists] = useState<DBNode[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverAfter, setHoverAfter] = useState<boolean>(false);
  const dragGhostRef = useRef<HTMLElement | null>(null);
  const [placeholderHeight, setPlaceholderHeight] = useState<number | null>(null);

  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();
  const createNodeMutation = useCreateNode();
  const upsertOrdering = useUpsertOrdering();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const { data: lists, isLoading, isError } = useNodes({ user_id: userId ?? undefined, parent_node: null });
  const { data: ordering } = useOrdering({ user_id: userId ?? undefined, root_node: null });

  // derive server-ordered arrays
  const orderedByTable: DBNode[] = useMemo(() => {
    if (!lists) return [];
    if (!ordering?.order?.length) return lists;
    const byId = new Map(lists.map(l => [l.id, l] as const));
    const inOrder = ordering.order.map(id => byId.get(id)).filter(Boolean) as DBNode[];
    // append any missing ids (newly created not in table yet)
    const missing = lists.filter(l => !ordering.order.includes(l.id));
    return [...inOrder, ...missing];
  }, [lists, ordering]);

  // keep local copy in sync with ordered view
  useEffect(() => {
    setLocalLists(orderedByTable);
  }, [orderedByTable]);

  const handleEditList = (list: { id: number; name: string; content?: string | null }) => {
    setEditingId(list.id);
    setEditName(list.name);
    setEditDescription(list.content || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !userId) return;
    try {
      await updateNodeMutation.mutateAsync({
        node_id: editingId,
        name: editName.trim(),
        content: editDescription.trim() || undefined,
        user_id: userId,
      });
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update list:", error);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!userId) return;
    try {
      await deleteNodeMutation.mutateAsync({ node_id: listId, user_id: userId });
    } catch (error) {
      console.error("Failed to delete list:", error);
    }
  };

  const handleCreateList = async () => {
    if (!userId) return;
    const name = newName.trim();
    const content = newDescription.trim();
    if (!name) return;
    try {
      const res = await createNodeMutation.mutateAsync({
        name,
        content: content || undefined,
        user_id: userId,
      });
      setNewName("");
      setNewDescription("");
      setCreating(false);
      // append new id to ordering
      if (res && "result" in res) {
        const current = ordering?.order ?? [];
        const next = [...current, res.result.id];
        await upsertOrdering.mutateAsync({ user_id: userId, root_node: null, order: next });
      }
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  // DnD helpers
  const arrayMove = <T,>(arr: T[], from: number, to: number): T[] => {
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  };

  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // use the full card as drag image so it follows the cursor
    const handleEl = e.currentTarget as HTMLElement;
    const cardEl = handleEl.closest('.draggable-card') as HTMLElement | null;
    if (cardEl && e.dataTransfer.setDragImage) {
      // store the height to render a placeholder with same size
      setPlaceholderHeight(cardEl.offsetHeight);
      // Create a custom ghost by cloning the card with styles
      const ghost = cardEl.cloneNode(true) as HTMLElement;
      ghost.style.position = 'fixed';
      ghost.style.top = '-1000px';
      ghost.style.left = '-1000px';
      ghost.style.width = `${cardEl.offsetWidth}px`;
      ghost.style.pointerEvents = 'none';
      ghost.style.transform = 'scale(0.98)';
      ghost.style.opacity = '0.9';
      ghost.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)';
      document.body.appendChild(ghost);
      dragGhostRef.current = ghost;
      // offset near the cursor for a natural feel
      e.dataTransfer.setDragImage(ghost, 16, 16);
    }
  };

  const handleDragOver = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const after = e.clientY - rect.top > rect.height / 2;
    setHoverIndex(index);
    setHoverAfter(after);
  };

  const handleDrop = async (index: number) => {
    if (dragIndex === null || !userId) {
      setDragIndex(null);
      setHoverIndex(null);
      setPlaceholderHeight(null);
      if (dragGhostRef.current && dragGhostRef.current.parentNode) {
        dragGhostRef.current.parentNode.removeChild(dragGhostRef.current);
      }
      dragGhostRef.current = null;
      return;
    }

    // compute insertion index (before/after visual)
    const base = index;
    let insertIndex = hoverAfter ? base + 1 : base;
    if (dragIndex < insertIndex) insertIndex -= 1;

    const reordered = arrayMove(localLists, dragIndex, insertIndex);
    setLocalLists(reordered);

    // persist new ordering ids
    const ids = reordered.map((l) => l.id);
    try {
      await upsertOrdering.mutateAsync({ user_id: userId, root_node: null, order: ids });
    } catch (e) {
      console.error("Failed to persist ordering:", e);
    } finally {
      setDragIndex(null);
      setHoverIndex(null);
      setPlaceholderHeight(null);
      if (dragGhostRef.current && dragGhostRef.current.parentNode) {
        dragGhostRef.current.parentNode.removeChild(dragGhostRef.current);
      }
      dragGhostRef.current = null;
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setHoverIndex(null);
    setPlaceholderHeight(null);
    if (dragGhostRef.current && dragGhostRef.current.parentNode) {
      dragGhostRef.current.parentNode.removeChild(dragGhostRef.current);
    }
    dragGhostRef.current = null;
  };

  if (!userId) {
    return (
      <AppLayout title="Manage Lists">
        <p>Please sign in to manage lists.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Manage Lists"
      onNewItem={() => setCreating(true)}
      newItemLabel="New List"
    >
      {isLoading && <p>Loading lists…</p>}
      {isError && <p className="text-red-500 text-sm">Failed to load lists.</p>}
      {!isLoading && !isError && (
        <div className="space-y-4">
          {/* Inline create form */}
          {creating && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="List name"
                />
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                />
                <Button
                  size="sm"
                  onClick={handleCreateList}
                  disabled={createNodeMutation.isPending || !newName.trim()}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                    setNewDescription("");
                  }}
                  disabled={createNodeMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {localLists && localLists.length > 0 ? (
            localLists.map((list, index) => (
              <Fragment key={list.id}>
                {/* drop placeholder before */}
                {hoverIndex === index && !hoverAfter && (
                  <div
                    className="rounded-lg bg-foreground/10 border border-foreground/20 mb-2"
                    style={{ height: placeholderHeight ?? 64 }}
                  />
                )}
                <div
                  className={`draggable-card p-4 border rounded-lg transition-[box-shadow] duration-150 ${dragIndex === index ? "opacity-0" : "hover:shadow-sm"}`}
                  onDragOver={(e) => handleDragOver(index, e)}
                  onDrop={() => handleDrop(index)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {/* drag handle */}
                      <button
                        className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => handleDragStart(index, e)}
                        onDragEnd={handleDragEnd}
                        aria-label="Drag to reorder"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      {editingId === list.id ? (
                        <div className="flex-1 grid gap-2 sm:grid-cols-2">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                          <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description (optional)" />
                        </div>
                      ) : (
                        <div className="flex-1">
                          <h3 className="font-medium">{list.name}</h3>
                          {list.content && (
                            <p className="text-sm text-muted-foreground">{list.content}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Created {new Date(list.created_at).toLocaleString()} • ID: {list.id}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === list.id ? (
                        <>
                          <Button size="sm" onClick={handleSaveEdit} disabled={updateNodeMutation.isPending}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={updateNodeMutation.isPending}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEditList(list)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteList(list.id)} disabled={deleteNodeMutation.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {/* drop placeholder after */}
                {hoverIndex === index && hoverAfter && (
                  <div
                    className="rounded-lg bg-foreground/10 border border-foreground/20 mt-2"
                    style={{ height: placeholderHeight ?? 64 }}
                  />
                )}
              </Fragment>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No lists found.</p>
          )}
        </div>
      )}
    </AppLayout>
  );
}
