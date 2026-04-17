import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

// GET /api/cms?slug=... — fetch one or all content blocks
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const service = createServiceClient();

  if (slug) {
    const { data, error } = await service
      .from("cms_content")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ content: data ?? null });
  }

  const { data, error } = await service.from("cms_content").select("*").order("slug");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data });
}

// PUT /api/cms — upsert a content block
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, title, body: content, meta } = body;
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const service = createServiceClient();
  const { data, error } = await service
    .from("cms_content")
    .upsert({ slug, title, body: content, meta, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "slug" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data });
}
