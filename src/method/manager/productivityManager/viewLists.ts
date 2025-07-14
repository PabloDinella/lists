import { listsAccess } from "@/method/access/listsAccess";

export type List = {
  id: number;
  name: string;
  createdAt: Date;
  user_id: string;
};

export async function viewLists(userId: string): Promise<List[]> {
  const result = await listsAccess.viewLists(userId);
  if ('error' in result) throw result.error;
  return result.result;
}
