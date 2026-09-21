import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { generateSmsToken } from "@/lib/sms-token";

// Create a new SMS token, replacing any existing one. The plain token is
// returned in this response only; the database keeps just its hash.
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, hash } = generateSmsToken();

    await prisma.user.update({
      where: { id: user.id },
      data: { smsTokenHash: hash },
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("POST /api/profile/sms-token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Revoke the token, so SMS sent with it are rejected.
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { smsTokenHash: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/profile/sms-token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
