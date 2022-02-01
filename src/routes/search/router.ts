import express from "express";
import controller from "./controller";
import { rateLimiter } from "./middleware";

const router = express.Router();

router.get("/api/search", rateLimiter, controller);

export default router;
