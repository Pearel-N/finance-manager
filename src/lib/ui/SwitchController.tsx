"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Control, FieldPath, FieldValues, useController } from "react-hook-form";

interface SwitchControllerProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label: string;
}

export const SwitchController = <T extends FieldValues>({
  name,
  control,
  label,
}: SwitchControllerProps<T>) => {
  const { field } = useController({ name, control });
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={!!field.value}
        id={name}
        onCheckedChange={field.onChange}
      />
      <Label htmlFor={name}>{label}</Label>
    </div>
  );
};
