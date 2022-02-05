import { Request, Response } from "express";
import { RedisClientType } from "redis";
import {
  deleteComment,
  fetchComments,
  setComment,
  updateComment,
} from "../../db/db";
import {
  deleteFromCache,
  getFromCache,
  setCache,
  updateCache,
} from "../../db/redis-cache";
import {
  createCommentObject,
  createCommentPatchObject,
  extractCommentSchema,
} from "../../schema/schema";
import { CommentSchema, UserSubmittedCommentSchema } from "../../types";

function createBlogCommentFetcher(blogId: string) {
  return async () => {
    const comments = await fetchComments(blogId);

    return comments
      .filter((comment) => comment.isVisible && !comment.isDeleted)
      .map((comment) => {
        comment._id = comment._id.toString();
        return JSON.stringify(comment);
      });
  };
}

export async function getComments(req: Request, res: Response) {
  const blogId = req.params.blogid;

  const fetcher = createBlogCommentFetcher(blogId);

  try {
    const data = await getFromCache(blogId, fetcher, false, 3600 * 24 * 180);

    res.status(200).json({ message: data });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "something went wrong" });
  }
}

export async function postComment(req: Request, res: Response) {
  let schema: UserSubmittedCommentSchema;

  try {
    schema = extractCommentSchema(req.body);
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "you posted cringe: " + error.message });
    return;
  }

  try {
    const fullCommentObject = await createCommentObject(schema, req.auth);
    const postedComment = (await setComment(
      fullCommentObject
    )) as any as CommentSchema;
    postedComment._id = postedComment._id.toString();
    await setCache(postedComment.blogId as string, postedComment);
    res.status(201).json({ message: "success" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "epic failure" });
  }
}

export async function updateUserComment(req: Request, res: Response) {
  let schema: UserSubmittedCommentSchema;
  try {
    schema = extractCommentSchema(req.body);
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "you posted cringe: " + error.message });
  }

  try {
    const fullPatchObject = await createCommentPatchObject(schema);
    await updateComment(schema._id as any, fullPatchObject);
    await updateCache(
      schema.blogId as string,
      schema._id as string,
      fullPatchObject
    );
    res.status(201).json({ message: "success" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "epic failure" });
  }
}

export async function deleteCommentCacheForBlog(req: Request, res: Response) {
  const client = req.app.locals.client as RedisClientType;

  const blogId = req.params.blogid;

  await client.del(blogId);

  res.status(200).json({ message: "success" });
}

export async function deleteCommentFromDb(req: Request, res: Response) {
  const { blogid, commentid } = req.params;

  // previous mw's ensure that commentid is valid
  try {
    await deleteComment(commentid);
    await deleteFromCache(blogid, commentid);
    res.status(201).json({ message: "success" });
  } catch (error) {
    res.json(500).json({ error: "something went wrong on the server" });
  }
}
