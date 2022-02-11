import Cookies from "cookies";
import { Request, Response } from "express";
import fetch from "node-fetch";
import { Auth, GithubUser } from "../../types";

export async function githubOauthFlow(req: Request, res: Response) {
  try {
    const { code } = req.body;

    if (!code) {
      throw "invalid request";
    }

    const data = await fetch(
      `https://github.com/login/oauth/access_token?client_id=${process.env.GH_CLIENT_ID}&client_secret=${process.env.GH_CLIENT_SECRET}&code=${code}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const user = (await data.json()) as any;

    if (user.error) {
      throw "invalid code";
    }

    const userdata = await fetch(`https://api.github.com/user`, {
      headers: {
        Accept: `application/json`,
        Authorization: `token ${user.access_token}`,
      },
    });

    const jsondata = (await userdata.json()) as GithubUser;

    const auth: Auth = {
      avatar: jsondata.avatar_url,
      id: jsondata.id,
      username: jsondata.login,
    };

    (res as any).cookies.set("token", user.access_token, {
      httpOnly: true,
    });

    ((res as any).cookies as Cookies).set("rfrt", user.refresh_token, {
      httpOnly: true,
      maxAge: user.refresh_token_expires_in * 1000,
    });

    res.status(200).json({ message: auth });
  } catch (err) {
    console.log(err);

    res.status(400).json({ error: "something went wrong" });
  }
}

export async function userVerified(req: Request, res: Response) {
  res.status(200).json({ message: req.auth });
}
