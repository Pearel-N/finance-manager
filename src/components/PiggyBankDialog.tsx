"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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

interface PiggyBankDialogProps {
  isOpen: boolean;
  onClose: () => void;
  piggyBank?: {
    id: string;
    name: string;
    goal?: number;
    currentBalance?: number;
    isDefault: boolean;
  };
  mode: "create" | "edit";
}

export function PiggyBankDialog({ isOpen, onClose, piggyBank, mode }: PiggyBankDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createPiggyBankMutation = useCreatePiggyBank();
  const updatePiggyBankMutation = useUpdatePiggyBank();

  const schema = mode === "create" ? createPiggyBankSchema : updatePiggyBankSchema;
  
  const { control, handleSubmit, reset, formState: { isValid } } = useForm<
    z.infer<typeof schema>
  >({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: piggyBank?.name || "",
      goal: piggyBank?.goal || undefined,
      currentBalance: piggyBank?.currentBalance || 0,
      isDefault: piggyBank?.isDefault || false,
    },
  });

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
