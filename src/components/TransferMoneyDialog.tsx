"use client";

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";

interface TransferMoneyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePiggyBank: {
    id: string;
    name: string;
    currentBalance: number;
  };
}

export function TransferMoneyDialog({ isOpen, onClose, sourcePiggyBank }: TransferMoneyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawal, setIsWithdrawal] = useState(false);
  const transferMoneyMutation = useTransferMoney();
  const { data: piggyBanks } = usePiggyBanks();

  const { control, handleSubmit, reset, watch, formState: { isValid } } = useForm<
    z.infer<typeof transferMoneySchema>
  >({
    resolver: zodResolver(transferMoneySchema),
    mode: "onChange",
    defaultValues: {
      fromPiggyBankId: sourcePiggyBank.id,
      toPiggyBankId: "",
      amount: 0,
      isWithdrawal: false,
    },
  });

  const watchedAmount = watch("amount");

  const onSubmit = async (data: z.infer<typeof transferMoneySchema>) => {
    setIsSubmitting(true);
    try {
      await transferMoneyMutation.mutateAsync({
        fromPiggyBankId: data.fromPiggyBankId,
        toPiggyBankId: isWithdrawal ? undefined : data.toPiggyBankId,
        amount: data.amount,
        isWithdrawal,
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
    setIsWithdrawal(false);
    onClose();
  };

  const handleWithdrawalToggle = (checked: boolean) => {
    setIsWithdrawal(checked);
    if (checked) {
      // Clear destination when switching to withdrawal
      reset({
        fromPiggyBankId: sourcePiggyBank.id,
        toPiggyBankId: "",
        amount: watchedAmount || 0,
        isWithdrawal: true,
      });
    }
  };

  // Filter out the source piggy bank from destination options
  const destinationOptions = piggyBanks?.filter(bank => bank.id !== sourcePiggyBank.id) || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogDescription>
            Transfer money from {sourcePiggyBank.name} or withdraw funds.
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
                    max={sourcePiggyBank.currentBalance}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                  {error && (
                    <p className="text-sm text-destructive mt-1">{error.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Available balance: ${sourcePiggyBank.currentBalance.toFixed(2)}
                  </p>
                </div>
              )}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isWithdrawal"
              checked={isWithdrawal}
              onCheckedChange={handleWithdrawalToggle}
            />
            <Label htmlFor="isWithdrawal">{`Withdraw money (don't transfer to another bank)`}</Label>
          </div>

          {!isWithdrawal && (
            <div className="space-y-2">
              <Label htmlFor="toPiggyBankId">Transfer to</Label>
              <Controller
                control={control}
                name="toPiggyBankId"
                render={({ field, fieldState: { error } }) => (
                  <div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination piggy bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinationOptions.map((bank) => (
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
          )}

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
                  {isWithdrawal ? "Withdrawing..." : "Transferring..."}
                </div>
              ) : (
                isWithdrawal ? "Withdraw" : "Transfer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
