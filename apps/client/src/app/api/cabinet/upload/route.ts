import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "attachments";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const service = createServiceClient();

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    if (!files.length) return NextResponse.json({ results: [] });

    const results: { url: string }[] = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `messages/${crypto.randomUUID()}/${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await service.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: false });
      if (error) {
        console.error("[cabinet/upload] storage error:", JSON.stringify(error));
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      const { data } = service.storage.from(BUCKET).getPublicUrl(path);
      results.push({ url: data.publicUrl });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[cabinet/upload] unexpected error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
