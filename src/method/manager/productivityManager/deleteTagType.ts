import { tagTypesAccess } from "@/method/access/tagTypesAccess";

export async function deleteTagType(tagTypeId: number, userId: string): Promise<void> {
  const result = await tagTypesAccess.deleteTagType(tagTypeId, userId);
  if (!result.success) throw result.error;
}
