import express from "express";
import "dotenv/config";
import requireDirectory from "./utils/import-directory";
import path from "path";

const app = express();
const port = 5001;

await requireDirectory(path.join(process.cwd(), "./dist/initializers"), {
  visit: async (fn: (app: ExpressApp) => Promise<void> | void) => await fn(app),
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});

export type ExpressApp = typeof app;
