import { Transaction } from "@prisma/client";
import axios from "axios";

type CreateTransactionData = Omit<Transaction, 'id' | 'userId'>;


export const getTransactions = async () => {
  const response = await axios.get("/api/transactions");
  return response.data;
};

export const addTransaction = async (transaction: CreateTransactionData) => {
  const response = await axios.post("/api/transactions", transaction);
  return response.data;
};

export const updateTransaction = async (id: string, transaction: Partial<CreateTransactionData>) => {
  const response = await axios.patch("/api/transactions", { id, ...transaction });
  return response.data;
};

export const deleteTransaction = async (id: string) => {
  const response = await axios.delete(`/api/transactions?id=${id}`);
  return response.data;
};