import app from "express";
import {
  rateLimiter,
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
} from "../auth/middleware";
import {
  addUriIdHash,
  deleteCommentCacheForBlog,
  deleteCommentFromDb,
  getComments,
  postComment,
  updateUserComment,
} from "./controller";
import {
  isAdminSigned,
  verifyValidBlog,
  verifyValidComment,
} from "./middleware";

const router = app.Router();

const MULTIPLIER = 1;

router.get(
  "/api/comment/:blogId",
  rateLimiter.config(50, 5 * 60 * MULTIPLIER)(),
  verifyValidBlog,
  getComments
);
// admin only route to clear comment cache when a blog is archived. this is called from submitblog component in the cms
router.delete(
  "/api/comment/:blogId",
  rateLimiter.config(5, 10 * 60 * MULTIPLIER)(),
  isAdminSigned,
  verifyValidBlog,
  deleteCommentCacheForBlog
);

router.put(
  "/api/blog/hash",
  rateLimiter.config(5, 10 * 60 * MULTIPLIER)(),
  isAdminSigned,
  addUriIdHash
);

// user route to delete a comment they post
router.delete(
  "/api/comment/:blogId/:commentId",
  rateLimiter.config(5, 10 * 60 * MULTIPLIER)(),
  verifyValidBlog,
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
  verifyValidComment,
  deleteCommentFromDb
);

router.post(
  "/api/comment/:blogId",
  rateLimiter.config(5, 2 * 60 * 1)(),
  verifyValidBlog,
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
  postComment
);
router.patch(
  "/api/comment/:blogId",
  rateLimiter.config(5, 3 * 60 * MULTIPLIER)(),
  verifyValidBlog,
  verifyGithubTokenOrGetNewTokenFromRefreshToken,
  verifyValidComment,
  updateUserComment
);

export default router;
