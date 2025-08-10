import { itemsAccess } from "@/method/access/itemsAccess";

export type Item = {
  id: number;
  title: string;
  createdAt: Date;
  listId: number;
};

export async function viewItems(listId: number): Promise<Item[]> {
  const result = await itemsAccess.viewItems(listId);
  if ('error' in result) throw result.error;
  return result.result;
}
