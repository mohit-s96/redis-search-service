import express from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "./rate-limit-redis/index";
import { createClient } from "redis";
import cors from "cors";
import "dotenv/config";
import handleSearchQuery from "./routes/getQueryResult";

const corsOptions = {
  methods: ["POST"],
  origin:
    // process.env.NODE_ENV === "development"
    // ?
    "http://localhost:5000",
  // : "https://mohits.dev",
};

export const client = createClient({
  url: process.env.REDIS_ENDPOINT_URI as string,
  password: process.env.REDIS_PASSWORD,
});
client.on("error", (err) => {
  console.log(err);
});
client.connect().then(async () => {
  const limiter = rateLimit({
    max: 100, // limit each IP to 100 requests per windowMs
    windowMs: 2 * 60 * 100, // 2 minutes
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new RedisStore({
      sendCommand: (...args: string[]) => client.sendCommand(args),
    }),
    //  delayMs: 0, // disable delaying - full speed until the max limit is reached
  });
  const app = express();
  app.use(limiter);
  const port = 5001;
  app.use(cors(corsOptions));

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.get("/api/search", handleSearchQuery);

  app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
  });
});
