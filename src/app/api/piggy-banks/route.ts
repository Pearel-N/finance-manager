import { NextResponse } from "next/server";
import { prisma, getOrCreateSystemCategory } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { createPiggyBankSchema, updatePiggyBankSchema } from "@/utils/schema/piggy-bank";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get default bank first
    const defaultBank = await prisma.piggyBank.findFirst({
      where: {
        userId: user.id,
        isDefault: true,
      },
    });

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
            date: true,
            note: true,
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            currentBalance: true,
            transactions: {
              select: {
                id: true,
                amount: true,
                type: true,
              }
            }
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    // Get current month boundaries
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Calculate balance from transactions for each piggy bank
    const piggyBanksWithCalculatedBalance = piggyBanks.map(bank => {
      const calculatedBalance = bank.transactions.reduce((sum, transaction) => {
        return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
      }, 0);

      // Check if there's a transfer from default bank in current month
      const hasTransferFromDefaultThisMonth = defaultBank && bank.transactions.some(transaction => {
        const transactionDate = new Date(transaction.date);
        const isInCurrentMonth = transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
        const isIncome = transaction.type === 'income';
        const isFromDefaultBank = transaction.note?.includes(`from ${defaultBank.name}`) || false;
        
        return isInCurrentMonth && isIncome && isFromDefaultBank;
      });

      // Check if there's a transfer from parent bank in current month (for child piggy banks)
      const parentBank = bank.parent;
      const hasTransferFromParentThisMonth = parentBank && bank.transactions.some(transaction => {
        const transactionDate = new Date(transaction.date);
        const isInCurrentMonth = transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
        const isIncome = transaction.type === 'income';
        const isFromParentBank = transaction.note?.includes(`from ${parentBank.name}`) || false;
        
        return isInCurrentMonth && isIncome && isFromParentBank;
      });

      // Use manual balance if it differs from calculated (user has manually adjusted)
      const ownBalance = bank.currentBalance !== calculatedBalance ? bank.currentBalance : calculatedBalance;

      // Calculate children balances
      const childrenWithBalances = bank.children.map(child => {
        const childCalculatedBalance = child.transactions.reduce((sum, transaction) => {
          return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }, 0);
        // Use manual balance if it differs from calculated (user has manually adjusted)
        const childBalance = child.currentBalance !== childCalculatedBalance 
          ? child.currentBalance 
          : childCalculatedBalance;
        return {
          id: child.id,
          name: child.name,
          calculatedBalance: childBalance,
        };
      });

      const childrenTotal = childrenWithBalances.reduce((sum, child) => sum + child.calculatedBalance, 0);
      const isParent = bank.children.length > 0;
      const isChild = bank.parent !== null;

      // For parents, calculate total balance (own + children)
      const totalBalance = isParent ? ownBalance + childrenTotal : undefined;

      return {
        ...bank,
        calculatedBalance,
        balance: ownBalance,
        hasTransferFromDefaultThisMonth: hasTransferFromDefaultThisMonth || false,
        hasTransferFromParentThisMonth: hasTransferFromParentThisMonth || false,
        parent: bank.parent,
        children: childrenWithBalances,
        ownBalance: isParent ? ownBalance : undefined,
        childrenTotal: isParent ? childrenTotal : undefined,
        totalBalance,
        isParent,
        isChild,
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

    // Validate parentId if provided
    if (validatedData.parentId) {
      // Ensure parent exists and belongs to user
      const parent = await prisma.piggyBank.findFirst({
        where: {
          id: validatedData.parentId,
          userId: user.id,
        },
      });

      if (!parent) {
        return NextResponse.json({ error: "Parent piggy bank not found" }, { status: 404 });
      }

      // Ensure parent is not already a child (parents cannot be children)
      if (parent.parentId) {
        return NextResponse.json({ 
          error: "Cannot set a piggy bank that is already a child as a parent" 
        }, { status: 400 });
      }

      // Prevent self-referencing
      // This will be handled when we create, but good to check early
    }

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
        parentId: validatedData.parentId || null,
      },
    });

    // If initial balance > 0, create a transaction for it
    if (validatedData.currentBalance && validatedData.currentBalance > 0) {
      const systemCategoryId = await getOrCreateSystemCategory(user.id);
      
      await prisma.transaction.create({
        data: {
          amount: validatedData.currentBalance,
          type: 'income',
          note: `Initial balance deposit: ${validatedData.currentBalance}`,
          categoryId: systemCategoryId,
          userId: user.id,
          piggyBankId: newPiggyBank.id,
          date: new Date(),
          excludeFromDailySpent: true, // System transactions are excluded from daily spending
        },
      });
    }

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
      },
      include: {
        children: {
          select: {
            id: true,
          }
        }
      }
    });

    if (!existingPiggyBank) {
      return NextResponse.json({ error: "Piggy bank not found" }, { status: 404 });
    }

    // Validate parentId if provided or being updated
    if (validatedData.parentId !== undefined) {
      // If setting parentId to null, that's fine (removing parent relationship)
      if (validatedData.parentId) {
        // Ensure parent exists and belongs to user
        const parent = await prisma.piggyBank.findFirst({
          where: {
            id: validatedData.parentId,
            userId: user.id,
          },
        });

        if (!parent) {
          return NextResponse.json({ error: "Parent piggy bank not found" }, { status: 404 });
        }

        // Prevent self-referencing
        if (parent.id === id) {
          return NextResponse.json({ error: "Cannot set a piggy bank as its own parent" }, { status: 400 });
        }

        // Ensure parent is not already a child (parents cannot be children)
        if (parent.parentId) {
          return NextResponse.json({ 
            error: "Cannot set a piggy bank that is already a child as a parent" 
          }, { status: 400 });
        }

        // If this piggy bank has children, it cannot become a child (parents cannot be children)
        if (existingPiggyBank.children.length > 0) {
          return NextResponse.json({ 
            error: "Cannot set a piggy bank that has children as a child" 
          }, { status: 400 });
        }
      }
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

    // Check if currentBalance is being changed
    const oldBalance = existingPiggyBank.currentBalance;
    const newBalance = validatedData.currentBalance !== undefined ? validatedData.currentBalance : oldBalance;
    const balanceDifference = newBalance - oldBalance;

    const updatedPiggyBank = await prisma.piggyBank.update({
      where: { id },
      data: {
        ...validatedData,
        parentId: validatedData.parentId !== undefined ? validatedData.parentId : existingPiggyBank.parentId,
      },
    });

    // If balance changed, create an adjustment transaction
    if (balanceDifference !== 0) {
      const systemCategoryId = await getOrCreateSystemCategory(user.id);
      const transactionType = balanceDifference > 0 ? 'income' : 'expense';
      const absoluteDifference = Math.abs(balanceDifference);

      await prisma.transaction.create({
        data: {
          amount: absoluteDifference,
          type: transactionType,
          note: `Balance adjustment: Initial amount was ${oldBalance}, modified to ${newBalance}, difference is ${balanceDifference}`,
          categoryId: systemCategoryId,
          userId: user.id,
          piggyBankId: id,
          date: new Date(),
          excludeFromDailySpent: true, // System transactions are excluded from daily spending
        },
      });
    }
    
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
        transactions: true,
        children: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!existingPiggyBank) {
      return NextResponse.json({ error: "Piggy bank not found" }, { status: 404 });
    }

    // Prevent deletion if it has children
    if (existingPiggyBank.children.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete piggy bank with linked children. Please delete or unlink children first." 
      }, { status: 400 });
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
