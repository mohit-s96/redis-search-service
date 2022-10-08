import { Response, Request } from "express";

export default (req: Request, res: Response) => {
  const forwarded = req.headers["x-forwarded-for"];
  let ip: string;
  if (typeof forwarded === "string") {
    ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
  }
  res.send("Your ip is " + ip || req.socket.remoteAddress);
};
