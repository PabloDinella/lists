import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createList } from '@/method/manager/productivityManager/createList';

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, userId }: { name: string; userId: string }) => createList({ name, userId }),
    onSuccess: (_, { userId }) => {
      // Invalidate and refetch lists query for this user
      queryClient.invalidateQueries({ queryKey: ['lists', userId] });
    },
  });
} 