import { UserSubmittedCommentSchema } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractCommentSchema(obj: any): UserSubmittedCommentSchema {
  // TODO
  // make this configurable and add comment type for data provided by user in blogTypes.ts

  let userComment: UserSubmittedCommentSchema = {
    _id: obj._id,
    blogId: obj.blogId,
    body: obj.body,
    hasMarkdown: obj.hasMarkdown,
    inReplyToComment: obj.inReplyToComment,
    inReplyToUser: obj.inReplyToUser,
  };

  return userComment;
}
