import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const transaction = await request.json();
  const newTransaction = await prisma.transaction.create({
    data: {
      ...transaction,
      amount: Number(transaction.amount),
    },
  });
  return NextResponse.json(newTransaction);
}
