import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
  // Delete all nodes for this user (cascading will handle children)
  const { error: nodesError } = await supabase
    .from("node")
    .delete()
    .eq("user_id", userId);

  if (nodesError) throw nodesError;

  // Delete settings for this user
  const { error: settingsError } = await supabase
    .from("settings")
    .delete()
    .eq("user_id", userId);

  if (settingsError) throw settingsError;

  // Delete any other user data (tasks, projects, areas) if they exist
  // Note: These tables might not exist in the current schema, so we skip them for now
}
