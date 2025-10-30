"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBudgets } from "@/hooks/queries/budgets";
import { useProfile } from "@/hooks/queries/profile";
import { formatCurrency } from "@/lib/currency-utils";

export default function BudgetOverview() {
  const { data, isLoading, error } = useBudgets();
  const { data: profile } = useProfile();
  const currency = profile?.currency || "INR";

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
    budget,
  }: {
    title: string;
    budget: BudgetData;
  }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Budget Overview</h1>
        <p className="text-muted-foreground mt-2">
          Your available budget based on default bank balance
        </p>
      </div>

      <div className="grid gap-2 grid-cols-2">
        <BudgetCard
          title="Daily Budget"
          budget={data.daily}
        />
        <BudgetCard
          title="Weekly Budget"
          budget={data.weekly}
        />
      </div>
    </div>
  );
}
