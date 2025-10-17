import { QueryProvider } from "@/components/providers/query-provider";

export default function DashboardLayout({
  addTransaction,
  transactions,
  piggyBanks,
}: {
  children: React.ReactNode;
  addTransaction: React.ReactNode;
  transactions: React.ReactNode;
  piggyBanks: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {addTransaction}
          {piggyBanks}
        </div>
        {transactions}
      </div>
    </QueryProvider>
  );
}
