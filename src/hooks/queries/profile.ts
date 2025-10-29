import { getProfile } from "@/services/profile";
import { useQuery } from "@tanstack/react-query";

export const PROFILE = ["profile"];

export const useProfile = () => {
  return useQuery({
    queryFn: getProfile,
    queryKey: PROFILE,
  });
};
