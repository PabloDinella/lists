import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTagType } from '@/method/manager/productivityManager/deleteTagType';

export function useDeleteTagType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tagTypeId, userId }: { tagTypeId: number; userId: string }) => 
      deleteTagType(tagTypeId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagTypes'] });
    },
  });
}
