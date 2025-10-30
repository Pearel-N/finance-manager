"use client";

import { useState } from "react";
import BudgetOverview from "@/components/BudgetOverview";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import PiggyBanksSection from "@/components/PiggyBanksSection";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <BudgetOverview />
        <div>
          <Button className="w-full" onClick={() => setIsAddTransactionOpen(true)}>Add Transaction</Button>
        </div>
      </div>

      <AddTransactionDialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen} />

      <PiggyBanksSection />
    </div>
  );
}
