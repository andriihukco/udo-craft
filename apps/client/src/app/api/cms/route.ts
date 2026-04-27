import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// SERVICE ROLE JUSTIFICATION:
// This is a public endpoint that serves CMS content (e.g. landing page copy) to
// unauthenticated visitors. There is no user session, so the session-based
// createClient() cannot be used. The service role key is required to read
// cms_content without an authenticated user context.
// Note: if RLS policies allow public SELECT on the cms_content table via the anon
// key, this could be replaced with the anon client.

// GET /api/cms?slug=... — public read of CMS content
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const service = createServiceClient();

  if (slug) {
    const { data, error } = await service
      .from("cms_content")
      .select("slug, title, body, meta")
      .eq("slug", slug)
      .single();
    if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ content: data ?? null });
  }

  const { data, error } = await service
    .from("cms_content")
    .select("slug, title, body, meta")
    .order("slug");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data });
}
