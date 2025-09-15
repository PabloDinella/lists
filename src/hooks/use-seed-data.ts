import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSeedData, clearUserData } from "@/lib/seed-data";

export function useSeedData() {
  const queryClient = useQueryClient();

  const createSeed = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      console.log("Creating seed data...");
      const nodeIdMap = await createSeedData(userId);
      return { success: true, nodeIdMap };
    },
    onSuccess: (_, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["settings", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["relationships", variables.userId] });
    },
    onError: (error) => {
      console.error("Failed to create seed data:", error);
    },
  });

  const clearData = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      console.log("Clearing user data...");
      await clearUserData(userId);
      return { success: true };
    },
    onSuccess: (_, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["nodes", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["settings", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["relationships", variables.userId] });
    },
    onError: (error) => {
      console.error("Failed to clear user data:", error);
    },
  });

  return {
    createSeed,
    clearData,
    isCreating: createSeed.isPending,
    isClearing: clearData.isPending,
  };
}
