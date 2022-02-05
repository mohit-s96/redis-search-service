import express from "express";
import { githubOauthFlow, userVerified } from "./controller";
import {
  rateLimiter,
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
} from "./middleware";

const router = express.Router();

router.post("/api/auth", rateLimiter(), githubOauthFlow);
router.get(
  "/api/auth",
  rateLimiter.config(10, 5 * 60 * 1000)(),
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
  userVerified
);

export default router;
