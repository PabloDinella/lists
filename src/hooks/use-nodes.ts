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
        return { result: [] };
      }
      return viewNodesManager({
        userId: params.userId,
        parentNodeId: params.parentNode,
      });
    },
    enabled: !!params.userId,
    select: (data) => {
      if ('result' in data) {
        return data.result;
      }
      return [];
    },
  });
}
