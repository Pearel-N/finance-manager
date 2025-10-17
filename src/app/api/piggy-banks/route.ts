import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { createPiggyBankSchema, updatePiggyBankSchema } from "@/utils/schema/piggy-bank";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const piggyBanks = await prisma.piggyBank.findMany({
      where: {
        userId: user.id
      },
      include: {
        transactions: {
          select: {
            id: true,
            amount: true,
            type: true,
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    // Calculate balance from transactions for each piggy bank
    const piggyBanksWithCalculatedBalance = piggyBanks.map(bank => {
      const calculatedBalance = bank.transactions.reduce((sum, transaction) => {
        return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
      }, 0);

      return {
        ...bank,
        calculatedBalance,
        // Use manual balance if it differs from calculated (user has manually adjusted)
        balance: bank.currentBalance !== calculatedBalance ? bank.currentBalance : calculatedBalance
      };
    });

    return NextResponse.json(piggyBanksWithCalculatedBalance);
  } catch (error) {
    console.error("GET /api/piggy-banks error:", error);
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

    const body = await request.json();
    const validatedData = createPiggyBankSchema.parse(body);

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.piggyBank.updateMany({
        where: {
          userId: user.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    const newPiggyBank = await prisma.piggyBank.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    return NextResponse.json(newPiggyBank);
  } catch (error) {
    console.error("POST /api/piggy-banks error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Validation error", details: error.message }, { status: 400 });
    }
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
    const validatedData = updatePiggyBankSchema.parse(updateData);
    
    if (!id) {
      return NextResponse.json({ error: "Piggy bank ID is required" }, { status: 400 });
    }
    
    // Verify the piggy bank belongs to the user
    const existingPiggyBank = await prisma.piggyBank.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    });

    if (!existingPiggyBank) {
      return NextResponse.json({ error: "Piggy bank not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.piggyBank.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      });
    }

    const updatedPiggyBank = await prisma.piggyBank.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json(updatedPiggyBank);
  } catch (error) {
    console.error("PATCH /api/piggy-banks error:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: "Validation error", details: error.message }, { status: 400 });
    }
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
      return NextResponse.json({ error: "Piggy bank ID is required" }, { status: 400 });
    }

    // Verify the piggy bank belongs to the user
    const existingPiggyBank = await prisma.piggyBank.findFirst({
      where: {
        id: id,
        userId: user.id
      },
      include: {
        transactions: true
      }
    });

    if (!existingPiggyBank) {
      return NextResponse.json({ error: "Piggy bank not found" }, { status: 404 });
    }

    // Prevent deletion if it has transactions
    if (existingPiggyBank.transactions.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete piggy bank with existing transactions" 
      }, { status: 400 });
    }

    await prisma.piggyBank.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/piggy-banks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
