import { type NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    console.log("🚀 MIDDLEWARE EXECUTING:", {
      url: request.url,
      pathname: request.nextUrl.pathname,
      method: request.method,
      timestamp: new Date().toISOString(),
    });

    const response = await updateSession(request);

    console.log("✅ MIDDLEWARE COMPLETED:", {
      url: request.url,
      status: response.status,
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error("❌ MIDDLEWARE ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
  ],
};