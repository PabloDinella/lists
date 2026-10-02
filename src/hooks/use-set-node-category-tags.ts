import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type SetNodeCategoryTagsParams = {
  userId: string;
  nodeId: number;
  categoryTagIds: number[];
  selectedTagIds: number[];
};

/** Sets the selected tags for one category, preserving every other relationship. */
export function useSetNodeCategoryTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      nodeId,
      categoryTagIds,
      selectedTagIds,
    }: SetNodeCategoryTagsParams) => {
      const { data: relationships, error: readError } = await supabase
        .from("relationship")
        .select("id, node_id_1, node_id_2, relation_type")
        .eq("user_id", userId)
        .or(`node_id_1.eq.${nodeId},node_id_2.eq.${nodeId}`);

      if (readError) throw readError;

      const categoryIds = new Set(categoryTagIds);
      const selectedIds = new Set(selectedTagIds.filter((id) => categoryIds.has(id)));
      const categoryRelationships = (relationships ?? []).flatMap((relationship) => {
        if (relationship.relation_type !== "tagged_with") return [];

        const otherNodeId = relationship.node_id_1 === nodeId
          ? relationship.node_id_2
          : relationship.node_id_2 === nodeId
            ? relationship.node_id_1
            : null;

        return otherNodeId !== null && otherNodeId !== undefined && categoryIds.has(otherNodeId)
          ? [{ id: relationship.id, otherNodeId }]
          : [];
      });

      const relationshipIdsToDelete = categoryRelationships
        .filter(({ otherNodeId }) => !selectedIds.has(otherNodeId))
        .map(({ id }) => id);

      if (relationshipIdsToDelete.length > 0) {
        const { error } = await supabase
          .from("relationship")
          .delete()
          .eq("user_id", userId)
          .in("id", relationshipIdsToDelete);
        if (error) throw error;
      }

      const existingTagIds = new Set(categoryRelationships.map(({ otherNodeId }) => otherNodeId));
      const missingTagIds = [...selectedIds].filter((id) => !existingTagIds.has(id));

      if (missingTagIds.length > 0) {
        const { error } = await supabase.from("relationship").insert(
          missingTagIds.map((tagId) => ({
            user_id: userId,
            node_id_1: nodeId,
            node_id_2: tagId,
            relation_type: "tagged_with",
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
    },
    onError: async (_error, variables) => {
      // A delete may succeed before a later insert fails; refresh either way.
      await queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
    },
  });
}
