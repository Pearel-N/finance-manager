import axios from "axios";
import { prisma } from "@/lib/prisma";

export type BudgetData = {
  periodType: 'week' | 'day';
  available: number;
  periodStartDate: Date;
  spent?: number;
  initialBudget?: number; // Initial budget at start of day (for progress calculation)
};

export type BudgetsResponse = {
  weekly: BudgetData;
  daily: BudgetData;
};

// Get week start date (Monday)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

// Get number of weeks remaining in month (Monday-Sunday weeks)
const getWeeksRemainingInMonth = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0); // Last day of month
  const weekStart = getWeekStart(date);
  const lastDayWeekStart = getWeekStart(lastDay);
  
  // Calculate weeks from current week to end of month
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeks = Math.ceil((lastDayWeekStart.getTime() - weekStart.getTime()) / msPerWeek) + 1;
  
  return Math.max(1, weeks);
};

// Get number of days remaining in month
const getDaysRemainingInMonth = (date: Date): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  
  return lastDay - today + 1; // +1 to include today
};


export const getBudgets = async (): Promise<BudgetsResponse> => {
  const response = await axios.get("/api/budgets");
  return response.data;
};

// Server-side function to calculate budgets
export async function calculateBudgets(userId: string): Promise<BudgetsResponse> {
  // Get default piggy bank
  const defaultPiggyBank = await prisma.piggyBank.findFirst({
    where: {
      userId,
      isDefault: true,
    },
  });

  if (!defaultPiggyBank) {
    throw new Error("No default piggy bank found");
  }

  const defaultBalance = defaultPiggyBank.currentBalance;
  const now = new Date();

  // Get current period start dates
  const weekStart = getWeekStart(now);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Calculate today's date range
  // Use start of day in local timezone, but ensure we capture all transactions for today
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  // Get all today's transactions to calculate balance at start of day
  const todayTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      piggyBankId: defaultPiggyBank.id,
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    select: {
      amount: true,
      type: true,
      excludeFromDailySpent: true,
    },
  });

  // Calculate today's spending (expenses only, excluding transactions marked to exclude)
  // System transactions are excluded via excludeFromDailySpent flag
  const todaySpent = todayTransactions
    .filter(t => t.type === 'expense' && !t.excludeFromDailySpent)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // Calculate balance at start of today by subtracting today's transactions from current balance
  // This is used for calculating the "initial" daily budget that the progress bar shows
  // Exclude system transactions (excludeFromDailySpent) from this calculation so they don't affect initial budget
  const todayBalanceChange = todayTransactions
    .filter(t => !t.excludeFromDailySpent) // Exclude system transactions
    .reduce((sum, transaction) => {
      return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
    }, 0);
  const balanceAtStartOfDay = defaultBalance - todayBalanceChange;

  // Calculate weeks and days remaining
  const weeksRemaining = getWeeksRemainingInMonth(now);
  const daysRemaining = getDaysRemainingInMonth(now);

  // Calculate initial daily budget (at start of day) - used for progress bar
  const initialDailyBudget = daysRemaining > 0 ? balanceAtStartOfDay / daysRemaining : balanceAtStartOfDay;

  // Debug logging
  console.log('Budget calculation debug:', {
    todayTransactionsCount: todayTransactions.length,
    todayTransactions: todayTransactions,
    todaySpent,
    defaultBalance,
    balanceAtStartOfDay,
    daysRemaining,
    initialDailyBudget,
  });
  
  // Calculate available daily budget (current balance) - used for showing current available amount
  // This decreases when excluded transactions (like investments) reduce the bank balance
  const dailyAvailable = daysRemaining > 0 ? defaultBalance / daysRemaining : defaultBalance;
  
  // Weekly budget uses current balance
  const weeklyAvailable = weeksRemaining > 0 ? defaultBalance / weeksRemaining : defaultBalance;

  return {
    weekly: {
      periodType: 'week',
      available: weeklyAvailable,
      periodStartDate: weekStart,
    },
    daily: {
      periodType: 'day',
      available: dailyAvailable,
      periodStartDate: dayStart,
      spent: todaySpent,
      initialBudget: initialDailyBudget, // Budget at start of day for progress calculation
    },
  };
}

