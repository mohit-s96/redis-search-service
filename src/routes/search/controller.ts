import { Request, Response } from "express";
import { RedisClientType } from "redis";
import { fetchSearchQuery } from "../../db/db";

export function transformRedisKey(key: string) {
  return key.split(" ").join("-");
}

export default async (req: Request, res: Response) => {
  try {
    const key = req.query.query as string;

    const client: RedisClientType = req.app.locals.client;

    const cached = await client.get(transformRedisKey(key));

    if (cached === null) {
      const response = await fetchSearchQuery(key);
      await client.setEx(
        transformRedisKey(key),
        345600, // 4 days
        JSON.stringify(response)
      );
      res.status(200).json(response);
    } else {
      res.status(200).json(JSON.parse(cached));
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
