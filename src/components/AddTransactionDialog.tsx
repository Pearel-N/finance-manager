"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroupCategory } from "@/components/RadioGroupCategory";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema } from "@/utils/schema/transation";
import { z } from "zod";
import { InputController } from "@/lib/ui/InputController";
import { SwitchController } from "@/lib/ui/SwitchController";
import { TextareaController } from "@/lib/ui/TextareaController";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAddTransaction } from "@/hooks/mutation/transactions";
import { usePiggyBanks } from "@/hooks/queries/piggy-banks";
import { useEffect } from "react";
import { PiggyBankWithCalculations } from "@/services/piggy-bank";

type AddTransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddTransactionDialog({ open, onOpenChange }: AddTransactionDialogProps) {
  const { data: piggyBanks } = usePiggyBanks();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
    setValue,
  } = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    mode: "onChange",
    defaultValues: {
      amount: "",
      isExpense: true,
      note: "",
      category: "",
      piggyBankId: "",
      excludeFromDailySpent: false,
    },
  });

  const addTransactionMutation = useAddTransaction();

  useEffect(() => {
    if (piggyBanks && piggyBanks.length > 0) {
      const defaultBank = piggyBanks.find((bank: PiggyBankWithCalculations) => bank.isDefault);
      if (defaultBank) {
        setValue("piggyBankId", defaultBank.id);
      } else {
        setValue("piggyBankId", piggyBanks[0].id);
      }
    }
  }, [piggyBanks, setValue]);

  const onSubmit = async (data: z.infer<typeof transactionSchema>) => {
    try {
      await addTransactionMutation.mutateAsync({
        amount: Number(data.amount),
        note: data.note,
        type: data.isExpense ? "expense" : "income",
        date: new Date(),
        categoryId: data.category,
        piggyBankId: data.piggyBankId || null,
        excludeFromDailySpent: data.excludeFromDailySpent || false,
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <InputController type="number" placeholder="Amount" name="amount" control={control} />
          <SwitchController name="isExpense" control={control} label="Expense" />
          <SwitchController name="excludeFromDailySpent" control={control} label="Exclude from daily budget" />
          <TextareaController name="note" control={control} placeholder="Note" />
          <Controller control={control} name="category" render={({ field }) => <RadioGroupCategory {...field} />} />

          {piggyBanks && piggyBanks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="piggyBank">Piggy Bank</Label>
              <Controller
                control={control}
                name="piggyBankId"
                render={({ field, fieldState: { error } }) => (
                  <div>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select piggy bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {piggyBanks.map((bank: PiggyBankWithCalculations) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name} {bank.isDefault && "(Default)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {error && <p className="text-sm text-destructive mt-1">{error.message}</p>}
                  </div>
                )}
              />
            </div>
          )}

          <Button disabled={addTransactionMutation.isPending || !isValid} type="submit">
            {addTransactionMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </div>
            ) : (
              "Add Transaction"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


