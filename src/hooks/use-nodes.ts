import { useQuery } from "@tanstack/react-query";
import { viewNodesManager } from "@/method/manager/productivityManager/viewNodes";

type UseNodesParams = {
  user_id?: string;
  parent_node?: number | null;
};

export function useNodes(params: UseNodesParams) {
  return useQuery({
    queryKey: ["nodes", params.user_id, String(params.parent_node)],
    queryFn: async () => {
      if (!params.user_id) {
        return { result: [] };
      }
      return viewNodesManager({
        user_id: params.user_id,
        parent_node: params.parent_node,
      });
    },
    enabled: !!params.user_id,
    select: (data) => {
      if ('result' in data) {
        return data.result;
      }
      return [];
    },
  });
}
