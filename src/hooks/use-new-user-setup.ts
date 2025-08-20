import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createDefaultStructure } from "@/lib/default-structure";

export function useNewUserSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      // Check if user already has nodes
      const { data: existingNodes } = await supabase
        .from("node")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

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
