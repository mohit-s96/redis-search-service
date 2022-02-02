import Cookies from "cookies";
import { Request, Response, NextFunction } from "express";
import { RedisClientType } from "redis";

export async function verifyValidBlog(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const blogId = req.params.blogid;

  if (!blogId) {
    res.status(400).json({ error: "invalid blogId" });
    return;
  }

  const client = req.app.locals.client as RedisClientType;

  const cached = await client.get(blogId);

  if (!cached) {
    res.status(400).json({ error: "invalid blogId" });
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
