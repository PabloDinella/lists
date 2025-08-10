import { tagsAccess } from "@/method/access/tagsAccess";

export type Tag = {
  id: number;
  name: string;
  createdAt: Date;
  user_id: string;
};

export async function viewTags(userId: string): Promise<Tag[]> {
  const result = await tagsAccess.viewTags(userId);
  if ('error' in result) throw result.error;
  return result.result;
}
