import Cookies from "cookies";
import { Request, Response, NextFunction } from "express";
import { RedisClientType } from "redis";
import { CommentSchema } from "../../types";

export async function verifyValidBlog(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const blogId =
    req.method === "PATCH" || req.method === "patch"
      ? req.body
      : req.params.blogid;

  if (!blogId) {
    res.status(400).json({ error: "invalid blogId" });
    return;
  }

  const client = req.app.locals.client as RedisClientType;

  const cached = await client.sMembers(blogId);

  if (!cached || cached.length === 0) {
    res.status(400).json({ error: "invalid blogId" });
    return;
  }

  next();
}

export async function verifyValidComment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { blogid: blogId, commentid } = req.params;

  if (!commentid) {
    res.status(400).json({ error: "invalid comment" });
    return;
  }

  const client = req.app.locals.client as RedisClientType;

  const cached = await client.sMembers(blogId);

  //if we reach here we know that atleast the blogid is valid (because of verifyValidBlog middleware) and present in the cache, thus we don't check for null

  const data = cached.map((cache) => JSON.parse(cache) as CommentSchema);

  const validComment = data.some(
    (comment) =>
      comment._id === commentid &&
      comment.isVisible &&
      !comment.isDeleted &&
      comment.authorGhId === req.auth.id
  );

  if (!validComment) {
    res.status(400).json({ error: "invalid request" });
    return;
  }

  next();
}

export function isAdminSigned(req: Request, res: Response, next: NextFunction) {
  const cookies = req.cookies as Cookies;

  const token = cookies.get("token");

  if (!token || !(token === process.env.ADMIN_AUTH_KEY)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  next();
}
