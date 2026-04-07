import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function auth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function GET() {
  // Public read — no auth needed, client uses this too
  const { data, error: dbErr } = await svc()
    .from("print_areas")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { user, error } = await auth();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error: dbErr } = await svc()
    .from("print_areas")
    .insert({
      name: body.name,
      label: body.label || body.name,
      width_mm: body.width_mm || 0,
      height_mm: body.height_mm || 0,
      price_add_cents: body.price_add_cents || 0,
      description: body.description || "",
      allowed_print_types: body.allowed_print_types || ["dtf"],
      pricing_grid: body.pricing_grid || [],
    })
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
