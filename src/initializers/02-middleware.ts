import cors from "cors";
import { Router } from "express";
import path from "path";
import { ExpressApp } from "..";
import impDir from "../utils/import-directory";

const corsOptions = {
  methods: ["POST"],
  origin:
    // process.env.NODE_ENV === "development"
    // ?
    "http://localhost:5000",
  // : "https://mohits.dev",
};

export default async function (app: ExpressApp) {
  app.use(cors(corsOptions));

  await impDir(path.join(process.cwd(), "./dist/routes"), {
    visit: (router: Router) => app.use(router),
    include: /router\.js$/,
  });
}
