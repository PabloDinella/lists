import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNodeManager } from "@/method/manager/productivityManager/deleteNode";

type DeleteNodeParams = {
  node_id: number;
  user_id: string;
};

export function useDeleteNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DeleteNodeParams) => deleteNodeManager(params),
    onSuccess: (_, variables) => {
      // Invalidate all nodes queries for this user
      queryClient.invalidateQueries({ 
        queryKey: ["nodes", variables.user_id] 
      });
    },
    onError: (error) => {
      console.error("Failed to delete node:", error);
    },
  });
}
