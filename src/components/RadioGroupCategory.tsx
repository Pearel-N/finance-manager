"use client";

import { useState, useMemo } from "react";
import { useCategories } from "@/hooks/queries/categories";
import { useAddCategory } from "@/hooks/mutation/categories";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Category } from "@prisma/client";

interface RadioGroupCategoryProps {
  onChange: (value: string) => void;
  value: string;
  [key: string]: unknown;
}

export const RadioGroupCategory = ({ onChange, value }: RadioGroupCategoryProps) => {
  const categories = useCategories();
  const addCategoryMutation = useAddCategory();
  
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!categories.data) return [];
    
    return categories.data.filter((category: Category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories.data, searchQuery]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await addCategoryMutation.mutateAsync(newCategoryName.trim());
      onChange(newCategory.id); // Auto-select the new category
      setNewCategoryName("");
      setIsAddingMode(false);
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  const handleCancel = () => {
    setNewCategoryName("");
    setIsAddingMode(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddCategory();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-3 max-h-[300px] flex flex-col">
      {/* Search input */}
      <Input
        placeholder="Search categories..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {/* Scrollable radio group */}
      <ScrollArea className="flex-1">
        <RadioGroup value={value} onValueChange={onChange}>
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map((category: Category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <RadioGroupItem value={category.id} id={category.id} />
                <Label htmlFor={category.id} className="text-sm font-normal cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </ScrollArea>
      
      {/* Add button OR Input mode */}
      {!isAddingMode ? (
        <Button 
          type="button"
          onClick={() => setIsAddingMode(true)}
          variant="outline"
          className="w-full"
        >
          + Add Category
        </Button>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="flex gap-2">
            <Button 
              type="button"
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim() || addCategoryMutation.isPending}
              size="sm"
              className="flex-1"
            >
              {addCategoryMutation.isPending ? "Adding..." : "Save"}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleCancel}
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
