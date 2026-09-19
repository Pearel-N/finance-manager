import { 
  createRecurringTransaction, 
  updateRecurringTransaction, 
  deleteRecurringTransaction,
  RecurringTransaction
} from "@/services/recurring";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateRecurringTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });
};

export const useUpdateRecurringTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringTransaction> }) => 
      updateRecurringTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });
};

export const useDeleteRecurringTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecurringTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
    },
  });
};
