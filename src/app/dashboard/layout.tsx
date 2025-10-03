import { QueryProvider } from "@/components/providers/query-provider";

export default function DashboardLayout({
  children,
  addTransaction,
}: {
  children: React.ReactNode;
  addTransaction: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="flex flex-col gap-4 p-4">
        {addTransaction}
        {children}
      </div>
    </QueryProvider>
  );
}
