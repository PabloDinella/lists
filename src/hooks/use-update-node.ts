import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNodeManager } from "@/method/manager/productivityManager/updateNode";
import type { Json } from "@/database.types";

type UpdateNodeParams = {
  node_id: number;
  name?: string;
  content?: string;
  parent_node?: number | null;
  user_id: string;
  order?: number | null;
  metadata?: Json;
};

export function useUpdateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateNodeParams) => updateNodeManager(params),
    onSuccess: (_, variables) => {
      // Invalidate all nodes queries for this user
      queryClient.invalidateQueries({ 
        queryKey: ["nodes", variables.user_id] 
      });
    },
    onError: (error) => {
      console.error("Failed to update node:", error);
    },
  });
}
