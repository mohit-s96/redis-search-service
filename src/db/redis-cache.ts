// import { client } from "..";

import { client } from "../initializers/01-redis";
import { CommentSchema, PatchComment } from "../types";

export async function getFromCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  force: boolean = false,
  expiry: number = 3600 * 24 * 5
): Promise<T> {
  const cached = await client.sMembers(key);

  let parsedcache: T;

  if (cached.length === 0 || force) {
    parsedcache = await fetcher();

    await client.sAdd(key, parsedcache as unknown as string[]);
    await client.expire(key, expiry);
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
  const commentsFiltered = comments
    .map((comment) => JSON.parse(comment) as CommentSchema)
    .filter((comment) => comment._id !== commentId)
    .map((x) => JSON.stringify(x));

  return client.sAdd(key, commentsFiltered);
}

export async function setCache<T>(
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

  const newComments = oldComments.map((comment) => {
    let parsed = JSON.parse(comment) as CommentSchema;
    if (parsed._id === id) {
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

  await client.sAdd(key, newComments);
}
