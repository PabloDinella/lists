import { listsAccess } from "@/method/access/listsAccess";
import { List } from "./viewLists";

type CreateListParams = {
  name: string;
};

export async function createList(params: CreateListParams): Promise<List> {
  const result = await listsAccess.createList(params);
  if ('error' in result) throw result.error;
  return result.result;
}
