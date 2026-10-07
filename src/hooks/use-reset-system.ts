import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getOfflineStore } from "@/lib/offline";
import { createDefaultStructure } from "@/lib/default-structure";

export function useResetSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      // First, delete all existing user data
      await deleteAllUserData(userId);

      // Then, create the default structure
      await createDefaultStructure(userId);

      return { success: true };
    },
    onSuccess: (_, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
      queryClient.invalidateQueries({
        queryKey: ["settings", variables.userId],
      });
    },
  });
}

async function deleteAllUserData(userId: string) {
  const store = await getOfflineStore(userId);
  // Delete all nodes for this user (cascading will handle children)
  for (const relationship of await store.relationships()) {
    if (relationship.user_id === userId) await store.deleteRelationship(relationship.id);
  }
  for (const node of await store.nodes()) {
    if (node.user_id === userId) await store.deleteNode(node.id);
  }

  // Delete settings for this user
  for (const settings of await store.settings()) {
    if (settings.user_id === userId) await store.deleteSettings(settings.id);
  }

  // Delete any other user data (tasks, projects, areas) if they exist
  // Note: These tables might not exist in the current schema, so we skip them for now
}
