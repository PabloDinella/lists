import { listsAccess } from "@/method/access/listsAccess";

export type List = {
  id: number;
  name: string;
  createdAt: Date;
};

export async function viewLists(): Promise<List[]> {
  const result = await listsAccess.viewLists();
  if ('error' in result) throw result.error;
  return result.result;
}
