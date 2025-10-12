import { z } from "zod";

export const transactionSchema = z
  .object({
    amount: z.string(),
    isExpense: z.boolean(),
    note: z.string().optional(),
    category: z.string(),
  })
  .refine(
    (data) => {
      return !isNaN(Number(data.amount));
    },
    {
      message: "Amount must be a number",
      path: ["amount"],
    }
  );
