import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTransaction, updateTransaction, deleteTransaction } from "@/services/transactions";
import { Transaction } from "@prisma/client";
import { BUDGETS } from "@/hooks/queries/budgets";


export const useAddTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      // Invalidate and refetch queries after successful mutation
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["piggyBanks"] });
      queryClient.invalidateQueries({ queryKey: BUDGETS });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Transaction, 'id' | 'userId'> & { piggyBankId?: string }> }) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["piggyBanks"] });
      queryClient.invalidateQueries({ queryKey: BUDGETS });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["piggyBanks"] });
      queryClient.invalidateQueries({ queryKey: BUDGETS });
    },
  });
};
