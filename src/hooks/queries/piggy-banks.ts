import { useQuery } from "@tanstack/react-query";
import { getPiggyBanks, PiggyBankWithCalculations } from "@/services/piggy-bank";

export const usePiggyBanks = () => {
  return useQuery<PiggyBankWithCalculations[]>({
    queryKey: ["piggyBanks"],
    queryFn: getPiggyBanks,
  });
};
