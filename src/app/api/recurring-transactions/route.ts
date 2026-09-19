import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recurring = await prisma.recurringTransaction.findMany({
      where: {
        userId: user.id
      },
      include: {
        category: true,
        piggyBank: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return NextResponse.json(recurring);
  } catch (error) {
    console.error("GET /api/recurring-transactions error:", error);
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

    const data = await request.json();
    
    const newRecurring = await prisma.recurringTransaction.create({
      data: {
        ...data,
        amount: Number(data.amount),
        userId: user.id,
        nextDate: new Date(data.nextDate)
      },
    });

    return NextResponse.json(newRecurring);
  } catch (error) {
    console.error("POST /api/recurring-transactions error:", error);
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
      return NextResponse.json({ error: "Recurring Transaction ID is required" }, { status: 400 });
    }

    const updated = await prisma.recurringTransaction.update({
      where: { 
        id,
        userId: user.id // Security: Ensure it belongs to the user
      },
      data: {
        ...updateData,
        amount: updateData.amount ? Number(updateData.amount) : undefined,
        nextDate: updateData.nextDate ? new Date(updateData.nextDate) : undefined,
      },
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/recurring-transactions error:", error);
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
      return NextResponse.json({ error: "Recurring Transaction ID is required" }, { status: 400 });
    }

    await prisma.recurringTransaction.delete({
      where: { 
        id,
        userId: user.id
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/recurring-transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
