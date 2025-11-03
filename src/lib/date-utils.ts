import { format, isToday, isYesterday, isThisYear, parseISO } from 'date-fns';

export function formatTransactionDate(date: string | Date): string {
  const transactionDate = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(transactionDate)) {
    return 'Today';
  }
  
  if (isYesterday(transactionDate)) {
    return 'Yesterday';
  }
  
  if (isThisYear(transactionDate)) {
    return format(transactionDate, 'do MMM'); // e.g., "10th Oct"
  }
  
  return format(transactionDate, 'do MMM yyyy'); // e.g., "10th Oct 2023"
}

/**
 * Calculate the number of months between two dates, including the current month
 * @param startDate - The start date (typically today)
 * @param endDate - The end date (goal due date)
 * @returns The number of months remaining (minimum 1)
 */
export function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  
  const totalMonths = yearDiff * 12 + monthDiff;
  
  // Add 1 to include both the start and end months
  // For example: Nov 3 to Dec 31 should be 2 months (Nov + Dec)
  // Math.max ensures we return at least 1 month
  return Math.max(1, totalMonths + 1);
}
