/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Auth,
  CommentSchema,
  PatchComment,
  UserSubmittedCommentSchema,
} from "../types";
import DOMPurify from "isomorphic-dompurify";
import * as marked from "marked";

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
  schema: Partial<UserSubmittedCommentSchema>,
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
    //@ts-ignore
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
    inReplyToUsername:
      schema.inReplyToUsername === "default" ? "" : schema.inReplyToUsername,
    authorAvatar: user.avatar,
  };

  return comment;
}

export async function createCommentPatchObject(
  schema: Partial<UserSubmittedCommentSchema>
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
