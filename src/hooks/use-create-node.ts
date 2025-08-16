import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNodeManager } from "@/method/manager/productivityManager/createNode";
import type { Json } from "@/database.types";

type CreateNodeParams = {
  name: string;
  content?: string;
  parent_node?: number;
  user_id: string;
  order?: number;
  metadata?: Json;
};

export function useCreateNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateNodeParams) => createNodeManager(params),
    onSuccess: (_, variables) => {
      // Invalidate nodes queries for this user
      queryClient.invalidateQueries({ 
        queryKey: ["nodes", variables.user_id] 
      });
      // If this is a child node, invalidate the parent's children
      if (variables.parent_node) {
        queryClient.invalidateQueries({ 
          queryKey: ["nodes", variables.user_id, variables.parent_node] 
        });
      }
    },
    onError: (error) => {
      console.error("Failed to create node:", error);
    },
  });
}
