import { useEffect, useMemo, useRef, useState } from "react";
import { MultiSelectAutocomplete, type Option } from "../ui/multi-select-autocomplete";
import { useListMembership } from "@/hooks/use-list-membership";
import type { Node } from "@/method/access/nodeAccess/models";
import type { TreeNode } from "./use-list-data";

interface ListMembershipFieldProps {
  node: Node;
  allNodes: TreeNode[];
  userId: string;
}

function collectMembershipIds(relatedNodes: Node["related_nodes"]): number[] {
  return [...new Set(relatedNodes
    .filter((related) => related.relation_type === "member_of" && related.relation_direction === "outgoing")
    .map((related) => related.id))];
}

export function ListMembershipField({ node, allNodes, userId }: ListMembershipFieldProps) {
  const membershipMutation = useListMembership();
  const serverMembershipIds = useMemo(() => collectMembershipIds(node.related_nodes), [node.related_nodes]);
  const [selectedListIds, setSelectedListIds] = useState<number[]>(serverMembershipIds);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    setSelectedListIds(serverMembershipIds);
  }, [serverMembershipIds]);

  const nodesById = new Map(allNodes.map((item) => [item.id, item]));
  const ownerIds = new Set<number>([node.id]);
  let ownerId = node.parent_node;
  while (ownerId != null && !ownerIds.has(ownerId)) {
    ownerIds.add(ownerId);
    ownerId = nodesById.get(ownerId)?.parent_node ?? null;
  }
  const availableLists = allNodes.filter(
    (list) => list.metadata?.type === "list" && !ownerIds.has(list.id),
  );
  const options: Option[] = availableLists.map((list) => ({
    id: list.id,
    value: list.id,
    label: list.name,
  }));

  const handleChange = async (values: (string | number)[]) => {
    if (savingRef.current) return;
    savingRef.current = true;
    const nextIds = values.filter((value): value is number => typeof value === "number");
    let confirmedIds = selectedListIds;
    setSelectedListIds(nextIds);
    setError(null);

    try {
      for (const listId of confirmedIds.filter((id) => !nextIds.includes(id))) {
        await membershipMutation.mutateAsync({ userId, nodeId: node.id, listId, member: false });
        confirmedIds = confirmedIds.filter((id) => id !== listId);
      }
      for (const listId of nextIds.filter((id) => !confirmedIds.includes(id))) {
        await membershipMutation.mutateAsync({ userId, nodeId: node.id, listId, member: true });
        confirmedIds = [...confirmedIds, listId];
      }
    } catch {
      setSelectedListIds(confirmedIds);
      setError("Could not finish updating list membership. Changes already saved are shown above; please try again.");
    } finally {
      savingRef.current = false;
    }
  };

  if (availableLists.length === 0) return null;

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">
        Also show in lists
      </span>
      <MultiSelectAutocomplete
        aria-label="Also show in lists"
        options={options}
        value={selectedListIds}
        onChange={handleChange}
        placeholder="Search lists..."
        disabled={membershipMutation.isPending}
        freeSolo={false}
        noOptionsText="No other lists found"
      />
      {membershipMutation.isPending && (
        <p className="text-xs text-muted-foreground" role="status">Saving list membership...</p>
      )}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Changes save immediately. The item stays in its current parent when added to another list.
      </p>
    </div>
  );
}
