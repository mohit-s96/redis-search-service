import Cookies from "cookies";
import { Request, Response, NextFunction } from "express";
import { RedisClientType } from "redis";
import { CommentSchema } from "../../types";

export async function verifyValidBlog(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { blogId } =
    req.method === "PATCH" || req.method === "patch" ? req.body : req.params;

  if (!blogId) {
    res.status(400).json({ error: "invalid blogId" });
    return;
  }

  const client = req.app.locals.client as RedisClientType;
  const blogHash = await client.get(blogId);

  if (!blogHash) {
    res.status(400).json({ error: "invalid blogId" });
    return;
  }

  const cached = await client.exists(blogHash);

  // redis returns 0 for non-existent keys
  if (
    cached === 0 &&
    req.method !== "POST" &&
    req.method !== "PATCH" &&
    !req.app.locals.isAdmin
  ) {
    res.status(200).json({ message: [] });
    return;
  }

  // set actual mongo id for blogId(instead of the uri slug) for use in further handlers
  //also add the uri slug for any future use
  if (req.method === "patch" || req.method === "PATCH") {
    req.body.blogId = blogHash;
  } else {
    req.params.blogId = blogHash;
    req.params.slug = blogId;
  }

  next();
}

export async function verifyValidComment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let { blogId, _id, commentId } =
    req.method === "PATCH" || req.method === "patch" ? req.body : req.params;

  if (!commentId) {
    commentId = _id;
  }
  if (!commentId) {
    res.status(400).json({ error: "invalid comment" });
    return;
  }

  const client = req.app.locals.client as RedisClientType;

  const cached = await client.sMembers(blogId);

  //if we reach here we know that atleast the blogid is valid (because of verifyValidBlog middleware) and present in the cache, thus we don't check for null

  try {
    const data = cached.map((cache) => JSON.parse(cache) as CommentSchema);

    const validComment = data.some(
      (comment) =>
        comment._id === commentId &&
        comment.isVisible &&
        !comment.isDeleted &&
        comment.authorGhId === req.auth.id
    );

    if (!validComment) {
      res.status(400).json({ error: "invalid request" });
      return;
    }

    next();
  } catch (error) {
    console.log(error);

    res.status(400).json({ error: "invalid request" });
    return;
  }
}

export function isAdminSigned(req: Request, res: Response, next: NextFunction) {
  const cookies = req.cookies as Cookies;

  const token = cookies.get("token");

  req.app.locals.isAdmin = true;

  if (!token || !(token === process.env.ADMIN_AUTH_KEY)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  next();
}
