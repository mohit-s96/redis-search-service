import express from "express";
import controller from "./controller";

const router = express.Router();

router.get("/", controller);

export default router;
