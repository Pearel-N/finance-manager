"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useBudgets } from "@/hooks/queries/budgets";
import { useProfile } from "@/hooks/queries/profile";
import { formatCurrency } from "@/lib/currency-utils";

const DEFAULT_CURRENCY = "INR";
const CIRCULAR_PROGRESS_SIZE = 160;
const CIRCULAR_PROGRESS_STROKE_WIDTH = 10;

export default function BudgetOverview() {
  const { data, isLoading, error } = useBudgets();
  const { data: profile } = useProfile();
  const currency = profile?.currency || DEFAULT_CURRENCY;

  const budgetData = useMemo(() => {
    if (!data?.daily) return null;

    const dailyBudget = data.daily;
    const spent = dailyBudget.spent ?? 0;
    const available = dailyBudget.available;
    const remaining = Math.max(0, available - spent);
    const isOverspent = spent > available;
    
    // Calculate progress percentage (can exceed 100% when overspent)
    const progressPercentage = available > 0 ? (spent / available) * 100 : 0;
    const remainingPercentage = available > 0 ? (remaining / available) * 100 : 0;
    const excessAmount = isOverspent ? spent - available : 0;

    return {
      spent,
      available,
      remaining,
      isOverspent,
      progressPercentage,
      remainingPercentage,
      excessAmount,
    };
  }, [data]);

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

  if (!budgetData) {
    return null;
  }

  const formatCurrencyAmount = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  const {
    spent,
    available,
    remaining,
    isOverspent,
    progressPercentage,
    remainingPercentage,
    excessAmount,
  } = budgetData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Budget</CardTitle>
        <CardDescription>Your spending today from default bank</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6">
          {/* Circular Progress */}
          <div className="relative">
            <CircularProgress 
              value={progressPercentage}
              remaining={remainingPercentage}
              size={CIRCULAR_PROGRESS_SIZE}
              strokeWidth={CIRCULAR_PROGRESS_STROKE_WIDTH}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-sm text-muted-foreground">Remaining</div>
              <div className={`text-2xl font-bold ${isOverspent ? 'text-destructive' : 'text-foreground'}`}>
                {formatCurrencyAmount(remaining)}
              </div>
              <div className="text-xs text-muted-foreground">of {formatCurrencyAmount(available)}</div>
            </div>
          </div>

          {/* Budget Details */}
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Initial Budget</span>
              <span className="text-lg font-semibold">
                {formatCurrencyAmount(available)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-muted-foreground">Spent Today</span>
              <span className={`text-lg font-semibold ${isOverspent ? 'text-destructive' : ''}`}>
                {formatCurrencyAmount(spent)}
              </span>
            </div>
            {isOverspent && (
              <div className="text-sm text-destructive text-center pt-2">
                You&apos;ve exceeded your daily budget by {formatCurrencyAmount(excessAmount)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
