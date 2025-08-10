import { useQuery } from '@tanstack/react-query';
import { viewTags } from '@/method/manager/productivityManager/viewTags';

export function useTags(userId?: string) {
  return useQuery({
    queryKey: ['tags', userId],
    queryFn: () => viewTags(userId!),
    enabled: !!userId,
  });
}
