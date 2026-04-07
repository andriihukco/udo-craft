import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function tg(token: string, method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// GET /api/telegram/setup — registers webhook + bot commands
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) return NextResponse.json({ error: "Missing TELEGRAM_BOT_TOKEN" }, { status: 500 });
  if (!appUrl) return NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_URL" }, { status: 500 });

  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  // Register webhook
  const webhookResult = await tg(token, "setWebhook", {
    url: webhookUrl,
    ...(secret ? { secret_token: secret } : {}),
    allowed_updates: ["message", "callback_query"],
  });

  // Set bot commands
  const commandsResult = await tg(token, "setMyCommands", {
    commands: [{ command: "start", description: "Головне меню" }],
  });

  // Get current webhook info for confirmation
  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then(r => r.json());

  return NextResponse.json({ webhookResult, commandsResult, webhookInfo: info.result });
}
