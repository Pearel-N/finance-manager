"use client";

import { Input } from "@/components/ui/input";
import { Control, FieldPath, FieldValues, useController } from "react-hook-form";

interface InputControllerProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  [key: string]: unknown;
}

export const InputController = <T extends FieldValues>({
  control,
  name,
  ...props
}: InputControllerProps<T>) => {
  const { field } = useController({ name, control });

  return <Input {...field} {...props} value={field.value as string} />;
};
