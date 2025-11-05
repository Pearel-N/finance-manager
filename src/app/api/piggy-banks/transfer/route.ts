import { NextResponse } from "next/server";
import { prisma, getOrCreateSystemCategory } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { transferMoneySchema } from "@/utils/schema/piggy-bank";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = transferMoneySchema.parse(body);

    // Verify the source piggy bank belongs to the user
    const sourcePiggyBank = await prisma.piggyBank.findFirst({
      where: {
        id: validatedData.fromPiggyBankId,
        userId: user.id
      }
    });

    if (!sourcePiggyBank) {
      return NextResponse.json({ error: "Source piggy bank not found" }, { status: 404 });
    }

    // Check if source has enough balance
    if (sourcePiggyBank.currentBalance < validatedData.amount) {
      return NextResponse.json({ 
        error: "Insufficient balance in source piggy bank" 
      }, { status: 400 });
    }

    // If transferring to another bank, verify destination
    if (validatedData.toPiggyBankId && !validatedData.isWithdrawal) {
      const destinationPiggyBank = await prisma.piggyBank.findFirst({
        where: {
          id: validatedData.toPiggyBankId,
          userId: user.id
        }
      });

      if (!destinationPiggyBank) {
        return NextResponse.json({ error: "Destination piggy bank not found" }, { status: 404 });
      }

      if (destinationPiggyBank.id === sourcePiggyBank.id) {
        return NextResponse.json({ 
          error: "Cannot transfer to the same piggy bank" 
        }, { status: 400 });
      }

      // Get system category for transactions
      const systemCategoryId = await getOrCreateSystemCategory(user.id);

      // Perform transfer between banks and create transactions
      await prisma.$transaction([
        prisma.piggyBank.update({
          where: { id: validatedData.fromPiggyBankId },
          data: { currentBalance: { decrement: validatedData.amount } }
        }),
        prisma.piggyBank.update({
          where: { id: validatedData.toPiggyBankId },
          data: { currentBalance: { increment: validatedData.amount } }
        }),
        // Source: expense transaction
        prisma.transaction.create({
          data: {
            amount: validatedData.amount,
            type: 'expense',
            note: `Transfer: ${validatedData.amount} to ${destinationPiggyBank.name}`,
            categoryId: systemCategoryId,
            userId: user.id,
            piggyBankId: validatedData.fromPiggyBankId,
            date: new Date(),
            excludeFromDailySpent: true, // System transactions are excluded from daily spending
          },
        }),
        // Destination: income transaction
        prisma.transaction.create({
          data: {
            amount: validatedData.amount,
            type: 'income',
            note: `Transfer: ${validatedData.amount} from ${sourcePiggyBank.name}`,
            categoryId: systemCategoryId,
            userId: user.id,
            piggyBankId: validatedData.toPiggyBankId,
            date: new Date(),
            excludeFromDailySpent: true, // System transactions are excluded from daily spending
          },
        }),
      ]);

      return NextResponse.json({ 
        success: true, 
        message: `Successfully transferred $${validatedData.amount} to ${destinationPiggyBank.name}` 
      });
    } else {
      // Perform withdrawal and create transaction
      const systemCategoryId = await getOrCreateSystemCategory(user.id);

      await prisma.$transaction([
        prisma.piggyBank.update({
          where: { id: validatedData.fromPiggyBankId },
          data: { currentBalance: { decrement: validatedData.amount } }
        }),
        // Withdrawal: expense transaction
        prisma.transaction.create({
          data: {
            amount: validatedData.amount,
            type: 'expense',
            note: `Withdrawal: ${validatedData.amount} from ${sourcePiggyBank.name}`,
            categoryId: systemCategoryId,
            userId: user.id,
            piggyBankId: validatedData.fromPiggyBankId,
            date: new Date(),
            excludeFromDailySpent: true, // System transactions are excluded from daily spending
          },
        }),
      ]);

      return NextResponse.json({ 
        success: true, 
        message: `Successfully withdrew $${validatedData.amount} from ${sourcePiggyBank.name}` 
      });
    }
  } catch (error) {
    console.error("POST /api/piggy-banks/transfer error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Validation error", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
