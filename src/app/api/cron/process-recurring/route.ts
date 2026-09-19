import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

export async function GET(request: Request) {
  try {
    // Basic security check - in production, use Vercel's CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Find all recurring transactions that are due
    const dueRecurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        nextDate: {
          lte: now
        }
      },
      include: {
        category: true
      }
    });

    const results = [];

    for (const recurring of dueRecurringTransactions) {
      try {
        // Execute in a transaction to ensure both transaction creation and recurring update succeed
        const result = await prisma.$transaction(async (tx) => {
          // 1. Create the actual transaction
          const newTransaction = await tx.transaction.create({
            data: {
              amount: recurring.amount,
              type: recurring.type,
              note: recurring.note ? `${recurring.note} (Recurring)` : "Recurring Transaction",
              date: recurring.nextDate, // Use the scheduled date, not necessarily "now"
              categoryId: recurring.categoryId,
              userId: recurring.userId,
              piggyBankId: recurring.piggyBankId,
            }
          });

          // 2. Update piggy bank balance if applicable
          if (recurring.piggyBankId) {
            const balanceChange = recurring.type === 'income' 
              ? recurring.amount 
              : -recurring.amount;
            
            await tx.piggyBank.update({
              where: { id: recurring.piggyBankId },
              data: { currentBalance: { increment: balanceChange } }
            });
          }

          // 3. Calculate next date
          let nextDate = recurring.nextDate;
          switch (recurring.frequency) {
            case 'daily':
              nextDate = addDays(nextDate, 1);
              break;
            case 'weekly':
              nextDate = addWeeks(nextDate, 1);
              break;
            case 'monthly':
              nextDate = addMonths(nextDate, 1);
              break;
            case 'yearly':
              nextDate = addYears(nextDate, 1);
              break;
          }

          // 4. Update the recurring transaction setup
          await tx.recurringTransaction.update({
            where: { id: recurring.id },
            data: { nextDate }
          });

          return newTransaction;
        });
        
        results.push({ id: recurring.id, status: 'success', transactionId: result.id });
      } catch (err) {
        console.error(`Failed to process recurring transaction ${recurring.id}:`, err);
        results.push({ id: recurring.id, status: 'error', error: String(err) });
      }
    }

    return NextResponse.json({ processed: results.length, details: results });
  } catch (error) {
    console.error("Cron /api/cron/process-recurring error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
