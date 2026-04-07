import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "attachments";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ urls: [] });
    }

    const urls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: false });

      if (error) {
        console.error("Storage upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
