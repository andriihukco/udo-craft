import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const MaterialKind = z.enum([
  "garment",
  "fabric",
  "print_supply",
  "hardware",
  "thread",
  "packaging",
  "service",
  "labor",
  "other",
]);

const MaterialPayload = z.object({
  name: z.string().min(1),
  sku: z.string().trim().nullable().optional(),
  type_id: z.string().uuid().nullable().optional(),
  kind: MaterialKind.default("other"),
  unit: z.string().min(1).default("шт."),
  unit_cost_cents: z.coerce.number().int().min(0).default(0),
  stock_quantity: z.coerce.number().default(0),
  reserved_quantity: z.coerce.number().default(0),
  reorder_point: z.coerce.number().default(0),
  supplier: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user };
}

export async function GET() {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data, error } = await service
    .from("erp_materials")
    .select("*, type:erp_material_types(*)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    const fallback = await service
      .from("erp_materials")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    return NextResponse.json(fallback.data ?? []);
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = MaterialPayload.parse(await req.json());
    const service = createServiceClient();
    const type = parsed.type_id
      ? await service.from("erp_material_types").select("kind, unit").eq("id", parsed.type_id).single()
      : null;
    const payload = {
      ...parsed,
      kind: type?.data?.kind ?? parsed.kind,
      unit: parsed.unit || type?.data?.unit || "шт.",
    };
    const { data, error } = await service
      .from("erp_materials")
      .insert(payload)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
