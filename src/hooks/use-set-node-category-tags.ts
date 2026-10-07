import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getOfflineStore } from "@/lib/offline";

type SetNodeCategoryTagsParams = {
  userId: string;
  nodeId: number;
  categoryTagIds: number[];
  selectedTagIds: number[];
};

/** Replaces this category's tag links while preserving every other relationship. */
export function useSetNodeCategoryTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, nodeId, categoryTagIds, selectedTagIds }: SetNodeCategoryTagsParams) => {
      const store = await getOfflineStore(userId);
      const category = new Set(categoryTagIds);
      const selected = new Set(selectedTagIds.filter((id) => category.has(id)));
      const links = (await store.relationships()).flatMap((edge) => {
        if (edge.relation_type !== "tagged_with") return [];
        const other = edge.node_id_1 === nodeId ? edge.node_id_2 : null;
        return other !== null && category.has(other) ? [{ edge, other }] : [];
      });
      for (const { edge, other } of links) {
        if (!selected.has(other)) await store.deleteRelationship(edge.id);
      }
      const existing = new Set(links.map(({ other }) => other));
      for (const tagId of selected) {
        if (existing.has(tagId)) continue;
        await store.upsertRelationship({
          id: store.newId(),
          created_at: new Date().toISOString(),
          user_id: userId,
          node_id_1: nodeId,
          node_id_2: tagId,
          relation_type: "tagged_with",
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
    },
  });
}
