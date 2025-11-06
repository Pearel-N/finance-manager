import axios from "axios";
import { 
  CreatePiggyBankData, 
  UpdatePiggyBankData, 
  TransferMoneyData 
} from "@/utils/schema/piggy-bank";
import { PiggyBank, Transaction } from "@prisma/client";

// Type for piggy bank data returned from API (includes calculated fields)
export type PiggyBankWithCalculations = PiggyBank & {
  calculatedBalance: number;
  balance: number;
  hasTransferFromDefaultThisMonth?: boolean;
  hasTransferFromParentThisMonth?: boolean;
  transactions: Pick<Transaction, 'id' | 'amount' | 'type' | 'date' | 'note'>[];
  parent?: { id: string; name: string } | null;
  children?: Array<{ id: string; name: string; calculatedBalance: number }>;
  totalBalance?: number; // For parents: own balance + sum of all children balances
  ownBalance?: number; // For parents: just the parent's own balance
  childrenTotal?: number; // For parents: sum of all children balances
  isParent?: boolean;
  isChild?: boolean;
};

export const getPiggyBanks = async (): Promise<PiggyBankWithCalculations[]> => {
  const response = await axios.get("/api/piggy-banks");
  return response.data;
};

export const createPiggyBank = async (data: CreatePiggyBankData): Promise<PiggyBank> => {
  const response = await axios.post("/api/piggy-banks", data);
  return response.data;
};

export const updatePiggyBank = async (id: string, data: UpdatePiggyBankData): Promise<PiggyBank> => {
  const response = await axios.patch("/api/piggy-banks", { id, ...data });
  return response.data;
};

export const transferMoney = async (data: TransferMoneyData): Promise<void> => {
  const response = await axios.post("/api/piggy-banks/transfer", data);
  return response.data;
};

export const deletePiggyBank = async (id: string): Promise<{ success: boolean }> => {
  const response = await axios.delete(`/api/piggy-banks?id=${id}`);
  return response.data;
};
