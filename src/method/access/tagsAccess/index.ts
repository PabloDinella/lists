import { createTag } from "./createTag";
import { viewTags } from "./viewTags";
import { deleteTag } from "./deleteTag";
import { updateTag } from "./updateTag";

export { createTag, viewTags, deleteTag, updateTag };

export const tagsAccess = {
  createTag,
  viewTags,
  deleteTag,
  updateTag,
};
