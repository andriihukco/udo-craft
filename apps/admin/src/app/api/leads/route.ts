import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { CreateLeadSchema } from "@udo-craft/shared";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await getServiceClient()
      .from("leads")
      .select("*, order_items!order_items_lead_id_fkey(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("API error:", message);
    return NextResponse.json({ error: "Internal server error", detail: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();

    const parsed = CreateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { status, customer_data, total_amount_cents } = parsed.data;
    const { order_items, tags } = body;

    const service = getServiceClient();

    const { data: lead, error } = await service
      .from("leads")
      .insert({ status, customer_data, total_amount_cents: total_amount_cents || 0, ...(Array.isArray(tags) && tags.length > 0 ? { tags } : {}) })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (Array.isArray(order_items) && order_items.length > 0) {
      const rows = order_items.map((item: Record<string, unknown>) => ({
        ...item,
        lead_id: lead.id,
      }));
      const { error: itemsError } = await service.from("order_items").insert(rows);
      if (itemsError) {
        console.error("order_items insert error:", itemsError);
        return NextResponse.json({ error: `Failed to save order items: ${itemsError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
