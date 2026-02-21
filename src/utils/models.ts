import { randomUUID } from "crypto";
import { and, or, SQL } from "drizzle-orm";
import { text } from "drizzle-orm/sqlite-core";
import { db } from "../services";

export type SQLExecutables = Pick<
  typeof db,
  "insert" | "select" | "update" | "delete" | "transaction"
>;

export const uuidPK = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const returnSignedInflowOrOutflow = (
  inflow: number | string | null,
  outflow: number | string | null,
) => {
  return Number(inflow ?? 0) - Number(outflow ?? 0);
};

export const queryBuilder = (
  andOr: "and" | "or",
  ...queries: (SQL | undefined | null)[]
) => {
  const valid = queries.filter((q): q is SQL => q != null);
  if (valid.length === 0) return undefined;
  else if (valid.length === 1) return valid[0];
  return andOr === "and" ? and(...valid) : or(...valid);
};
