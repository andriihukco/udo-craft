import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_ai_quota")
    .select("attempts_used")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/ai/quota] DB error:", error);
    // Fail-open: don't block the user if quota can't be read
    return NextResponse.json({ attempts_used: 0, limit: 3 }, { status: 200 });
  }

  if (data === null) {
    // No row yet — user hasn't used any AI generations
    return NextResponse.json({ attempts_used: 0, limit: 3 }, { status: 200 });
  }

  return NextResponse.json({ attempts_used: data.attempts_used, limit: 3 }, { status: 200 });
}
