import { getTransactions } from "@/services/transactions";
import { useQuery } from "@tanstack/react-query";

export const useTransactions = () => {
  return useQuery({
    queryFn: getTransactions,
    queryKey: ["transactions"],
  });
};