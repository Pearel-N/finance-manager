"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroupCategory } from "@/components/RadioGroupCategory";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recurringTransactionSchema } from "@/utils/schema/recurring";
import { z } from "zod";
import { InputController } from "@/lib/ui/InputController";
import { SwitchController } from "@/lib/ui/SwitchController";
import { TextareaController } from "@/lib/ui/TextareaController";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCreateRecurringTransaction } from "@/hooks/mutation/recurring";
import { usePiggyBanks } from "@/hooks/queries/piggy-banks";
import { useEffect } from "react";
import { PiggyBankWithCalculations } from "@/services/piggy-bank";

type AddRecurringTransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddRecurringTransactionDialog({ open, onOpenChange }: AddRecurringTransactionDialogProps) {
  const { data: piggyBanks } = usePiggyBanks();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
    setValue,
  } = useForm<z.infer<typeof recurringTransactionSchema>>({
    resolver: zodResolver(recurringTransactionSchema),
    mode: "onChange",
    defaultValues: {
      amount: "",
      isExpense: true,
      frequency: "monthly",
      nextDate: new Date().toISOString().split('T')[0],
      note: "",
      category: "",
      piggyBankId: "",
    },
  });

  const createRecurringMutation = useCreateRecurringTransaction();

  useEffect(() => {
    if (piggyBanks && piggyBanks.length > 0) {
      const defaultBank = piggyBanks.find((bank: PiggyBankWithCalculations) => bank.isDefault);
      if (defaultBank) {
        setValue("piggyBankId", defaultBank.id);
      }
    }
  }, [piggyBanks, setValue]);

  const onSubmit = async (data: z.infer<typeof recurringTransactionSchema>) => {
    try {
      await createRecurringMutation.mutateAsync({
        amount: Number(data.amount),
        type: data.isExpense ? "expense" : "income",
        frequency: data.frequency,
        nextDate: new Date(data.nextDate).toISOString(),
        note: data.note,
        categoryId: data.category,
        piggyBankId: data.piggyBankId || null,
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Recurring Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <InputController type="number" placeholder="Amount" name="amount" control={control} />
          <SwitchController name="isExpense" control={control} label="Expense" />
          
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Controller
              control={control}
              name="frequency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <InputController type="date" placeholder="Next Date" name="nextDate" control={control} />
          <TextareaController name="note" control={control} placeholder="Note" />
          
          <div className="space-y-2">
            <Label>Category</Label>
            <Controller control={control} name="category" render={({ field }) => <RadioGroupCategory {...field} />} />
          </div>

          {piggyBanks && piggyBanks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="piggyBank">Piggy Bank (Optional)</Label>
              <Controller
                control={control}
                name="piggyBankId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select piggy bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {piggyBanks.map((bank: PiggyBankWithCalculations) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name} {bank.isDefault && "(Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <Button disabled={createRecurringMutation.isPending || !isValid} type="submit">
            {createRecurringMutation.isPending ? "Adding..." : "Add Recurring Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
