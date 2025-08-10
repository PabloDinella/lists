import { useQuery } from '@tanstack/react-query';
import { viewTagTypes } from '@/method/manager/productivityManager/viewTagTypes';

export function useTagTypes(userId?: string) {
  return useQuery({
    queryKey: ['tagTypes', userId],
    queryFn: () => viewTagTypes(userId!),
    enabled: !!userId,
  });
}
