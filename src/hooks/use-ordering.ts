import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNodeManager } from "@/method/manager/productivityManager/updateNode";

export function useUpsertOrdering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { user_id: string; parent_node_id: number; children_order: number[] }) => {
      // Update the parent node's metadata to include the children ordering
      return updateNodeManager({
        node_id: p.parent_node_id,
        user_id: p.user_id,
        metadata: {
          children_order: p.children_order,
        },
      });
    },
    onSuccess: (_data, vars) => {
      // Invalidate nodes queries to refresh the data
      qc.invalidateQueries({ queryKey: ["nodes", vars.user_id] });
    },
  });
}
