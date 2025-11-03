import { z } from "zod";

const futureDateSchema = z.coerce.date().refine(
  (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  },
  {
    message: "Due date must be in the future",
  }
);

export const createPiggyBankSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  goal: z.number().positive("Goal must be positive").optional(),
  goalDueDate: futureDateSchema.optional(),
  currentBalance: z.number().min(0, "Balance cannot be negative").optional(),
  isDefault: z.boolean().optional(),
});

export const updatePiggyBankSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters").optional(),
  goal: z.number().positive("Goal must be positive").optional(),
  goalDueDate: futureDateSchema.optional(),
  currentBalance: z.number().min(0, "Balance cannot be negative").optional(),
  isDefault: z.boolean().optional(),
});

export const transferMoneySchema = z.object({
  fromPiggyBankId: z.string().min(1, "Source piggy bank is required"),
  toPiggyBankId: z.string().optional(), // Optional for withdrawals
  amount: z.number().positive("Amount must be positive"),
  isWithdrawal: z.boolean().optional(),
}).refine(
  (data) => {
    // Either transfer to another bank or withdrawal, but not both
    // If toPiggyBankId is provided, it's a transfer
    // If toPiggyBankId is empty and isWithdrawal is true, it's a withdrawal
    const hasDestination = data.toPiggyBankId && data.toPiggyBankId.length > 0;
    const isWithdrawal = data.isWithdrawal === true;
    
    return hasDestination || isWithdrawal;
  },
  {
    message: "Either select a destination bank for transfer or mark as withdrawal",
    path: ["toPiggyBankId"],
  }
);

export type CreatePiggyBankData = z.infer<typeof createPiggyBankSchema>;
export type UpdatePiggyBankData = z.infer<typeof updatePiggyBankSchema>;
export type TransferMoneyData = z.infer<typeof transferMoneySchema>;
