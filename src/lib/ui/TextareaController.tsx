"use client";

import { Textarea } from "@/components/ui/textarea";
import { Control, FieldPath, FieldValues, useController } from "react-hook-form";

interface TextareaControllerProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  [key: string]: unknown;
}

export const TextareaController = <T extends FieldValues>({
  name,
  control,
  ...props
}: TextareaControllerProps<T>) => {
  const { field } = useController({ name, control });
  return <Textarea {...field} {...props} value={field.value as string} />;
};
