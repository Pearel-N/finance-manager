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
