import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// GET /api/telegram/debug — checks DB columns and recent leads
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Try inserting a test lead with source/tg_chat_id to see if columns exist
  const testChatId = `debug_${Date.now()}`;
  const { data: testLead, error: insertError } = await db
    .from("leads")
    .insert({
      status: "new",
      source: "telegram",
      tg_chat_id: testChatId,
      total_amount_cents: 0,
      customer_data: { name: "Debug Test", email: "debug@test.com", message: "debug" },
    })
    .select("id, source, tg_chat_id")
    .single();

  // Clean up test lead
  if (testLead) {
    await db.from("leads").delete().eq("id", testLead.id);
  }

  // Check recent telegram leads
  const { data: tgLeads } = await db
    .from("leads")
    .select("id, source, tg_chat_id, created_at, customer_data")
    .eq("source", "telegram")
    .order("created_at", { ascending: false })
    .limit(5);

  // Check recent messages with channel=telegram
  const { data: tgMessages } = await db
    .from("messages")
    .select("id, lead_id, body, channel, created_at")
    .eq("channel", "telegram")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    columnTest: insertError ? { ok: false, error: insertError.message } : { ok: true },
    recentTelegramLeads: tgLeads || [],
    recentTelegramMessages: tgMessages || [],
  });
}
