import { rateLimit } from "express-rate-limit";
import { RedisClientType } from "redis";
import RedisStore from "../rate-limit-redis";

export function createRateLimiter(
  client: RedisClientType,
  max: number,
  windowMs: number
) {
  return rateLimit({
    // limit each IP to max requests per windowMs
    max,
    windowMs, // time in milli seconds
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new RedisStore({
      sendCommand: (...args: string[]) => client.sendCommand(args),
    }),
    //  delayMs: 0, // disable delaying - full speed until the max limit is reached
  });
}
