"use client";

import { useCategories } from "@/hooks/queries/categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@prisma/client";

export const SelectCategory = () => {
  const categories = useCategories();
  console.log(categories);
  return <Select>
    <SelectTrigger>
      <SelectValue placeholder="Select a category" />
    </SelectTrigger>
    <SelectContent>
      {categories.data?.map((category: Category) => (
        <SelectItem key={category.id} value={category.id}>
          {category.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>;
};
