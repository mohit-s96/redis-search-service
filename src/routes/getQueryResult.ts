import { Response, Request } from "express";
import { client } from "..";
import { fetchSearchQuery } from "../db";
export function transformRedisKey(key: string) {
  return key.split(" ").join("-");
}

async function handleSearchQuery(req: Request, res: Response) {
  //   await client.connect();
  try {
    const key = req.query.query as string;

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
}

export default handleSearchQuery;
