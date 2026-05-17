import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import { rateLimit } from "./lib/rate-limit";

export async function middleware(request: NextRequest) {
  // 1. Rate Limit Public APIs
  if (request.nextUrl.pathname.startsWith("/api")) {
    const result = await rateLimit(request, { limit: 100, window: 60 });
    if (!result.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  // 2. Protect /cabinet routes
  if (request.nextUrl.pathname.startsWith("/cabinet")) {
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
