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
    const rfrt = cookies.get("rfrt");

    if (!token || !rfrt) {
      throw "unauthorized";
    }

    const userdata = await fetch(`https://api.github.com/user`, {
      headers: {
        Accept: `application/json`,
        Authorization: `token ${token}`,
      },
    });

    const user = (await userdata.json()) as GithubUser & { message: string };

    if (user.message === "Bad credentials") {
      const rfrtres = await fetch(
        `https://github.com/login/oauth/access_token?client_id=Iv1.b7f0e9e6521133a2&client_secret=${process.env.GH_CLIENT_SECRET}&refresh_token=${rfrt}&grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const newtoken = (await rfrtres.json()) as any;

      const retry = await fetch(`https://api.github.com/user`, {
        headers: {
          Authorization: `token ${newtoken.access_token}`,
        },
      });

      const data = (await retry.json()) as GithubUser;

      req.auth = {
        username: data.login,
        avatar: data.avatar_url,
        id: data.id,
      };

      (res as any).cookies.set("token", newtoken.access_token, {
        httpOnly: true,
      });

      (res as any).cookies.set("rfrt", newtoken.refresh_token, {
        httpOnly: true,
        maxAge: newtoken.refresh_token_expires_in * 1000,
      });

      //   res.status(200).json({ message: data });
      next();
    } else {
      req.auth = {
        username: user.login,
        avatar: user.avatar_url,
        id: user.id,
      };
      //   res.status(200).json({ message: user });
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "something went wrong" });
  }
}
