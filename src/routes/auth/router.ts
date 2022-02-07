import express from "express";
import { githubOauthFlow, userVerified } from "./controller";
import {
  rateLimiter,
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
} from "./middleware";

const router = express.Router();

const MULTIPLIER = 1;

router.post("/api/auth", rateLimiter(), githubOauthFlow);
router.get(
  "/api/auth",
  rateLimiter.config(10, 5 * 60 * MULTIPLIER)(),
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
  userVerified
);

export default router;
