import { tagTypesAccess } from "@/method/access/tagTypesAccess";
import { TagType } from "./viewTagTypes";

type CreateTagTypeParams = {
  name: string;
  userId: string;
};

export async function createTagType(params: CreateTagTypeParams): Promise<TagType> {
  const result = await tagTypesAccess.createTagType(params);
  if ('error' in result) throw result.error;
  return result.result;
}
