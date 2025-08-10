import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTag } from "@/method/manager/productivityManager/updateTag";

type UpdateTagParams = {
  tagId: number;
  name: string;
  userId: string;
};

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateTagParams) => updateTag(params),
    onSuccess: (_, variables) => {
      // Invalidate and refetch tags for this user
      queryClient.invalidateQueries({ 
        queryKey: ["tags", variables.userId] 
      });
    },
    onError: (error) => {
      console.error("Failed to update tag:", error);
    },
  });
}
