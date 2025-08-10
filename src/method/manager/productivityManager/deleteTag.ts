import { tagsAccess } from "@/method/access/tagsAccess";

export async function deleteTag(tagId: number, userId: string): Promise<void> {
  const result = await tagsAccess.deleteTag(tagId, userId);
  if (!result.success) throw result.error;
}
