import { getBudgets } from "@/services/budget";
import { useQuery } from "@tanstack/react-query";

export const BUDGETS = ["budgets"];

export const useBudgets = () => {
  return useQuery({
    queryFn: getBudgets,
    queryKey: BUDGETS,
  });
};

