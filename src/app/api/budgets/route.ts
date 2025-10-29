import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { calculateBudgets } from "@/services/budget";

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

