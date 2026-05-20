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

const MaterialPatch = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().trim().nullable().optional(),
  type_id: z.string().uuid().nullable().optional(),
  kind: MaterialKind.optional(),
  unit: z.string().min(1).optional(),
  unit_cost_cents: z.coerce.number().int().min(0).optional(),
  stock_quantity: z.coerce.number().optional(),
  reserved_quantity: z.coerce.number().optional(),
  reorder_point: z.coerce.number().optional(),
  supplier: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().optional(),
});

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = MaterialPatch.parse(await req.json());
    const service = createServiceClient();
    const type = parsed.type_id
      ? await service.from("erp_material_types").select("kind, unit").eq("id", parsed.type_id).single()
      : null;
    const payload = {
      ...parsed,
      kind: type?.data?.kind ?? parsed.kind,
      unit: parsed.unit || type?.data?.unit,
    };
    Object.keys(payload).forEach((key) => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]);
    const { data, error } = await service
      .from("erp_materials")
      .update(payload)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { error } = await service.from("erp_materials").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
