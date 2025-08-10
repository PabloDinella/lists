import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem } from '@/method/manager/productivityManager/createItem';

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, listId, userId }: { title: string; listId: number; userId: string }) => createItem({ title, listId, userId }),
    onSuccess: (_, { listId }) => {
      // Invalidate and refetch items query for this list
      queryClient.invalidateQueries({ queryKey: ['items', listId] });
    },
  });
}
