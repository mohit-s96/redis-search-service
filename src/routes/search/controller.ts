import { Request, Response } from "express";
import { RedisClientType } from "redis";
import { fetchSearchQuery } from "../../db/db";

export function transformRedisKey(key: string) {
  return key.split(" ").join("-");
}

export default async (req: Request, res: Response) => {
  try {
    const key = req.query.query as string;

    if (!key || key.length > 40) {
      res.status(200).json({ message: [] });
      return;
    }

    const client: RedisClientType = req.app.locals.client;

    const cached = await client.hGet("search", transformRedisKey(key));

    if (cached) {
      res.status(200).send(cached);
      return;
    }

    const response = await fetchSearchQuery(key);
    if (response.length) {
      await client.hSet(
        "search",
        transformRedisKey(key),
        JSON.stringify(response)
      );
      await client.expire(transformRedisKey(key), 345600 /*4 days*/);
      res.status(200).json(response);
    } else {
      res.status(200).json([]);
    }
  } catch (err) {
    let message = "something went wrong";

    let code = 500;

    if (err === "limit reached") {
      message = err;
      code = 400;
    }
    if ((err as Error)?.message) {
      message = (err as Error).message;
    }

    res.status(code).json({ statusCode: code, message });
  }
};
