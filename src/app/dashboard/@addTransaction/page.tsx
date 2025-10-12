"use client";

import { SelectCategory } from "@/components/selectCategory";
import { Card } from "@/components/ui/card";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema } from "@/utils/schema/transation";
import { z } from "zod";
import { InputController } from "@/lib/ui/InputController";
import { SwitchController } from "@/lib/ui/SwitchController";
import { TextareaController } from "@/lib/ui/TextareaController";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { addTransaction } from "@/services/transations";

export default function AddTransaction() {
  const {
    control,
    handleSubmit,
    reset,
  } = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "0",
      isExpense: true,
      note: "",
      category: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: z.infer<typeof transactionSchema>) => {
    setIsLoading(true);
    try {
      await addTransaction({
        amount: Number(data.amount),
        note: data.note || null,
        type: data.isExpense ? "expense" : "income",
        date: new Date(),
        categoryId: data.category,
      });
      
      // Reset the form after successful submission
      reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="flex flex-col gap-4 p-4 w-fit h-fit">
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
          render={({ field }) => <SelectCategory {...field} />}
        />
        <Button disabled={isLoading} type="submit">
          {isLoading ? "Adding..." : "Add Transaction"}
        </Button>
      </Card>
    </form>
  );
}
