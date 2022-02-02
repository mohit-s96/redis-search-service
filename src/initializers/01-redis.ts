import { createClient } from "redis";
import { ExpressApp } from "..";

export const client = createClient({
  url: process.env.REDIS_ENDPOINT_URI as string,
  password: process.env.REDIS_PASSWORD,
});
client.on("error", (err) => {
  console.log(err);
});

await client.connect();

export default function (app: ExpressApp) {
  app.locals.client = client;
}
