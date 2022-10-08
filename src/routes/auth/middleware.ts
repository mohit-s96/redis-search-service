import Cookies from "cookies";
import { NextFunction, Request, Response } from "express";
import { createRateLimiter } from "../../utils/create-rate-limiter";
import fetch from "node-fetch";
import { GithubUser } from "../../types";

const config = {
  max: 5,
  windowMs: 5 * 60 * 1000,
};

export function rateLimiter() {
  const closure = { ...config };
  return (req: Request, res: Response, next: NextFunction) => {
    createRateLimiter(req.app.locals.client, closure.max, closure.windowMs)(
      req,
      res,
      next
    );
  };
}

rateLimiter.config = function (max: number, windowMs: number) {
  config.max = max;
  config.windowMs = windowMs;
  return rateLimiter;
};

export async function verifyGithubTokenOrGetNewTokenFromRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const cookies = req.cookies as Cookies;

    const token = cookies.get("token");

    const userdata = await fetch(`https://api.github.com/user`, {
      headers: {
        Accept: `application/json`,
        Authorization: `token ${token}`,
      },
    });

    const user = (await userdata.json()) as GithubUser & { message: string };

    if (user.message === "Bad credentials") {
      throw new Error("unauthorized");
    } else {
      req.auth = {
        username: user.login,
        avatar: user.avatar_url,
        id: user.id,
      };
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "something went wrong" });
  }
}
