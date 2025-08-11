import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNodeManager } from "@/method/manager/productivityManager/updateNode";

type UpdateNodeParams = {
  node_id: number;
  name?: string;
  content?: string;
  parent_node?: number | null;
  user_id: string;
  order?: number | null;
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
