"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import TransactionsTable from "@/components/TransactionsTable";

export default function TransactionsPage() {
  return (
    <QueryProvider>
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-2">View and manage your transactions</p>
        </div>
        <TransactionsTable />
      </div>
    </QueryProvider>
  );
}


