import { z } from "zod";

export const transactionSchema = z
  .object({
    amount: z.string(),
    isExpense: z.boolean(),
    note: z.string().min(1, "Note is required"),
    category: z.string().min(1, "Category is required"),
  })
  .refine(
    (data) => {
      const amount = Number(data.amount);
      return !isNaN(amount) && amount >= 1;
    },
    {
      message: "Amount must be a number and at least 1",
      path: ["amount"],
    }
  );
