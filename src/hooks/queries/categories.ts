import { getCategories } from "@/services/category";
import { useQuery } from "@tanstack/react-query";

export const CATEGORIES = ["categories"];

export const useCategories = () => {
  return useQuery({
    queryFn: getCategories,
    queryKey: CATEGORIES,
  });
};
