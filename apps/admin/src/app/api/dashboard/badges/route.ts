import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = getServiceClient();
    const [ordersCountRes, messagesCountRes] = await Promise.all([
      service
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      service
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("sender", "client"),
    ]);

    if (ordersCountRes.error || messagesCountRes.error) {
      return NextResponse.json({ error: ordersCountRes.error?.message || messagesCountRes.error?.message || "Database error" }, { status: 500 });
    }

    return NextResponse.json({
      orders: ordersCountRes.count ?? 0,
      messages: messagesCountRes.count ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
