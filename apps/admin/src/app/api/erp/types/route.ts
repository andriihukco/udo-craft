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

const TypePayload = z.object({
  name: z.string().min(1),
  kind: MaterialKind.default("other"),
  unit: z.string().min(1).default("шт."),
  color: z.string().default("#64748b"),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data, error } = await service
    .from("erp_material_types")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = TypePayload.parse(await req.json());
    const service = createServiceClient();
    const { data, error } = await service
      .from("erp_material_types")
      .insert(parsed)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

