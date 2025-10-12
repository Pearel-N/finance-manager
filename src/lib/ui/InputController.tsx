"use client";

import { Input } from "@/components/ui/input";
import { transactionSchema } from "@/utils/schema/transation";
import { Control, useController } from "react-hook-form";
import { z } from "zod";

interface InputControllerProps {
  control: Control<z.infer<typeof transactionSchema>>;
  name: keyof z.infer<typeof transactionSchema>;
  [key: string]: unknown;
}

export const InputController = ({
  control,
  name,
  ...props
}: InputControllerProps) => {
  const { field } = useController({ name, control });

  return <Input {...field} {...props} value={field.value as string} />;
};
