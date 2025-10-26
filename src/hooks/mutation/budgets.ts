import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BUDGETS } from "../queries/budgets";
import axios from "axios";

type CreateBudgetData = {
  periodType: 'month' | 'week' | 'day';
  periodStartDate: Date;
  initialBudget: number;
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBudgetData) => {
      const response = await axios.post("/api/budgets", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS });
    },
  });
};

