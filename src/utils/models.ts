import { randomUUID } from "crypto";
import { and, or, SQL } from "drizzle-orm";
import { text } from "drizzle-orm/sqlite-core";

export const uuidPK = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const queryBuilder = (
  andOr: "and" | "or",
  ...queries: (SQL | undefined | null)[]
) => {
  const valid = queries.filter((q): q is SQL => q != null);
  if (valid.length === 0) return undefined;
  else if (valid.length === 1) return valid[0];
  return andOr === "and" ? and(...valid) : or(...valid);
};
