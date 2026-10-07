import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNodeManager } from "@/method/manager/productivityManager/updateNode";
import { Metadata } from "@/method/access/nodeAccess/models";
import { unwrapResult } from "@/lib/unwrap-result";

type UpdateNodeParams = {
  nodeId: number;
  name?: string;
  content?: string;
  parentNode?: number | null;
  userId: string;
  metadata?: Metadata;
  relatedNodeIds?: number[];
  relationType?: string;
};

export function useUpdateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateNodeParams) => unwrapResult(await updateNodeManager(params)),
    onSuccess: (_, variables) => {
      // Invalidate all nodes queries for this user
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.userId],
      });
    },
    onError: (error) => {
      console.error("Failed to update node:", error);
    },
  });
}
