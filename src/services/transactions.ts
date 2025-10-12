import { createClient } from "@/utils/supabase/client";
import { Transaction } from "@prisma/client";
import axios from "axios";

type CreateTransactionData = Omit<Transaction, 'id' | 'userId'>;

export const addTransaction = async (transaction: CreateTransactionData) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not found");
  }
  const response = await axios.post("/api/transactions", {
    ...transaction,
    userId: user.id,
  });
  return response.data;
};