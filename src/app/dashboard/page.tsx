"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BudgetOverview from "@/components/BudgetOverview";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import { PiggyBankCardReadOnly } from "@/components/PiggyBankCardReadOnly";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePiggyBanks } from "@/hooks/queries/piggy-banks";
import { PiggyBankWithCalculations } from "@/services/piggy-bank";

export default function Dashboard() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const router = useRouter();
  const { data: piggyBanks, isLoading, error } = usePiggyBanks();

  // Filter out child banks - only show parent banks and standalone banks
  const displayBanks = piggyBanks?.filter((bank: PiggyBankWithCalculations) => !bank.isChild) || [];

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <BudgetOverview />
        <div>
          <Button className="w-full" onClick={() => setIsAddTransactionOpen(true)}>Add Transaction</Button>
        </div>
      </div>

      <AddTransactionDialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Piggy Banks</h2>
            <p className="text-muted-foreground">View your savings goals and track your progress</p>
          </div>
          <Button onClick={() => router.push("/dashboard/piggy-banks")}>Manage Piggy Banks</Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading piggy banks...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive">Error loading piggy banks: {error.message}</p>
            </div>
          </div>
        ) : displayBanks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayBanks.map((piggyBank: PiggyBankWithCalculations) => (
              <PiggyBankCardReadOnly key={piggyBank.id} piggyBank={piggyBank} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="text-6xl">🐷</div>
                <h3 className="text-lg font-semibold">No piggy banks yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Create your first piggy bank to start saving for your goals. You can set savings targets and track your progress.
                </p>
                <Button onClick={() => router.push("/dashboard/piggy-banks")}>Manage Piggy Banks</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
