import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getOfflineStore } from "@/lib/offline";
import { createDefaultStructure } from "@/lib/default-structure";

export function useNewUserSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const store = await getOfflineStore(userId);
      // Check if user already has nodes
      const existingNodes = (await store.nodes()).filter(node => node.user_id === userId);

      // If user already has nodes, don't create default structure
      if (existingNodes && existingNodes.length > 0) {
        return { success: true, skipped: true };
      }

      // Create the default structure for new user
      await createDefaultStructure(userId);

      return { success: true, skipped: false };
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
