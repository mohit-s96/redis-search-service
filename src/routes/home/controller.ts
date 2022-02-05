import { Response, Request } from "express";

export default (req: Request, res: Response) => {
  res.send("Your ip is " + req.ip);
};
