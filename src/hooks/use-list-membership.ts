import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getOfflineStore } from "@/lib/offline";

export type ListMembershipParams = {
  userId: string;
  nodeId: number;
  listId: number;
  member: boolean;
};

/** Changes only the additional display membership, never the owning parent. */
export function useListMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, nodeId, listId, member }: ListMembershipParams) => {
      if (nodeId === listId) throw new Error("An item cannot be a member of itself.");
      const store = await getOfflineStore(userId);
      if (member) {
        const ids = new Set((await store.nodes()).map((node) => node.id));
        if (!ids.has(nodeId) || !ids.has(listId)) {
          throw new Error("Both items must belong to the current user.");
        }
      }
      const memberships = (await store.relationships()).filter((edge) =>
        edge.node_id_1 === nodeId &&
        edge.node_id_2 === listId &&
        edge.relation_type === "member_of"
      );
      if (member && memberships.length === 0) {
        await store.upsertRelationship({
          id: store.newId(),
          created_at: new Date().toISOString(),
          user_id: userId,
          node_id_1: nodeId,
          node_id_2: listId,
          relation_type: "member_of",
        });
      } else if (!member) {
        for (const edge of memberships) await store.deleteRelationship(edge.id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
    },
  });
}
