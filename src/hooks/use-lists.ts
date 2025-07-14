import { useQuery } from '@tanstack/react-query';
import { viewLists } from '@/method/manager/productivityManager/viewLists';

export function useLists(userId?: string) {
  return useQuery({
    queryKey: ['lists', userId],
    queryFn: () => viewLists(userId),
    enabled: !!userId,
  });
} 