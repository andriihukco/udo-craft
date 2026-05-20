import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const RecipeLinePayload = z.object({
  erp_material_id: z.string().uuid(),
  role: z.string().min(1).default("material"),
  quantity: z.coerce.number().positive(),
  waste_percent: z.coerce.number().min(0).default(0),
  production_step: z.string().trim().nullable().optional(),
  sort_order: z.coerce.number().int().default(0),
});

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user };
}

export async function GET(_req: NextRequest, { params }: { params: { productId: string } }) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data, error } = await service
    .from("product_recipe_lines")
    .select("*, material:erp_materials(*)")
    .eq("product_id", params.productId)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PUT(req: NextRequest, { params }: { params: { productId: string } }) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await req.json();
    const lines = z.array(RecipeLinePayload).parse(json.lines ?? json);
    const payload = lines.map((line, index) => ({
      ...line,
      product_id: params.productId,
      sort_order: line.sort_order || index,
    }));

    const service = createServiceClient();
    const { error: deleteError } = await service
      .from("product_recipe_lines")
      .delete()
      .eq("product_id", params.productId);

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    if (payload.length === 0) return NextResponse.json([]);

    const { data, error } = await service
      .from("product_recipe_lines")
      .insert(payload)
      .select("*, material:erp_materials(*)")
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
