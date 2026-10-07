import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { viewNodesManager } from "@/method/manager/productivityManager/viewNodes";
import { getOfflineStore } from "@/lib/offline";

type UseNodesParams = {
  userId?: string;
  parentNode?: number | null;
};

export function useNodes(params: UseNodesParams) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!params.userId) return;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    getOfflineStore(params.userId).then((store) => {
      if (disposed) return;
      unsubscribe = store.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ["nodes", params.userId] });
      });
    }).catch(console.error);
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [params.userId, queryClient]);

  return useQuery({
    queryKey: ["nodes", params.userId, String(params.parentNode)],
    queryFn: async () => {
      if (!params.userId) {
        return [];
      }
      const response = await viewNodesManager({
        userId: params.userId,
        parentNodeId: params.parentNode,
      });
      if ("error" in response) {
        throw response.error instanceof Error
          ? response.error
          : new Error("Failed to load nodes");
      }
      return response.result;
    },
    enabled: !!params.userId,
  });
}
