import { QueryProvider } from "@/components/providers/query-provider";

export default function DashboardLayout({
  addTransaction,
  transactions,
}: {
  children: React.ReactNode;
  addTransaction: React.ReactNode;
  transactions: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="grid grid-cols-2 gap-4 p-4">
        {addTransaction}
        {transactions}
      </div>
    </QueryProvider>
  );
}
