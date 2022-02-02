import app from "express";
import {
  rateLimiter,
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
} from "../auth/middleware";
import { deleteCommentCacheForBlog, getComments } from "./controller";
import { isAdminSigned, verifyValidBlog } from "./middleware";

const router = app.Router();

router.get(
  "/api/comment/:blogid",
  rateLimiter.config(50, 5 * 60 * 1000)(),
  verifyValidBlog,
  getComments
);
router.delete(
  "/api/comment/:blogid",
  rateLimiter.config(5, 10 * 60 * 1000)(),
  isAdminSigned,
  verifyValidBlog,
  deleteCommentCacheForBlog
);
router.post(
  "/api/comment/:blogid",
  rateLimiter.config(1, 2 * 60 * 1000),
  verifyGithubTokenOrGetNewTokenFromRefreshToken
);
router.patch(
  "/api/comment/:blogid",
  rateLimiter.config(1, 3 * 60 * 1000)(),
  verifyGithubTokenOrGetNewTokenFromRefreshToken
);

export default router;
