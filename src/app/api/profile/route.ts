import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: {
        id: user.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
      }
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/profile error:", error);
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

    const body = await request.json();
    const { name, currency } = body;

    const updateData: { name?: string; currency?: string } = {};
    
    if (name !== undefined) {
      updateData.name = name === "" ? null : name.trim();
    }
    
    if (currency !== undefined) {
      // Validate currency code
      const validCurrencies = ['INR', 'USD', 'EUR'];
      if (!validCurrencies.includes(currency)) {
        return NextResponse.json({ error: "Invalid currency code" }, { status: 400 });
      }
      updateData.currency = currency;
    }

    const updatedProfile = await prisma.user.update({
      where: {
        id: user.id
      },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
      }
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
