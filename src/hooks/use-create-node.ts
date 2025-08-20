import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNodeManager } from "@/method/manager/productivityManager/createNode";
import { Metadata } from "@/method/access/nodeAccess/models";

type CreateNodeParams = {
  name: string;
  content?: string;
  parentNode?: number;
  userId: string;
  metadata?: Metadata;
  relatedNodeIds?: number[];
  relationType?: string;
};

export function useCreateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateNodeParams) => createNodeManager(params),
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
      console.error("Failed to create node:", error);
    },
  });
}
