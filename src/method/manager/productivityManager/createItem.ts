import { itemsAccess } from "@/method/access/itemsAccess";

type CreateItemParams = {
  title: string;
  listId: number;
  userId: string;
};

export type Item = {
  id: number;
  title: string;
  createdAt: Date;
  listId: number;
};

export async function createItem(params: CreateItemParams): Promise<Item> {
  const result = await itemsAccess.createItem(params);
  if (!result) {
    throw new Error('Failed to create item');
  }
  return result;
}
