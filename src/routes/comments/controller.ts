import { Request, Response } from "express";
import { RedisClientType } from "redis";

export async function getComments(req: Request, res: Response) {
  const blogId = req.params.blogid;
  console.log("ho");
  res.status(200).json({ message: "success" });
}

export async function deleteCommentCacheForBlog(req: Request, res: Response) {
  const client = req.app.locals.client as RedisClientType;

  const blogId = req.params.blogid;

  await client.del(blogId);

  res.status(200).json({ message: "success" });
}
