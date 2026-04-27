import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Check if an email is already registered in Supabase Auth.
// Uses the service role client to query auth.users directly via RPC.
// Returns { exists: boolean } — never exposes user data.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Query auth.users via the admin API — most reliable approach
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      // Fail open — don't block registration if the check fails
      console.error("[check-email] listUsers error:", error);
      return NextResponse.json({ exists: false });
    }

    const exists = data.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    return NextResponse.json({ exists });
  } catch (err) {
    console.error("[check-email] error:", err);
    // Fail open
    return NextResponse.json({ exists: false });
  }
}
