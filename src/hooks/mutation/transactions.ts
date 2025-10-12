import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTransaction } from "@/services/transactions";


export const useAddTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      // Invalidate and refetch transactions query after successful mutation
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};
