import { NextResponse } from "next/server";
import { apiError, requireErpUser } from "../../../_lib";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { service, error } = await requireErpUser();
  if (error) return error;
  try {
    const apiKey = process.env.NOVA_POSHTA_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "NOVA_POSHTA_API_KEY is not configured" }, { status: 400 });

    const { data: lead, error: leadError } = await service!
      .from("leads")
      .select("id, customer_data, total_amount_cents, nova_poshta_data")
      .eq("id", params.id)
      .single();
    if (leadError) return apiError(leadError);

    const draft = {
      status: "draft_ready",
      provider: "nova_poshta",
      recipient: lead.customer_data,
      cod_cents: lead.total_amount_cents,
      created_at: new Date().toISOString(),
      message: "Дані підготовлені. Для бойового створення ТТН потрібно додати sender/cargo налаштування бізнесу.",
    };

    const { data, error: updateError } = await service!
      .from("leads")
      .update({ nova_poshta_data: { ...(lead.nova_poshta_data ?? {}), waybill: draft } })
      .eq("id", params.id)
      .select("nova_poshta_data")
      .single();
    if (updateError) return apiError(updateError);
    return NextResponse.json(data.nova_poshta_data);
  } catch (err) {
    return apiError(err, 400);
  }
}
