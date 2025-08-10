import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTagType } from '@/method/manager/productivityManager/createTagType';

export function useCreateTagType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTagType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagTypes'] });
    },
  });
}
