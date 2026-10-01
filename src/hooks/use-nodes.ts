import { useQuery } from "@tanstack/react-query";
import { viewNodesManager } from "@/method/manager/productivityManager/viewNodes";

type UseNodesParams = {
  userId?: string;
  parentNode?: number | null;
};

export function useNodes(params: UseNodesParams) {
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
