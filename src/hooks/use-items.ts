import { useQuery } from '@tanstack/react-query';
import { viewItems } from '@/method/manager/productivityManager/viewItems';

export function useItems(listId: number | null) {
  return useQuery({
    queryKey: ['items', listId],
    queryFn: () => viewItems(listId!),
    enabled: !!listId,
  });
}
