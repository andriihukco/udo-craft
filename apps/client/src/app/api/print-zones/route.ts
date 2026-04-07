import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const productId = new URL(request.url).searchParams.get("product_id");

    let query = supabase.from("print_zones").select("*");
    if (productId) query = query.eq("product_id", productId);

    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
