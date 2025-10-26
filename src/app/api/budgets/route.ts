import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { calculateBudgets, createBudgetRecord } from "@/services/budget";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const budgets = await calculateBudgets(user.id);
    return NextResponse.json(budgets);
  } catch (error) {
    console.error("GET /api/budgets error:", error);
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

    const { periodType, periodStartDate, initialBudget } = await request.json();
    
    const budget = await createBudgetRecord(
      user.id,
      periodType,
      new Date(periodStartDate),
      initialBudget
    );

    return NextResponse.json(budget);
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

