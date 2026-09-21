import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashSmsToken } from "@/lib/sms-token";
import { parseSms, FALLBACK_CATEGORY } from "@/lib/sms-parser";

// Webhook for bank SMS forwarded from a phone.
// Auth is the user's SMS token, sent as:  Authorization: Bearer fm_sms_...
// Body:  { "text": "<the SMS>" }

const bodySchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  try {
    // 1. Who is this? Hash the token and look the hash up.
    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { smsTokenHash: hashSmsToken(token) },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Is the body what we expect?
    const body = bodySchema.safeParse(await request.json().catch(() => null));
    if (!body.success) {
      return NextResponse.json({ error: 'Body must be JSON like { "text": "..." }' }, { status: 400 });
    }

    // 3. Ask the AI. Pass the user's categories so it can pick one.
    const categories = await prisma.category.findMany({
      where: { userId: user.id, NOT: { name: "System" } },
      select: { id: true, name: true },
    });

    const parsed = await parseSms(body.data.text, categories.map((c) => c.name));

    if (!parsed.isTransaction || !parsed.type || !parsed.amount || parsed.amount <= 0) {
      return NextResponse.json({ status: "ignored", reason: "not a transaction" });
    }

    // 4. Work out the category, piggy bank and date.
    const categoryId =
      categories.find((c) => c.name === parsed.category)?.id ??
      (await getOrCreateFallbackCategory(user.id));

    const defaultBank = await prisma.piggyBank.findFirst({
      where: { userId: user.id, isDefault: true },
      select: { id: true },
    });

    const date = pickDate(parsed.date);
    const note = parsed.merchant ?? "Imported from SMS";

    // 5. Save the transaction and update the bank balance together, so one
    //    cannot happen without the other.
    const balanceChange = parsed.type === "income" ? parsed.amount : -parsed.amount;

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          amount: parsed.amount,
          type: parsed.type,
          date,
          note,
          categoryId,
          userId: user.id,
          piggyBankId: defaultBank?.id ?? null,
        },
        include: { category: { select: { name: true } } },
      }),
      ...(defaultBank
        ? [
            prisma.piggyBank.update({
              where: { id: defaultBank.id },
              data: { currentBalance: { increment: balanceChange } },
            }),
          ]
        : []),
    ]);

    return NextResponse.json(
      {
        status: "saved",
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          note: transaction.note,
          category: transaction.category.name,
          date: transaction.date,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sms error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getOrCreateFallbackCategory(userId: string): Promise<string> {
  const existing = await prisma.category.findFirst({
    where: { userId, name: FALLBACK_CATEGORY },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.category.create({
    data: { userId, name: FALLBACK_CATEGORY },
    select: { id: true },
  });
  return created.id;
}

// SMS are forwarded the moment they arrive, so for today's SMS the current
// time is the most accurate. Only use the SMS date when it is a different
// day (for example a delayed message). Dates are compared in Indian time.
function pickDate(smsDate: string | null): Date {
  const now = new Date();
  if (!smsDate || !/^\d{4}-\d{2}-\d{2}$/.test(smsDate)) return now;

  const todayInIndia = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  if (smsDate === todayInIndia) return now;

  const parsed = new Date(`${smsDate}T12:00:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? now : parsed;
}
