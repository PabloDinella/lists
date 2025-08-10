import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTag } from '@/method/manager/productivityManager/deleteTag';

export function useDeleteTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tagId, userId }: { tagId: number; userId: string }) => 
      deleteTag(tagId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
