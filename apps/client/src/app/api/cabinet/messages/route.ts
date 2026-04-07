import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leadId = new URL(request.url).searchParams.get("lead_id");
  if (!leadId) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

  // Verify this lead belongs to the user
  const { data: lead } = await serviceClient()
    .from("leads")
    .select("id, customer_data")
    .eq("id", leadId)
    .eq("customer_data->>email", user.email)
    .single();

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await serviceClient()
    .from("messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark unread manager messages as read
  const unread = (data || []).filter((m) => m.sender === "manager" && !m.read_at);
  if (unread.length) {
    await serviceClient()
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread.map((m) => m.id));
    unread.forEach((m) => { m.read_at = new Date().toISOString(); });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lead_id, body, attachments } = await request.json();
  if (!lead_id || (!body?.trim() && !attachments?.length)) {
    return NextResponse.json({ error: "lead_id and body or attachments required" }, { status: 400 });
  }

  // Verify ownership
  const { data: lead } = await serviceClient()
    .from("leads")
    .select("id")
    .eq("id", lead_id)
    .eq("customer_data->>email", user.email)
    .single();

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("messages")
    .insert({ lead_id, body: body?.trim() || "", sender: "client", sender_email: user.email, attachments: attachments || [] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
