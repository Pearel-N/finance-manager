"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBudgets } from "@/hooks/queries/budgets";
import { useProfile } from "@/hooks/queries/profile";
import { formatCurrency } from "@/lib/currency-utils";
import { QueryProvider } from "@/components/providers/query-provider";

export default function BudgetPage() {
  return (
    <QueryProvider>
      <BudgetContent />
    </QueryProvider>
  );
}

function BudgetContent() {
  const { data, isLoading, error } = useBudgets();
  const { data: profile } = useProfile();
  const currency = profile?.currency || 'INR';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading budgets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading budgets</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrencyAmount = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  type BudgetData = typeof data.weekly;

  const BudgetCard = ({ 
    title, 
    subtitle, 
    budget 
  }: { 
    title: string; 
    subtitle: string; 
    budget: BudgetData 
  }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Available</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrencyAmount(budget.available)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Budget Overview</h1>
        <p className="text-muted-foreground mt-2">
          Your available budget based on default bank balance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BudgetCard
          title="Weekly Budget"
          subtitle="Available per week (remaining this month)"
          budget={data.weekly}
        />
        <BudgetCard
          title="Daily Budget"
          subtitle="Available per day (remaining this month)"
          budget={data.daily}
        />
      </div>
    </div>
  );
}

