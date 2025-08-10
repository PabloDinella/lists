import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTag } from '@/method/manager/productivityManager/createTag';

export function useCreateTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
