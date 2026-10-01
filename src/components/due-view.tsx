import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateNode } from "@/hooks/use-update-node";
import type { Node } from "@/method/access/nodeAccess/models";
import { formatDueDate } from "@/lib/due-date";
import { getDueItems, getLocalDateString, type DueGroup } from "@/lib/due-items";
import { AppLayout } from "./app-layout";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Container } from "./ui/container";
import { EditNodeSheet } from "./node-view/edit-node-sheet";
import { useListData } from "./node-view/use-list-data";

const groups: { id: DueGroup; label: string }[] = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
];

export function DueView() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const navigate = useNavigate();
  const updateNode = useUpdateNode();
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const { hierarchicalTree, isLoading, isError } = useListData({ userId });
  const dueItems = getDueItems(hierarchicalTree, getLocalDateString());

  return (
    <AppLayout title="Needs Attention" searchNodes={hierarchicalTree}>
      <Container size="full">
        {isLoading && <p>Loading items…</p>}
        {isError && (
          <p className="text-sm text-red-500">Failed to load items.</p>
        )}
        {!isLoading && !isError && dueItems.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h2 className="font-medium">Nothing needs attention</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Items with a due date will appear here.
            </p>
          </div>
        )}
        {!isLoading && !isError && dueItems.length > 0 && (
          <div className="space-y-8">
            {groups.map(({ id, label }) => {
              const items = dueItems.filter((item) => item.group === id);
              if (items.length === 0) return null;

              return (
                <section key={id} aria-labelledby={`due-${id}`}>
                  <h2
                    id={`due-${id}`}
                    className="mb-3 text-lg font-semibold"
                  >
                    {label}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {items.length}
                    </span>
                  </h2>
                  <ul className="space-y-2">
                    {items.map(({ node, dueDate, context }) => (
                      <li
                        key={node.id}
                        className="flex items-center gap-3 rounded-lg border bg-background p-3"
                      >
                        {node.metadata?.type !== "list" && (
                          <Checkbox
                            checked={false}
                            disabled={!userId || updateNode.isPending}
                            aria-label={`Mark ${node.name} complete`}
                            onCheckedChange={(checked) => {
                              if (checked && userId) {
                                updateNode.mutate({
                                  nodeId: node.id,
                                  userId,
                                  metadata: { completed: true },
                                });
                              }
                            }}
                          />
                        )}
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => navigate(`/lists/${node.id}`)}
                        >
                          <span className="block truncate font-medium hover:underline">
                            {node.name}
                          </span>
                          {context && (
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {context}
                            </span>
                          )}
                          <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                            {formatDueDate(dueDate)}
                          </span>
                        </button>
                        <span className="hidden shrink-0 items-center gap-1 text-sm text-muted-foreground sm:flex">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          {formatDueDate(dueDate)}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingNode(node)}
                          aria-label={`Edit ${node.name}`}
                        >
                          Edit
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Container>
      {editingNode && (
        <EditNodeSheet
          node={editingNode}
          isOpen
          onClose={() => setEditingNode(null)}
          mode="edit"
          defaultParentId={editingNode.parent_node ?? 1}
        />
      )}
    </AppLayout>
  );
}
