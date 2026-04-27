import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import * as Sentry from "@sentry/nextjs";

// SERVICE ROLE JUSTIFICATION:
// The increment_ai_quota RPC performs an atomic upsert (INSERT ... ON CONFLICT DO UPDATE).
// RLS policies on user_ai_quota allow INSERT and UPDATE for the row owner, but the
// upsert path requires the service role to execute the Postgres function atomically
// without RLS interference. The session-based client is still used to authenticate
// the user — the service role client is only used for the RPC call itself.

export async function POST() {
  // 1. Authenticate via session-based client
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Call the atomic upsert RPC via service-role client (bypasses RLS)
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase.rpc("increment_ai_quota", {
    p_user_id: user.id,
  });

  if (error) {
    Sentry.captureException(error, {
      extra: { userId: user.id, rpc: "increment_ai_quota" },
    });
    console.error("[POST /api/ai/quota/increment] RPC error:", error);
    return NextResponse.json({ error: "Failed to increment quota" }, { status: 500 });
  }

  return NextResponse.json({ attempts_used: data, limit: 3 }, { status: 200 });
}
