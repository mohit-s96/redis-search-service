import express from "express";
import { githubOauthFlow } from "./controller";
import {
  rateLimiter,
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
} from "./middleware";

const router = express.Router();

router.post("/api/auth", rateLimiter(), githubOauthFlow);
router.get(
  "/api/auth",
  rateLimiter.config(10, 5 * 60 * 1000)(),
  verifyGithubTokenOrGetNewTokenFromRefreshToken
);

export default router;
