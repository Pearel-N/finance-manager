import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { createBudgetRecord, calculateBudgets } from "@/services/budget";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id
      },
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transaction = await request.json();
    
    // Create transaction
    const newTransaction = await prisma.transaction.create({
      data: {
        ...transaction,
        amount: Number(transaction.amount),
        userId: user.id, // Always set from authenticated user, ignore any userId in payload
      },
    });

    // Update piggy bank balance if piggyBankId is provided
    if (transaction.piggyBankId) {
      const balanceChange = transaction.type === 'income' 
        ? Number(transaction.amount) 
        : -Number(transaction.amount);
      
      await prisma.piggyBank.update({
        where: { id: transaction.piggyBankId },
        data: { currentBalance: { increment: balanceChange } }
      });

      // Check if this is an expense from the default piggy bank
      const piggyBank = await prisma.piggyBank.findUnique({
        where: { id: transaction.piggyBankId },
      });

      if (piggyBank?.isDefault && transaction.type === 'expense') {
        // Create budget records if they don't exist
        const transactionDate = new Date(transaction.date || new Date());

        // Get period start dates
        const monthStart = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1);
        const dayStart = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
        
        // Calculate week start (Monday)
        const weekDay = transactionDate.getDay();
        const weekStartDay = transactionDate.getDate() - (weekDay === 0 ? 6 : weekDay - 1);
        const weekStart = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), weekStartDay);

        // Calculate budgets to get the amounts that were shown to user
        const budgets = await calculateBudgets(user.id);

        // Check if budget records exist and create if they don't
        const existingBudget = await prisma.budget.findFirst({
          where: {
            userId: user.id,
            periodType: 'month',
            periodStartDate: monthStart,
          },
        });

        if (!existingBudget) {
          await createBudgetRecord(user.id, 'month', monthStart, budgets.monthly.initialBudget ?? 0);
        }

        const existingWeekBudget = await prisma.budget.findFirst({
          where: {
            userId: user.id,
            periodType: 'week',
            periodStartDate: weekStart,
          },
        });

        if (!existingWeekBudget) {
          await createBudgetRecord(user.id, 'week', weekStart, budgets.weekly.initialBudget ?? 0);
        }

        const existingDayBudget = await prisma.budget.findFirst({
          where: {
            userId: user.id,
            periodType: 'day',
            periodStartDate: dayStart,
          },
        });

        if (!existingDayBudget) {
          await createBudgetRecord(user.id, 'day', dayStart, budgets.daily.initialBudget ?? 0);
        }
      }
    }

    return NextResponse.json(newTransaction);
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }
    
    // Get the existing transaction to calculate balance changes
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Calculate old balance change
    const oldBalanceChange = existingTransaction.type === 'income' 
      ? existingTransaction.amount 
      : -existingTransaction.amount;

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...updateData,
        amount: updateData.amount ? Number(updateData.amount) : undefined,
      },
      include: {
        category: true
      }
    });

    // Calculate new balance change
    const newBalanceChange = updatedTransaction.type === 'income' 
      ? updatedTransaction.amount 
      : -updatedTransaction.amount;

    // Update piggy bank balance if piggyBankId is provided
    if (updatedTransaction.piggyBankId) {
      const balanceDifference = newBalanceChange - oldBalanceChange;
      
      await prisma.piggyBank.update({
        where: { id: updatedTransaction.piggyBankId },
        data: { currentBalance: { increment: balanceDifference } }
      });
    }
    
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("PATCH /api/transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    // Get the transaction to reverse balance changes
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Reverse the balance change if piggyBankId exists
    if (existingTransaction.piggyBankId) {
      const balanceChange = existingTransaction.type === 'income' 
        ? -existingTransaction.amount 
        : existingTransaction.amount;
      
      await prisma.piggyBank.update({
        where: { id: existingTransaction.piggyBankId },
        data: { currentBalance: { increment: balanceChange } }
      });
    }

    await prisma.transaction.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
