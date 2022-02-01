import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "../../rate-limit-redis";

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  rateLimit({
    max: 100, // limit each IP to 100 requests per windowMs
    windowMs: 2 * 60 * 100, // 2 minutes
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new RedisStore({
      sendCommand: (...args: string[]) =>
        req.app.locals.client.sendCommand(args),
    }),
    //  delayMs: 0, // disable delaying - full speed until the max limit is reached
  })(req, res, next);
}
