import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRelationship } from "@/method/access/nodeAccess/createRelationship";
import { deleteRelationships } from "@/method/access/nodeAccess/deleteRelationships";
import { unwrapResult } from "@/lib/unwrap-result";

type UpsertRelationshipsParams = {
  nodeId: number;
  relatedNodeIds: number[];
  relationType: string;
  userId: string;
};

export function useUpsertRelationships() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpsertRelationshipsParams) => {
      // First, delete existing relationships of this type for this node
      unwrapResult(await deleteRelationships({
        nodeId: params.nodeId,
        userId: params.userId,
        relationType: params.relationType,
      }));

      // Then, create new relationships
      const results = [];
      for (const relatedNodeId of params.relatedNodeIds) {
        const result = unwrapResult(await createRelationship({
          nodeId1: params.nodeId,
          nodeId2: relatedNodeId,
          relationType: params.relationType,
          userId: params.userId,
        }));
        results.push(result);
      }

      return results;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
    onError: (error) => {
      console.error("Failed to upsert relationships:", error);
    },
  });
}
