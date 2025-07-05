import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createList } from '@/method/manager/productivityManager/createList';

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createList,
    onSuccess: () => {
      // Invalidate and refetch lists query
      queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
} 