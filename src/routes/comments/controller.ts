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
  verifyIfCommentOnABlogExists,
  verifyIfUserHasCommentedOnABlog,
} from "../../db/redis-cache";
import {
  createCommentObject,
  createCommentPatchObject,
} from "../../schema/schema";
import { BlogSlug, UserSubmittedCommentSchema } from "../../types";
import { userSubmittedCommentSchemaSchema } from "../../validZodSchema";

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
  const blogId = req.params.blogId;

  const fetcher = createBlogCommentFetcher(blogId);

  try {
    const data = await getFromCache(blogId, fetcher, false);
    let resp = data.map((x) => JSON.parse(x));

    res.status(200).json({ message: resp });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "something went wrong" });
  }
}

export async function postComment(req: Request, res: Response) {
  let schema: Partial<UserSubmittedCommentSchema>;

  try {
    // schema = await extractCommentSchema(req.body);
    schema = userSubmittedCommentSchemaSchema.parse(req.body);
    if (schema.inReplyToComment !== "default")
      await verifyIfCommentOnABlogExists(
        schema.inReplyToComment,
        schema.blogId
      );
    if (schema.inReplyToUser !== "default")
      await verifyIfUserHasCommentedOnABlog(
        schema.inReplyToUser,
        schema.blogId
      );
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "you posted cringe: " + error });
    return;
  }

  try {
    // change blogid from slug to hash set in the verifyblog middleware
    schema.blogId = req.params.blogId;
    const fullCommentObject = await createCommentObject(schema, req.auth);
    const postedComment = await setComment(fullCommentObject);
    fullCommentObject._id = postedComment.insertedId.toString();
    await setCache(fullCommentObject.blogId as string, fullCommentObject);
    res.status(201).json({ message: fullCommentObject });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "epic failure" });
  }
}

export async function updateUserComment(req: Request, res: Response) {
  let schema: Partial<UserSubmittedCommentSchema>;
  try {
    schema = userSubmittedCommentSchemaSchema.parse(req.body);
    if (schema.inReplyToComment !== "default")
      await verifyIfCommentOnABlogExists(
        schema.inReplyToComment,
        schema.blogId
      );
    if (schema.inReplyToUser !== "default")
      await verifyIfUserHasCommentedOnABlog(
        schema.inReplyToUser,
        schema.blogId
      );
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "you posted cringe: " + error });
    return;
  }

  try {
    // change blogid from slug to hash set in the verifyblog middleware
    schema.blogId = req.body.blogId;
    const fullPatchObject = await createCommentPatchObject(schema);

    await updateComment(schema._id as any, fullPatchObject);
    await updateCache(
      schema.blogId as string,
      schema._id as string,
      fullPatchObject
    );
    res.status(201).json({ message: { ...fullPatchObject, _id: schema._id } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "epic failure" });
  }
}

export async function deleteCommentCacheForBlog(req: Request, res: Response) {
  const client = req.app.locals.client as RedisClientType;

  const blogId = req.params.blogId;
  const slug = req.params.slug;

  await client.del(blogId);

  await client.sAdd("archived", blogId);
  let searches = await client.hGetAll("search");

  if (searches) {
    const removeSearch: string[] = [];
    for (const key in searches) {
      if (Object.prototype.hasOwnProperty.call(searches, key)) {
        const element = searches[key];
        const arr = JSON.parse(element) as Partial<BlogSlug>[];
        arr.forEach((data) => {
          if (data.uri === slug) {
            removeSearch.push(key);
          }
        });
      }
    }

    const promises: Promise<any>[] = [];
    removeSearch.forEach((s) => {
      promises.push(client.hDel("search", s));
    });

    await Promise.all(promises);
  }

  res.status(200).json({ message: "success" });
}

export async function deleteCommentFromDb(req: Request, res: Response) {
  const { blogId, commentId } = req.params;

  // previous mw's ensure that commentid is valid
  try {
    await deleteComment(commentId);
    await deleteFromCache(blogId, commentId);
    res.status(201).json({ message: "success" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "something went wrong on the server" });
  }
}

export async function addUriIdHash(req: Request, res: Response) {
  const client = req.app.locals.client as RedisClientType;
  const { uri, id } = req.body;

  if (!uri || !id) {
    res.status(400).json({ error: "invalid body" });
    return;
  }

  await client.set(uri, id);

  res.status(201).json({ message: "success" });
}

export async function getCommentCount(req: Request, res: Response) {
  const { blogId } = req.params;

  const client = req.app.locals.client as RedisClientType;

  const data = await client.sMembers(blogId);

  res.status(200).json({ message: data.length });
}
