import cors from "cors";
import { Router } from "express";
import path from "path";
import { ExpressApp } from "..";
import impDir from "../utils/import-directory";
import Cookies from "cookies";
import express from "express";

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split("__AND__"),
  credentials: true,
};

export default async function (app: ExpressApp) {
  app.use(cors(corsOptions));

  app.use(express.json());

  app.use(Cookies.express([""]));

  await impDir(path.join(process.cwd(), "./dist/routes"), {
    visit: (router: Router) => app.use(router),
    include: /router\.js$/,
  });
}
