import { Auth } from "../../types";
declare global {
  namespace Express {
    interface Request {
      auth: Auth;
    }
  }
}
export {};
