"use client";

import { SelectCategory } from "@/components/selectCategory";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function AddTransaction() {
  return (
    <Card className="flex flex-col gap-4 p-4 w-fit h-fit">
      <Input type="number" placeholder="Amount" />
      <div className="flex items-center gap-2">
        <Switch id="expense" />
        <Label htmlFor="expense">Expense</Label>
      </div>
      <Textarea placeholder="Note" />
      <SelectCategory />
    </Card>
  );
}
