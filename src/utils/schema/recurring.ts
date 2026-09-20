import { z } from "zod";

export const recurringTransactionSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  isExpense: z.boolean(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  nextDate: z.string().min(1, "Next date is required"),
  note: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  piggyBankId: z.string().optional(),
});
