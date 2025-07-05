import { useQuery } from '@tanstack/react-query';
import { viewLists } from '@/method/manager/productivityManager/viewLists';

export function useLists() {
  return useQuery({
    queryKey: ['lists'],
    queryFn: viewLists,
  });
} 