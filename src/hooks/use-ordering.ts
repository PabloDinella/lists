import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { viewOrderingManager } from "@/method/manager/productivityManager/viewOrdering";
import { upsertOrderingManager } from "@/method/manager/productivityManager/upsertOrdering";

export function useOrdering(params: { user_id?: string; root_node?: number | null }) {
  return useQuery({
    queryKey: ["ordering", params.user_id, params.root_node ?? null],
    queryFn: async () => {
      if (!params.user_id) return { result: null } as const;
      return viewOrderingManager({ user_id: params.user_id, root_node: params.root_node });
    },
    enabled: !!params.user_id,
    select: (data) => ("result" in data ? data.result : null),
  });
}

export function useUpsertOrdering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { user_id: string; root_node?: number | null; order: number[] }) => upsertOrderingManager(p),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["ordering", vars.user_id, vars.root_node ?? null] });
    },
  });
}
