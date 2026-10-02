import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type ListMembershipParams = {
  userId: string;
  nodeId: number;
  listId: number;
  member: boolean;
};

/** Adds or removes a node's generic membership in a list, preserving other links. */
export function useListMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, nodeId, listId, member }: ListMembershipParams) => {
      if (nodeId === listId) throw new Error("An item cannot be a member of itself.");
      if (member) {
        const { data: endpoints, error: endpointsError } = await supabase
          .from("node")
          .select("id")
          .eq("user_id", userId)
          .in("id", [nodeId, listId]);
        if (endpointsError) throw endpointsError;
        if (endpoints?.length !== 2) throw new Error("Both items must belong to the current user.");
      }
      const { data: memberships, error: readError } = await supabase
        .from("relationship")
        .select("id")
        .eq("user_id", userId)
        .eq("node_id_1", nodeId)
        .eq("node_id_2", listId)
        .eq("relation_type", "member_of");

      if (readError) throw readError;

      if (member) {
        // Treat an existing edge as success so repeated requests do not add duplicates.
        if (memberships?.length) return;

        const { error } = await supabase.from("relationship").insert({
          user_id: userId,
          node_id_1: nodeId,
          node_id_2: listId,
          relation_type: "member_of",
        });
        if (error) throw error;
        return;
      }

      const relationshipIds = (memberships ?? []).map(({ id }) => id);
      if (relationshipIds.length === 0) return;

      const { error } = await supabase
        .from("relationship")
        .delete()
        .eq("user_id", userId)
        .in("id", relationshipIds);
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
    },
    onError: async (_error, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
    },
  });
}
