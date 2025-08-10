import { tagsAccess } from "@/method/access/tagsAccess";
import { Tag } from "./viewTags";

type CreateTagParams = {
  name: string;
  userId: string;
};

export async function createTag(params: CreateTagParams): Promise<Tag> {
  const result = await tagsAccess.createTag(params);
  if ('error' in result) throw result.error;
  return result.result;
}
