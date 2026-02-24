import { and, or, SQL } from "drizzle-orm";
import { z as zod } from "zod";
import { db } from "../services";

export type SQLExecutables = Pick<
  typeof db,
  "insert" | "select" | "update" | "delete" | "transaction"
>;

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

export const dateField = zod
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in the following format: YYYY-MM-DD",
  )
  .refine((val) => {
    const [y, m, d] = val.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }, "Invalid calendar date. Check to see if you've selected the correct Date format!");
