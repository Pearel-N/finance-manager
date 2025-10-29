"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PiggyBankCard } from "@/components/PiggyBankCard";
import { PiggyBankDialog } from "@/components/PiggyBankDialog";
import { usePiggyBanks } from "@/hooks/queries/piggy-banks";
import { PiggyBankWithCalculations } from "@/services/piggy-bank";

export default function PiggyBanks() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: piggyBanks, isLoading, error } = usePiggyBanks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading piggy banks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Error loading piggy banks: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Piggy Banks</h2>
          <p className="text-muted-foreground">
            Manage your savings goals and track your progress
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create New Bank
        </Button>
      </div>

      {piggyBanks && piggyBanks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {piggyBanks.map((piggyBank: PiggyBankWithCalculations) => (
            <PiggyBankCard key={piggyBank.id} piggyBank={piggyBank} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">🐷</div>
              <h3 className="text-lg font-semibold">No piggy banks yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Create your first piggy bank to start saving for your goals. 
                You can set savings targets and track your progress.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Piggy Bank
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <PiggyBankDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
      />
    </div>
  );
}
