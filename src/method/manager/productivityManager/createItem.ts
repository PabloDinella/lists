import { itemsAccess } from "@/method/access/itemsAccess";
import { listsAccess } from "@/method/access/listsAccess";

type CreateItemParams = {
  title: string;
  userId: string;
};

export function createItem(params: CreateItemParams) {
  itemsAccess.createItem(params);
}
