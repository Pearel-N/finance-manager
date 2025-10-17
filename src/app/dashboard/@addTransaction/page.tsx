"use client";

import { RadioGroupCategory } from "@/components/RadioGroupCategory";
import { Card } from "@/components/ui/card";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema } from "@/utils/schema/transation";
import { z } from "zod";
import { InputController } from "@/lib/ui/InputController";
import { SwitchController } from "@/lib/ui/SwitchController";
import { TextareaController } from "@/lib/ui/TextareaController";
import { Button } from "@/components/ui/button";
import { useAddTransaction } from "@/hooks/mutation/transactions";

export default function AddTransaction() {
  const { control, handleSubmit, reset, formState: { isValid } } = useForm<
    z.infer<typeof transactionSchema>
  >({
    resolver: zodResolver(transactionSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      amount: "",
      isExpense: true,
      note: "",
      category: "",
    },
  });

  const addTransactionMutation = useAddTransaction();

  const onSubmit = async (data: z.infer<typeof transactionSchema>) => {
    try {
      await addTransactionMutation.mutateAsync({
        amount: Number(data.amount),
        note: data.note,
        type: data.isExpense ? "expense" : "income",
        date: new Date(),
        categoryId: data.category,
      });

      // Reset the form after successful submission
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex justify-center">
      <Card className="flex flex-col gap-4 p-4 max-w-md w-full h-fit">
        <InputController
          type="number"
          placeholder="Amount"
          name="amount"
          control={control}
        />
        <SwitchController name="isExpense" control={control} label="Expense" />
        <TextareaController name="note" control={control} placeholder="Note" />
        <Controller
          control={control}
          name="category"
          render={({ field }) => <RadioGroupCategory {...field} />}
        />
        <Button 
          disabled={addTransactionMutation.isPending || !isValid} 
          type="submit"
        >
          {addTransactionMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Adding...
            </div>
          ) : (
            "Add Transaction"
          )}
        </Button>
      </Card>
    </form>
  );
}
