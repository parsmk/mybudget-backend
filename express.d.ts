import { TokenPayload } from "./utils/auth";

declare namespace Express {
  export interface Request {
    auth?: TokenPayload;
  }
}
