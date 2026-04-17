import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Resend sends inbound emails as multipart/form-data POST
// Docs: https://resend.com/docs/dashboard/receiving/introduction

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Extract lead ID from the To address.
// Convention: lead-<8-char-id>@poudtio.resend.app  OR  <leadId>@poudtio.resend.app
function extractLeadId(toAddress: string): string | null {
  const match = toAddress.match(/lead[-_]?([a-f0-9-]{8,36})@/i);
  if (match) return match[1];
  // Also try bare UUID prefix before @
  const bare = toAddress.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})@/i);
  if (bare) return bare[1];
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Verify shared secret if configured
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (secret) {
      const provided = req.headers.get("x-resend-signature") ?? req.headers.get("authorization");
      if (!provided || !provided.includes(secret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const contentType = req.headers.get("content-type") ?? "";
    let from = "";
    let to = "";
    let subject = "";
    let text = "";
    let html = "";

    if (contentType.includes("application/json")) {
      // Resend webhook event format
      const body = await req.json();
      const data = body?.data ?? body;
      from    = data?.from ?? data?.email_id ?? "";
      to      = Array.isArray(data?.to) ? data.to[0] : (data?.to ?? "");
      subject = data?.subject ?? "";
      text    = data?.text ?? "";
      html    = data?.html ?? "";
    } else {
      // multipart/form-data (legacy inbound format)
      const form = await req.formData();
      from    = String(form.get("from")    ?? "");
      to      = String(form.get("to")      ?? "");
      subject = String(form.get("subject") ?? "");
      text    = String(form.get("text")    ?? "");
      html    = String(form.get("html")    ?? "");
    }

    if (!from) {
      return NextResponse.json({ error: "Missing from" }, { status: 400 });
    }

    // Extract sender email from "Name <email>" format
    const fromEmail = (from.match(/<(.+?)>/) ?? [])[1] ?? from.trim();
    const fromName  = (from.match(/^(.+?)\s*</) ?? [])[1]?.trim() ?? fromEmail;

    // Build message body — prefer plain text, strip quoted replies
    const rawBody = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    // Strip everything after common reply separators
    const messageBody = rawBody
      .split(/\n[-–—]{3,}|\nOn .+ wrote:|\n>+\s/)[0]
      .trim();

    if (!messageBody) {
      return NextResponse.json({ ok: true, skipped: "empty body" });
    }

    const db = service();
    let leadId: string | null = null;

    // 1. Try to find lead ID from To address
    leadId = extractLeadId(to);

    // 2. If not found, look up by sender email
    if (!leadId) {
      const { data: leads } = await db
        .from("leads")
        .select("id")
        .eq("customer_data->>email", fromEmail)
        .order("created_at", { ascending: false })
        .limit(1);
      leadId = leads?.[0]?.id ?? null;
    }

    // 3. If still not found, create a new lead from the email
    if (!leadId) {
      const { data: newLead } = await db
        .from("leads")
        .insert({
          status: "new",
          customer_data: {
            name:   fromName,
            email:  fromEmail,
            source: "email_inbound",
            topic:  "other",
          },
          total_amount_cents: 0,
        })
        .select("id")
        .single();
      leadId = newLead?.id ?? null;
    }

    if (!leadId) {
      return NextResponse.json({ error: "Could not resolve lead" }, { status: 500 });
    }

    // Insert message into thread
    const fullBody = subject
      ? `**${subject}**\n\n${messageBody}`
      : messageBody;

    const { error: msgError } = await db.from("messages").insert({
      lead_id:      leadId,
      body:         fullBody,
      sender:       "client",
      sender_email: fromEmail,
      channel:      "email",
      attachments:  [],
    });

    if (msgError) {
      console.error("messages insert error:", msgError);
      return NextResponse.json({ error: msgError.message }, { status: 500 });
    }

    // Bump lead updated_at so it surfaces in the kanban
    await db
      .from("leads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", leadId);

    console.log(`[email/inbound] routed from=${fromEmail} to lead=${leadId}`);
    return NextResponse.json({ ok: true, leadId });
  } catch (err) {
    console.error("[email/inbound] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
