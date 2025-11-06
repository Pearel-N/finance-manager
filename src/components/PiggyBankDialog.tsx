"use client";

import { useState } from "react";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPiggyBankSchema, updatePiggyBankSchema } from "@/utils/schema/piggy-bank";
import { z } from "zod";
import { useCreatePiggyBank, useUpdatePiggyBank } from "@/hooks/mutation/piggy-banks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePiggyBanks } from "@/hooks/queries/piggy-banks";

interface PiggyBankDialogProps {
  isOpen: boolean;
  onClose: () => void;
  piggyBank?: {
    id: string;
    name: string;
    goal?: number;
    goalDueDate?: Date | string | null;
    currentBalance?: number;
    isDefault: boolean;
    parentId?: string | null;
  };
  mode: "create" | "edit";
}

export function PiggyBankDialog({ isOpen, onClose, piggyBank, mode }: PiggyBankDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createPiggyBankMutation = useCreatePiggyBank();
  const updatePiggyBankMutation = useUpdatePiggyBank();
  const { data: piggyBanks } = usePiggyBanks();

  const schema = mode === "create" ? createPiggyBankSchema : updatePiggyBankSchema;
  
  type FormData = z.infer<typeof createPiggyBankSchema> | z.infer<typeof updatePiggyBankSchema>;
  
  const resolver = zodResolver(schema) as Resolver<FormData>;
  
  const { control, handleSubmit, reset, formState: { isValid } } = useForm<FormData>({
    resolver,
    mode: "onChange",
    defaultValues: {
      name: piggyBank?.name || "",
      goal: piggyBank?.goal || undefined,
      goalDueDate: piggyBank?.goalDueDate 
        ? (typeof piggyBank.goalDueDate === 'string' 
            ? new Date(piggyBank.goalDueDate) 
            : piggyBank.goalDueDate)
        : undefined,
      currentBalance: piggyBank?.currentBalance || 0,
      isDefault: piggyBank?.isDefault || false,
      parentId: piggyBank?.parentId || null,
    },
  });

  // Filter piggy banks that can be parents (exclude those that are already children, and in edit mode, exclude current piggy bank)
  const availableParents = piggyBanks?.filter(bank => {
    // Exclude if it's already a child
    if (bank.isChild || bank.parentId) {
      return false;
    }
    // In edit mode, exclude the current piggy bank
    if (mode === "edit" && piggyBank && bank.id === piggyBank.id) {
      return false;
    }
    return true;
  }) || [];

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createPiggyBankMutation.mutateAsync(data as z.infer<typeof createPiggyBankSchema>);
      } else if (piggyBank) {
        await updatePiggyBankMutation.mutateAsync({
          id: piggyBank.id,
          data: data as z.infer<typeof updatePiggyBankSchema>,
        });
      }
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to save piggy bank:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Piggy Bank" : "Edit Piggy Bank"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new piggy bank for your savings goals."
              : "Update your piggy bank details."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState: { error } }) => (
                <div>
                  <Input
                    id="name"
                    placeholder="e.g., Vacation Fund"
                    {...field}
                  />
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Goal Amount (Optional)</Label>
            <Controller
              control={control}
              name="goal"
              render={({ field, fieldState: { error } }) => (
                <div>
                  <Input
                    id="goal"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5000"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalDueDate">Goal Due Date (Optional)</Label>
            <Controller
              control={control}
              name="goalDueDate"
              render={({ field, fieldState: { error } }) => (
                <div>
                  <Input
                    id="goalDueDate"
                    type="date"
                    {...field}
                    value={field.value 
                      ? (field.value instanceof Date 
                          ? field.value.toISOString().split('T')[0] 
                          : typeof field.value === 'string' 
                            ? new Date(field.value).toISOString().split('T')[0]
                            : '')
                      : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      field.onChange(dateValue ? new Date(dateValue) : undefined);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentBalance">Current Balance</Label>
            <Controller
              control={control}
              name="currentBalance"
              render={({ field, fieldState: { error } }) => (
                <div>
                  <Input
                    id="currentBalance"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                  />
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Piggy Bank (Optional)</Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field, fieldState: { error } }) => (
                <div>
                  <Select
                    value={field.value || "__none__"}
                    onValueChange={(value) => field.onChange(value === "__none__" ? null : value)}
                  >
                    <SelectTrigger id="parentId">
                      <SelectValue placeholder="Select a parent piggy bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {availableParents.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              control={control}
              name="isDefault"
              render={({ field }) => (
                <Switch
                  id="isDefault"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isDefault">Set as default piggy bank</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || isSubmitting || createPiggyBankMutation.isPending || updatePiggyBankMutation.isPending}
            >
              {isSubmitting || createPiggyBankMutation.isPending || updatePiggyBankMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {mode === "create" ? "Creating..." : "Updating..."}
                </div>
              ) : (
                mode === "create" ? "Create" : "Update"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
