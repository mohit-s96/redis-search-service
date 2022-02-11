import {
  Auth,
  CommentSchema,
  PatchComment,
  UserSubmittedCommentSchema,
} from "../types";
import DOMPurify from "isomorphic-dompurify";
import * as marked from "marked";
import {
  verifyIfCommentOnABlogExists,
  verifyIfUserHasCommentedOnABlog,
} from "../db/redis-cache";

export async function extractCommentSchema(
  obj: any
): Promise<UserSubmittedCommentSchema> {
  // TODO
  // make this configurable and add comment type for data provided by user in blogTypes.ts
  if (obj._id && (typeof obj.blogId !== "string" || obj._id.length > 40)) {
    throw "comment invalid";
  }

  if (!obj.blogId || typeof obj.blogId !== "string" || obj.blogId.length > 40) {
    throw "blogId invalid";
  }
  if (!obj.body || typeof obj.body !== "string" || obj.body.length > 500) {
    throw "body invalid";
  }
  if (obj.hasMarkdown === undefined || typeof obj.hasMarkdown !== "boolean") {
    throw "hasMarkdown invalid";
  }
  if (
    !obj.inReplyToComment ||
    typeof obj.inReplyToComment !== "string" ||
    obj.inReplyToComment.length > 40 ||
    (obj.inReplyToComment !== "default" &&
      !(await verifyIfCommentOnABlogExists(obj.inReplyToComment, obj.blogId)))
  ) {
    throw "inReplyToComment invalid";
  }
  if (
    !obj.inReplyToUser ||
    typeof obj.inReplyToUser !== "number" ||
    obj.inReplyToUser.length > 40 ||
    (obj.inReplyToUser !== "default" &&
      !(await verifyIfUserHasCommentedOnABlog(obj.inReplyToUser, obj.blogId)))
  ) {
    throw "inReplyToUser invalid";
  }

  if (
    obj.inReplyToUsername === undefined ||
    typeof obj.inReplyToUsername !== "string" ||
    obj.inReplyToUsername.length > 40
  ) {
    throw "inReplyToUsername invalid";
  }

  let userComment: UserSubmittedCommentSchema = {
    _id: obj._id,
    blogId: obj.blogId,
    body: obj.body,
    hasMarkdown: obj.hasMarkdown,
    inReplyToComment: obj.inReplyToComment,
    inReplyToUser: obj.inReplyToUser,
    inReplyToUsername: obj.inReplyToUsername,
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
    inReplyToUsername:
      schema.inReplyToUsername === "default" ? "" : schema.inReplyToUsername,
    authorAvatar: user.avatar,
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
