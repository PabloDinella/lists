import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteNodeManager } from "@/method/manager/productivityManager/deleteNode";
import { unwrapResult } from "@/lib/unwrap-result";

type DeleteNodeParams = {
  nodeId: number;
  userId: string;
};

export function useDeleteNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeleteNodeParams) => unwrapResult(await deleteNodeManager(params)),
    onSuccess: (_, variables) => {
      // Invalidate all nodes queries for this user
      queryClient.invalidateQueries({ 
        queryKey: ["nodes", variables.userId] 
      });
    },
    onError: (error) => {
      console.error("Failed to delete node:", error);
    },
  });
}
