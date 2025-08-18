import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNodeManager } from "@/method/manager/productivityManager/updateNode";

export function useUpsertOrdering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { userId: string; parentNodeId: number; childrenOrder: number[] }) => {
      // Update the parent node's metadata to include the children ordering
      return updateNodeManager({
        nodeId: p.parentNodeId,
        userId: p.userId,
        metadata: {
          childrenOrder: p.childrenOrder,
        },
      });
    },
    onSuccess: (_data, vars) => {
      // Invalidate nodes queries to refresh the data
      qc.invalidateQueries({ queryKey: ["nodes", vars.userId] });
    },
  });
}
