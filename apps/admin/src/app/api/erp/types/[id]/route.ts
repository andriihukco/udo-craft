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

const TypePatch = z.object({
  name: z.string().min(1).optional(),
  kind: MaterialKind.optional(),
  unit: z.string().min(1).optional(),
  color: z.string().optional(),
  sort_order: z.coerce.number().int().optional(),
  is_active: z.boolean().optional(),
});

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = TypePatch.parse(await req.json());
    const service = createServiceClient();
    const { data, error } = await service
      .from("erp_material_types")
      .update(parsed)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { error } = await service.from("erp_material_types").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

