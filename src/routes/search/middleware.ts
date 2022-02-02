import { NextFunction, Request, Response } from "express";
import { createRateLimiter } from "../../utils/create-rate-limiter";

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  createRateLimiter(req.app.locals.client, 50, 120000)(req, res, next);
}
