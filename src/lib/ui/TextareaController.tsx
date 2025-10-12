"use client";

import { Textarea } from "@/components/ui/textarea";
import { transactionSchema } from "@/utils/schema/transation";
import { Control, useController } from "react-hook-form";
import { z } from "zod";

interface TextareaControllerProps {
  name: keyof z.infer<typeof transactionSchema>;
  control: Control<z.infer<typeof transactionSchema>>;
  [key: string]: unknown;
}

export const TextareaController = ({
  name,
  control,
  ...props
}: TextareaControllerProps) => {
  const { field } = useController({ name, control });
  return <Textarea {...field} {...props} value={field.value as string} />;
};
