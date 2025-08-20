import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addUpdateNodeManager } from "@/method/manager/productivityManager/addUpdateNode";
import { Metadata } from "@/method/access/nodeAccess/models";

type AddUpdateNodeParams = {
  nodeId?: number; // If provided, updates existing node; if not, creates new node
  name: string;
  content?: string;
  parentNode?: number | null;
  userId: string;
  metadata?: Metadata;
  relatedNodeIds?: number[];
  relationType?: string;
};

export function useAddUpdateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddUpdateNodeParams) => addUpdateNodeManager(params),
    onSuccess: (_, variables) => {
      // Invalidate nodes queries for this user
      queryClient.invalidateQueries({
        queryKey: ["nodes", variables.userId],
      });
      // If this is a child node, invalidate the parent's children
      if (variables.parentNode) {
        queryClient.invalidateQueries({
          queryKey: ["nodes", variables.userId, variables.parentNode],
        });
      }
    },
    onError: (error) => {
      console.error("Failed to add/update node:", error);
    },
  });
}
