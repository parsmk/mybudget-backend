import { z as zod } from "zod";
import {
  TransactionPatch,
  TransactionSelect,
  bulkTransactionUpdateSchema,
} from "../models/transaction";

type FlowChangeMap = Map<string, { i: number } & Partial<TransactionSelect>>;

export const parseTXPatchBody = (payload: unknown[]) => {
  const errs: any[] = [];
  const txs: TransactionPatch[] = [];
  const txFlowChanged: FlowChangeMap = new Map();

  for (let i = 0; i < payload.length; i++) {
    const dp = payload[i];
    const parsed = bulkTransactionUpdateSchema.safeParse(dp);

    if (!parsed.success) {
      errs.push({ index: i, errors: zod.flattenError(parsed.error) });
      continue;
    }

    const { id, date, inflow, outflow, payee, account_id, category_id } =
      parsed.data;
    const cent_inflow = inflow ? Math.round(Number(inflow) * 100) : undefined;
    const cent_outflow = outflow
      ? Math.round(Number(outflow) * 100)
      : undefined;

    const transaction = {
      id,
      date,
      cent_inflow,
      cent_outflow,
      payee,
      account_id,
      category_id,
    };

    if (outflow || inflow) {
      txFlowChanged.set(transaction.id, { i, ...transaction });
      continue;
    }

    txs.push(transaction);
  }

  return { errs, txs, txFlowChanged };
};

export const validateFlowConstraints = (
  txToTest: TransactionSelect[],
  txFlowChanged: FlowChangeMap,
) => {
  const txs: TransactionPatch[] = [];
  const errs = [];
  for (const tx of txToTest) {
    const changedTx = txFlowChanged.get(tx.id);
    txFlowChanged.delete(tx.id);

    const finalInflow = changedTx?.cent_inflow ?? tx.cent_inflow ?? 0;
    const finalOutflow = changedTx?.cent_outflow ?? tx.cent_outflow ?? 0;
    if (finalInflow > 0 === finalOutflow > 0) {
      errs.push({
        index: changedTx!.i,
        errors: {
          formErrors: [
            "Transaction must have exactly one positive inflow or outflow",
          ],
        },
      });
      continue;
    }

    const { i, ...transaction } = changedTx!;
    txs.push({ ...transaction, id: transaction.id! });
  }

  for (const [_, entry] of txFlowChanged) {
    errs.push({
      index: entry.i,
      errors: { formErrors: ["Transaction not found"] },
    });
  }

  return { txs, errs };
};
