"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import RecurringTransactionsTable from "@/components/RecurringTransactionsTable";
import AddRecurringTransactionDialog from "@/components/AddRecurringTransactionDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function RecurringPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <QueryProvider>
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recurring Transactions</h1>
            <p className="text-muted-foreground mt-2">Manage your automated income and expenses</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Recurring
          </Button>
        </div>
        
        <RecurringTransactionsTable />
        
        <AddRecurringTransactionDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen} 
        />
      </div>
    </QueryProvider>
  );
}
