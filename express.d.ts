import { TokenPayload } from "./src/utils/auth";

declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

export {};
