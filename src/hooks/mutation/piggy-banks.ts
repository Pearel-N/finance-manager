import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPiggyBank, updatePiggyBank, transferMoney, deletePiggyBank } from "@/services/piggy-bank";
import { CreatePiggyBankData, UpdatePiggyBankData, TransferMoneyData } from "@/utils/schema/piggy-bank";
import { BUDGETS } from "@/hooks/queries/budgets";

export const useCreatePiggyBank = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePiggyBankData) => createPiggyBank(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["piggyBanks"] });
      queryClient.invalidateQueries({ queryKey: BUDGETS });
    },
  });
};

export const useUpdatePiggyBank = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePiggyBankData }) => 
      updatePiggyBank(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["piggyBanks"] });
      queryClient.invalidateQueries({ queryKey: BUDGETS });
    },
  });
};

export const useTransferMoney = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TransferMoneyData) => transferMoney(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["piggyBanks"] });
      queryClient.invalidateQueries({ queryKey: BUDGETS });
    },
  });
};

export const useDeletePiggyBank = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deletePiggyBank(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["piggyBanks"] });
      queryClient.invalidateQueries({ queryKey: BUDGETS });
    },
  });
};
