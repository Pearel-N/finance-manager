import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
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
    }
  });
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transaction = await request.json();
  const newTransaction = await prisma.transaction.create({
    data: {
      ...transaction,
      amount: Number(transaction.amount),
      userId: user.id, // Always set from authenticated user, ignore any userId in payload
    },
  });
  return NextResponse.json(newTransaction);
}
