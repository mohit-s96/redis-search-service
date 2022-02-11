// import { client } from "..";

import { client } from "../initializers/01-redis";
import { CommentSchema, PatchComment } from "../types";

export async function getFromCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  force = false,
  expiry: number = 3600 * 24 * 5
): Promise<T> {
  const cached = await client.sMembers(key);

  let parsedcache: T;

  if (!cached || force) {
    parsedcache = await fetcher();
    if ((parsedcache as any).length) {
      await client.sAdd(key, parsedcache as unknown as string[]);
      await client.expire(key, expiry);
    }
  } else {
    parsedcache = cached as any as T;
  }

  return parsedcache;
}

export async function deleteFromCache(
  key: string,
  commentId: string
): Promise<number> {
  const comments = await client.sMembers(key);
  let deleted = "";
  const commentsFiltered = comments
    .map((comment) => {
      const parsed = JSON.parse(comment) as CommentSchema;
      if (parsed._id === commentId) {
        deleted = comment;
      } else {
        return comment;
      }
    })
    .filter((x) => x);
  // passing empty array to sadd throws "ERR wrong number of argumnets for 'sadd' command error"
  if (commentsFiltered.length) await client.sAdd(key, commentsFiltered);
  const code = await client.sRem(key, deleted);
  return code;
}

export async function setCache(
  key: string,
  data: any,
  expiry: number = 3600 * 24 * 5
): Promise<void> {
  await client.sAdd(key, JSON.stringify(data));

  await client.expire(key, expiry);
}

export async function updateCache(
  key: string,
  id: string,
  data: PatchComment
): Promise<void> {
  const oldComments = await client.sMembers(key);
  let deleted = "";
  const newComments = oldComments.map((comment) => {
    let parsed = JSON.parse(comment) as CommentSchema;
    if (parsed._id === id) {
      deleted = comment;
      parsed.body = data.body;
      parsed.hadIllegalHtml = data.hadIllegalHtml;
      (parsed.hasMarkdown = data.hasMarkdown),
        (parsed.lastUpdated = data.lastUpdated),
        (parsed.html = data.html);
      return JSON.stringify(parsed);
    } else {
      return comment;
    }
  });
  if (newComments.length) {
    await client.sAdd(key, newComments);
  }
  await client.sRem(key, deleted);
}

export async function verifyIfUserHasCommentedOnABlog(
  userid: number,
  blogId: string
) {
  let key = blogId;
  if (blogId.length < 23) {
    key = await client.get(blogId);
  }
  const data = await client.sMembers(key);
  const hasCommented = data.some((comment) => {
    if (comment.length < 10) {
      return false;
    } else {
      const comnt = JSON.parse(comment) as CommentSchema;
      if (comnt.authorGhId === userid) return true;
      return false;
    }
  });

  return hasCommented;
}

export async function verifyIfCommentOnABlogExists(
  commentid: string,
  blogId: string
) {
  let key = blogId;
  if (blogId.length < 23) {
    key = await client.get(blogId);
  }
  const data = await client.sMembers(key);
  const commentPresent = data.some((comment) => {
    if (comment.length < 15) {
      return false;
    } else {
      const comnt = JSON.parse(comment) as CommentSchema;
      if (comnt._id === commentid && !comnt.isDeleted && comnt.isVisible)
        return true;
      return false;
    }
  });

  return commentPresent;
}
