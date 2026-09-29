import axios from "axios";
import { prisma } from "@/lib/prisma";

export type DailyBudget = {
  /** What you could spend today, fixed when the day began. */
  budget: number;
  /** What you have spent today. */
  spent: number;
  /** budget - spent, never below zero. */
  remaining: number;
  /** True when spent is larger than budget. */
  isOverspent: boolean;
  periodStartDate: Date;
};

export type WeeklyBudget = {
  /** What you could spend this week, based on the balance right now. */
  budget: number;
  periodStartDate: Date;
};

export type BudgetsResponse = {
  weekly: WeeklyBudget;
  daily: DailyBudget;
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

/**
 * Works out what the user can spend today and this week.
 *
 * The idea in one line: take what is in the default piggy bank, spread it
 * evenly over the days left in the month, and subtract what has been spent
 * today.
 *
 * The daily budget is fixed for the day. It is worked out from the balance
 * as it was when the day began, NOT the balance right now, because the
 * balance right now already has today's spending taken out of it. Using the
 * current balance and then subtracting today's spending would count that
 * spending twice.
 */
export async function calculateBudgets(userId: string): Promise<BudgetsResponse> {
  const defaultPiggyBank = await prisma.piggyBank.findFirst({
    where: { userId, isDefault: true },
  });

  if (!defaultPiggyBank) {
    throw new Error("No default piggy bank found");
  }

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todaysTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      piggyBankId: defaultPiggyBank.id,
      date: { gte: dayStart, lte: dayEnd },
    },
    select: { amount: true, type: true, excludeFromDailySpent: true },
  });

  // Transactions marked "exclude from daily budget" (investments, transfers)
  // still move the balance, but they are not spending, so they are left out
  // of both sums here. That means they shrink today's budget rather than
  // showing up as money spent.
  const countsTowardsToday = todaysTransactions.filter((t) => !t.excludeFromDailySpent);

  const spentToday = countsTowardsToday
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netChangeToday = countsTowardsToday.reduce(
    (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
    0
  );

  // Undo today's transactions to get back to this morning's balance.
  const startOfDayBalance = Math.max(0, defaultPiggyBank.currentBalance - netChangeToday);
  const spendableNow = Math.max(0, defaultPiggyBank.currentBalance);

  const daysLeft = getDaysRemainingInMonth(now);
  const weeksLeft = getWeeksRemainingInMonth(now);

  const dailyBudget = startOfDayBalance / daysLeft;

  return {
    daily: {
      budget: dailyBudget,
      spent: spentToday,
      remaining: Math.max(0, dailyBudget - spentToday),
      isOverspent: spentToday > dailyBudget,
      periodStartDate: dayStart,
    },
    weekly: {
      budget: spendableNow / weeksLeft,
      periodStartDate: getWeekStart(now),
    },
  };
}
