import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function requireErpUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { user: null, service: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user: data.user, service: createServiceClient(), error: null };
}

export function apiError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}

export function moneyToCents(value: unknown) {
  return Math.round(Number(value || 0) * 100);
}
