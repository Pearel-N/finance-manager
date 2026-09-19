import axios from "axios";

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  note?: string;
  categoryId: string;
  piggyBankId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  category?: { name: string };
  piggyBank?: { name: string };
}

export const getRecurringTransactions = async (): Promise<RecurringTransaction[]> => {
  const response = await axios.get("/api/recurring-transactions");
  return response.data;
};

export const createRecurringTransaction = async (data: Partial<RecurringTransaction>) => {
  const response = await axios.post("/api/recurring-transactions", data);
  return response.data;
};

export const updateRecurringTransaction = async (id: string, data: Partial<RecurringTransaction>) => {
  const response = await axios.patch("/api/recurring-transactions", { id, ...data });
  return response.data;
};

export const deleteRecurringTransaction = async (id: string) => {
  const response = await axios.delete(`/api/recurring-transactions?id=${id}`);
  return response.data;
};
