import { randomUUID } from "crypto";
import { text } from "drizzle-orm/sqlite-core";

export const uuidPK = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());
