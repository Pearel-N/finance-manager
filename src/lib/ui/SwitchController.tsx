"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { transactionSchema } from "@/utils/schema/transation";
import { Control, useController } from "react-hook-form";
import { z } from "zod";

interface SwitchControllerProps {
  name: keyof z.infer<typeof transactionSchema>;
  control: Control<z.infer<typeof transactionSchema>>;
  label: string;
}

export const SwitchController = ({
  name,
  control,
  label,
}: SwitchControllerProps) => {
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
