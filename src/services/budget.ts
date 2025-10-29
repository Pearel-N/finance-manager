import axios from "axios";
import { prisma } from "@/lib/prisma";

export type BudgetData = {
  periodType: 'week' | 'day';
  available: number;
  periodStartDate: Date;
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

  // Calculate weeks and days remaining
  const weeksRemaining = getWeeksRemainingInMonth(now);
  const daysRemaining = getDaysRemainingInMonth(now);

  // Calculate weekly and daily budgets dynamically
  const weeklyAvailable = weeksRemaining > 0 ? defaultBalance / weeksRemaining : defaultBalance;
  const dailyAvailable = daysRemaining > 0 ? defaultBalance / daysRemaining : defaultBalance;

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
    },
  };
}

