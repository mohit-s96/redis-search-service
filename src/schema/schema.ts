import {
  Auth,
  CommentSchema,
  PatchComment,
  UserSubmittedCommentSchema,
} from "../types";
import DOMPurify from "dompurify";
import * as marked from "marked";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractCommentSchema(obj: any): UserSubmittedCommentSchema {
  // TODO
  // make this configurable and add comment type for data provided by user in blogTypes.ts
  if (!obj._id || typeof obj.blogId !== "string" || obj._id.length > 40) {
    throw "comment invalid";
  }
  if (!obj.blogId || typeof obj.blogId !== "string" || obj.blogId.length > 40) {
    throw "blogId invalid";
  }
  if (!obj.body || typeof obj.body !== "string" || obj.body.length > 500) {
    throw "body invalid";
  }
  if (!obj.hasMarkdown || typeof obj.hasMarkdown !== "boolean") {
    throw "hasMarkdown invalid";
  }
  if (
    !obj.inReplyToComment ||
    typeof obj.inReplyToComment !== "string" ||
    obj.inReplyToComment.length > 40
  ) {
    throw "inReplyToComment invalid";
  }
  if (
    !obj.inReplyToUser ||
    typeof obj.inReplyToComment !== "string" ||
    obj.inReplyToComment.length > 40
  ) {
    throw "inReplyToUser invalid";
  }

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

async function convertMarkDownToHtml(md: string): Promise<string> {
  return new Promise((res, rej) => {
    marked.marked.parse(md, (err, html) => {
      if (err) {
        rej(err);
      } else {
        res(html);
      }
    });
  });
}

export async function createCommentObject(
  schema: UserSubmittedCommentSchema,
  user: Auth
): Promise<CommentSchema> {
  const html = await convertMarkDownToHtml(schema.body);
  let clean = DOMPurify.sanitize(html, {
    FORBID_TAGS: ["style", "img"],
    FORBID_ATTR: ["style", "ping"],
  });

  const hadIllegalHtml = html === clean ? false : true;

  let comment: CommentSchema = {
    blogId: schema.blogId,
    createdAt: Date.now(),
    author: user.username,
    authorGhId: user.id,
    inReplyToComment:
      schema.inReplyToComment === "default" ? "" : schema.inReplyToComment,
    inReplyToUser:
      schema.inReplyToUser === "default" ? "" : schema.inReplyToUser,
    isAdmin: user.username === "msx47" && user.id === 17087942,
    deletedAt: 0,
    hasMarkdown: schema.hasMarkdown,
    body: schema.body,
    lastUpdated: 0,
    isDeleted: false,
    isVisible: true,
    hadIllegalHtml,
    html: clean,
  };

  return comment;
}

export async function createCommentPatchObject(
  schema: UserSubmittedCommentSchema
): Promise<PatchComment> {
  const html = await convertMarkDownToHtml(schema.body);
  let clean = DOMPurify.sanitize(html, {
    FORBID_TAGS: ["style", "img"],
    FORBID_ATTR: ["style", "ping"],
  });

  const hadIllegalHtml = html === clean ? false : true;

  let comment: PatchComment = {
    hasMarkdown: schema.hasMarkdown,
    body: schema.body,
    lastUpdated: Date.now(),
    hadIllegalHtml,
    html: clean,
  };

  return comment;
}
