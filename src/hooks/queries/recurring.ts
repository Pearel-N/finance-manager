import { getRecurringTransactions } from "@/services/recurring";
import { useQuery } from "@tanstack/react-query";

export const useRecurringTransactions = () => {
  return useQuery({
    queryFn: getRecurringTransactions,
    queryKey: ["recurring-transactions"],
  });
};
