import { tagTypesAccess } from "@/method/access/tagTypesAccess";

export type TagType = {
  id: number;
  name: string;
  createdAt: Date;
  user_id: string;
};

export async function viewTagTypes(userId: string): Promise<TagType[]> {
  const result = await tagTypesAccess.viewTagTypes(userId);
  if ('error' in result) throw result.error;
  return result.result;
}
