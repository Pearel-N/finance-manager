import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCategory } from "@/services/category";
import { CATEGORIES } from "@/hooks/queries/categories";

export const useAddCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      // Invalidate and refetch categories query after successful mutation
      queryClient.invalidateQueries({ queryKey: CATEGORIES });
    },
  });
};
