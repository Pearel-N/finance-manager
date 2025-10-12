"use client";

import { useCategories } from "@/hooks/queries/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category } from "@prisma/client";

interface SelectCategoryProps {
  onChange: (value: string) => void;
  value: string;
  [key: string]: unknown;
}

export const SelectCategory = ({ ...props }: SelectCategoryProps) => {
  const categories = useCategories();
  return (
    <Select {...props} onValueChange={props.onChange}>
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
    </Select>
  );
};
