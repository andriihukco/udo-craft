import { CreateLeadSchema } from "@udo-craft/shared";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const body = await request.json();
    const parsed = CreateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { status, customer_data, total_amount_cents } = parsed.data;
    const { order_items, initial_message } = body;
    // attachments is an extra field not covered by CreateLeadSchema — read from raw body
    const attachments: string[] = body.customer_data?.attachments ?? [];

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({ status, customer_data, total_amount_cents: total_amount_cents || 0 })
      .select()
      .single();

    if (leadError || !lead) {
      console.error("Lead insert error:", leadError);
      return NextResponse.json({ error: leadError?.message ?? "Insert failed" }, { status: 500 });
    }

    if (Array.isArray(order_items) && order_items.length > 0) {
      const items = order_items.map((item: {
        product_id: string;
        quantity: number;
        size: string;
        color: string;
        custom_print_url?: string | null;
      }) => ({ ...item, lead_id: lead.id }));

      const { error: itemsError } = await supabase.from("order_items").insert(items);

      if (itemsError) {
        console.error("Order items insert error:", itemsError);
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    // Insert initial message into messages table if provided
    if (initial_message?.trim() || attachments.length) {
      const messageBody = [
        initial_message?.trim(),
        attachments.length
          ? `Вкладення: ${attachments.join(", ")}`
          : null,
      ].filter(Boolean).join("\n\n");

      await supabase.from("messages").insert({
        lead_id: lead.id,
        body: messageBody,
        sender: "client",
        sender_email: customer_data.email,
        attachments,
      });
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
