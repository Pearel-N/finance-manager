"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

  const getProgressPercentage = (spent: number, initial: number | null) => {
    if (!initial || initial === 0) return 0;
    return Math.min((spent / initial) * 100, 100);
  };

  const isOverBudget = (remaining: number) => remaining < 0;

  type BudgetData = typeof data.monthly;

  const BudgetCard = ({ 
    title, 
    subtitle, 
    budget 
  }: { 
    title: string; 
    subtitle: string; 
    budget: BudgetData 
  }) => {
    const spentPercentage = getProgressPercentage(budget.spent, budget.initialBudget);
    const remainingPercentage = budget.initialBudget 
      ? Math.min((budget.remaining / budget.initialBudget) * 100, 100)
      : 100;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Initial Budget</span>
              <span className="font-medium">
                {budget.initialBudget ? formatCurrencyAmount(budget.initialBudget) : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent</span>
              <span className={`font-medium ${isOverBudget(budget.remaining) ? 'text-destructive' : ''}`}>
                {formatCurrencyAmount(budget.spent)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className={`font-medium ${isOverBudget(budget.remaining) ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrencyAmount(budget.remaining)}
              </span>
            </div>
          </div>

          {budget.initialBudget !== null && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Spent</span>
                  <span>{spentPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={spentPercentage} />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Remaining</span>
                  <span>{remainingPercentage.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={remainingPercentage} 
                  className={`${isOverBudget(budget.remaining) ? 'bg-red-200' : ''}`}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Budget Overview</h1>
        <p className="text-muted-foreground mt-2">
          Track your spending for this month, week, and day
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <BudgetCard
          title="Monthly Budget"
          subtitle="This month"
          budget={data.monthly}
        />
        <BudgetCard
          title="Weekly Budget"
          subtitle="This week (Monday - Sunday)"
          budget={data.weekly}
        />
        <BudgetCard
          title="Daily Budget"
          subtitle="Today"
          budget={data.daily}
        />
      </div>
    </div>
  );
}

