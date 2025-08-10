import { updateTag as updateTagAccess } from "../../access/tagsAccess";

type UpdateTagParams = {
  tagId: number;
  name: string;
  userId: string;
};

export async function updateTag(params: UpdateTagParams) {
  return await updateTagAccess(params);
}
