import type React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { AppLayout } from "./app-layout";
import { supabase } from "@/lib/supabase";
import { useNodes } from "@/hooks/use-nodes";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import { useUpdateNode } from "@/hooks/use-update-node";
import { useDeleteNode } from "@/hooks/use-delete-node";
import { useCreateNode } from "@/hooks/use-create-node";
import type { Node as DBNode } from "@/method/access/nodeAccess/createNode";
import { useOrdering, useUpsertOrdering } from "@/hooks/use-ordering";
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvided, type DraggableStateSnapshot, type DroppableProvided } from '@hello-pangea/dnd';

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

  // remove arrayMove helper, reimplement lightweight
  const arrayMove = useCallback(<T,>(arr: T[], from: number, to: number): T[] => {
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }, []);

  // onDragEnd handler for library
  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    setLocalLists(prev => {
      const next = arrayMove(prev, source.index, destination.index);
      // persist asynchronously (optimistic)
      const ids = next.map(l => l.id);
      (async () => {
        if (userId) {
          try { await upsertOrdering.mutateAsync({ user_id: userId, root_node: null, order: ids }); } catch (e) { console.error('Failed to persist ordering:', e); }
        }
      })();
      return next;
    });
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
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="root">
                {(provided: DroppableProvided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {localLists.map((list, index) => (
                      <Draggable key={list.id} draggableId={list.id.toString()} index={index}>
                        {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`p-4 border rounded-lg bg-background transition-[box-shadow,transform] duration-150 ${snapshot.isDragging ? 'shadow-md ring-1 ring-border' : 'hover:shadow-sm'}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                {/* drag handle */}
                                <button
                                  className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                                  {...dragProvided.dragHandleProps}
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
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <p className="text-center text-muted-foreground py-8">No lists found.</p>
          )}
        </div>
      )}
    </AppLayout>
  );
}
