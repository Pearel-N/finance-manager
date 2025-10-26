import axios from "axios";
import { prisma } from "@/lib/prisma";

export type BudgetData = {
  periodType: 'month' | 'week' | 'day';
  initialBudget: number | null; // null means not set yet
  spent: number;
  remaining: number;
  periodStartDate: Date;
};

export type BudgetsResponse = {
  monthly: BudgetData;
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

// Get month start date
const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
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
  const monthStart = getMonthStart(now);
  const weekStart = getWeekStart(now);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fetch existing budget records
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      periodStartDate: {
        in: [monthStart, weekStart, dayStart],
      },
    },
  });

  const monthlyBudget = budgets.find(b => b.periodStartDate.getTime() === monthStart.getTime());
  const weeklyBudget = budgets.find(b => b.periodStartDate.getTime() === weekStart.getTime());
  const dailyBudget = budgets.find(b => b.periodStartDate.getTime() === dayStart.getTime());

  // Calculate weeks and days remaining
  const weeksRemaining = getWeeksRemainingInMonth(now);
  const daysRemaining = getDaysRemainingInMonth(now);

  // Get expense transactions for each period
  const monthExpenses = await getExpensesForPeriod(userId, 'month', monthStart);
  const weekExpenses = await getExpensesForPeriod(userId, 'week', weekStart);
  const dayExpenses = await getExpensesForPeriod(userId, 'day', dayStart);

  // Calculate monthly budget
  const monthlyInitial = monthlyBudget?.initialBudget ?? defaultBalance;
  const monthlySpent = monthExpenses;
  const monthlyRemaining = monthlyInitial - monthlySpent;

  // Calculate weekly budget
  const weeklyInitial = weeklyBudget?.initialBudget ?? (defaultBalance / weeksRemaining);
  const weeklySpent = weekExpenses;
  const weeklyRemaining = weeklyInitial - weeklySpent;

  // Calculate daily budget
  const dailyInitial = dailyBudget?.initialBudget ?? (defaultBalance / daysRemaining);
  const dailySpent = dayExpenses;
  const dailyRemaining = dailyInitial - dailySpent;

  return {
    monthly: {
      periodType: 'month',
      initialBudget: monthlyInitial,
      spent: monthlySpent,
      remaining: monthlyRemaining,
      periodStartDate: monthStart,
    },
    weekly: {
      periodType: 'week',
      initialBudget: weeklyInitial,
      spent: weeklySpent,
      remaining: weeklyRemaining,
      periodStartDate: weekStart,
    },
    daily: {
      periodType: 'day',
      initialBudget: dailyInitial,
      spent: dailySpent,
      remaining: dailyRemaining,
      periodStartDate: dayStart,
    },
  };
}

async function getExpensesForPeriod(
  userId: string,
  periodType: 'month' | 'week' | 'day',
  periodStart: Date
): Promise<number> {
  const endDate = new Date(periodStart);
  
  if (periodType === 'month') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (periodType === 'week') {
    endDate.setDate(endDate.getDate() + 7);
  } else if (periodType === 'day') {
    endDate.setDate(endDate.getDate() + 1);
  }

  // Get default piggy bank
  const defaultPiggyBank = await prisma.piggyBank.findFirst({
    where: {
      userId,
      isDefault: true,
    },
  });

  if (!defaultPiggyBank) {
    return 0;
  }

  // Get all expense transactions from default piggy bank in this period
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      piggyBankId: defaultPiggyBank.id,
      type: 'expense',
      date: {
        gte: periodStart,
        lt: endDate,
      },
    },
  });

  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// Create budget record
export async function createBudgetRecord(
  userId: string,
  periodType: 'month' | 'week' | 'day',
  periodStartDate: Date,
  initialBudget: number
) {
  return await prisma.budget.upsert({
    where: {
      userId_periodType_periodStartDate: {
        userId,
        periodType,
        periodStartDate,
      },
    },
    create: {
      userId,
      periodType,
      periodStartDate,
      initialBudget,
    },
    update: {
      // Don't update, records are immutable
    },
  });
}

