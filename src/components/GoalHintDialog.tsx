"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferMoneySchema } from "@/utils/schema/piggy-bank";
import { z } from "zod";
import { useTransferMoney } from "@/hooks/mutation/piggy-banks";
import { usePiggyBanks } from "@/hooks/queries/piggy-banks";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency-utils";
import { useProfile } from "@/hooks/queries/profile";
import { calculateMonthsBetween } from "@/lib/date-utils";

interface GoalHintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetPiggyBank: {
    id: string;
    name: string;
    goal: number;
    currentBalance: number;
    goalDueDate: Date | string;
  };
}

export function GoalHintDialog({ isOpen, onClose, targetPiggyBank }: GoalHintDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const transferMoneyMutation = useTransferMoney();
  const { data: piggyBanks } = usePiggyBanks();
  const { data: profile } = useProfile();
  const currency = profile?.currency || 'INR';

  // Find default bank
  const defaultBank = piggyBanks?.find(bank => bank.isDefault);
  
  // Calculate suggested amount with useMemo to ensure fresh calculation
  const { suggestedAmount, remainingMonths, remainingAmount } = useMemo(() => {
    const goalDueDate = typeof targetPiggyBank.goalDueDate === 'string' 
      ? new Date(targetPiggyBank.goalDueDate) 
      : targetPiggyBank.goalDueDate;
    const remAmount = Math.max(0, targetPiggyBank.goal - targetPiggyBank.currentBalance);
    const remMonths = calculateMonthsBetween(new Date(), goalDueDate);
    const suggested = remMonths > 0 && remAmount > 0 
      ? remAmount / remMonths 
      : 0;
    
    return {
      suggestedAmount: suggested,
      remainingMonths: remMonths,
      remainingAmount: remAmount,
    };
  }, [targetPiggyBank.goal, targetPiggyBank.currentBalance, targetPiggyBank.goalDueDate]);

  const { control, handleSubmit, reset, watch, setValue, formState: { isValid } } = useForm<
    z.infer<typeof transferMoneySchema>
  >({
    resolver: zodResolver(transferMoneySchema),
    mode: "onChange",
    defaultValues: {
      fromPiggyBankId: defaultBank?.id || "",
      toPiggyBankId: targetPiggyBank.id,
      amount: 0,
      isWithdrawal: false,
    },
  });

  const watchedSourceBankId = watch("fromPiggyBankId");
  const sourceBank = piggyBanks?.find(bank => bank.id === watchedSourceBankId);
  const sourceBankHasGoal = sourceBank?.goal != null && sourceBank.goal > 0;

  // Update amount and destination when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (suggestedAmount > 0) {
        setValue("amount", Math.round(suggestedAmount * 100) / 100); // Round to 2 decimals
      }
      if (defaultBank) {
        setValue("fromPiggyBankId", defaultBank.id);
      }
      setValue("toPiggyBankId", targetPiggyBank.id);
    }
  }, [isOpen, suggestedAmount, defaultBank, targetPiggyBank.id, setValue]);

  const onSubmit = async (data: z.infer<typeof transferMoneySchema>) => {
    setIsSubmitting(true);
    try {
      await transferMoneyMutation.mutateAsync({
        fromPiggyBankId: data.fromPiggyBankId,
        toPiggyBankId: data.toPiggyBankId,
        amount: data.amount,
        isWithdrawal: false,
      });
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to transfer money:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Filter out the target piggy bank from source options
  const sourceOptions = piggyBanks?.filter(bank => bank.id !== targetPiggyBank.id) || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Goal Hint</DialogTitle>
          <DialogDescription>
            Transfer {formatCurrency(suggestedAmount, currency)} to {targetPiggyBank.name} this month to stay on track.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Controller
              control={control}
              name="amount"
              render={({ field, fieldState: { error } }) => (
                <div>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Suggested: {formatCurrency(suggestedAmount, currency)} per month
                  </p>
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromPiggyBankId">Transfer from</Label>
            <Controller
              control={control}
              name="fromPiggyBankId"
              render={({ field, fieldState: { error } }) => (
                <div>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source piggy bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name} {bank.isDefault && "(Default)"}
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

          {sourceBankHasGoal && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
              ⚠️ This might disrupt your goal. Using the default bank is recommended.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="toPiggyBankId">Transfer to</Label>
            <Controller
              control={control}
              name="toPiggyBankId"
              render={({ field, fieldState: { error } }) => {
                // Ensure field value is always set to target bank ID
                if (field.value !== targetPiggyBank.id) {
                  field.onChange(targetPiggyBank.id);
                }
                return (
                  <div>
                    <Input
                      id="toPiggyBankId"
                      value={targetPiggyBank.name}
                      disabled
                      className="bg-muted"
                      readOnly
                    />
                    {error && (
                      <p className="text-sm text-destructive mt-1">{error.message}</p>
                    )}
                  </div>
                );
              }}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || isSubmitting || transferMoneyMutation.isPending}
            >
              {isSubmitting || transferMoneyMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Transferring...
                </div>
              ) : (
                "Transfer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

