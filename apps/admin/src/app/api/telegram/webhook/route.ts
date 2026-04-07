import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function db() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function tg(method: string, body: object) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(chatId: string, text: string, extra?: object) {
  return tg("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });
}

async function sendMenu(chatId: string) {
  return sendMessage(
    chatId,
    `👋 Привіт! Я бот <b>UDO Craft</b> — виробництво мерчу та корпоративного одягу.\n\nОберіть, що вас цікавить:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💬 Написати менеджеру", callback_data: "contact_manager" }],
          [{ text: "🛍 Зробити замовлення", url: process.env.NEXT_PUBLIC_CLIENT_URL || "https://u-do-craft.store" }],
          [{ text: "📦 Дізнатись про продукцію", callback_data: "about_products" }],
        ],
      },
    }
  );
}

export async function POST(request: NextRequest) {
  // Skip secret check in dev if env not set, but enforce in prod
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let update: Record<string, unknown>;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Handle callback_query (inline button taps)
  if (update.callback_query) {
    const cq = update.callback_query as {
      id: string;
      data: string;
      from: { id: number; first_name?: string; last_name?: string; username?: string };
      message: { chat: { id: number } };
    };
    const chatId = String(cq.message.chat.id);

    await tg("answerCallbackQuery", { callback_query_id: cq.id });

    if (cq.data === "contact_manager") {
      await sendMessage(
        chatId,
        `✍️ Напишіть ваше запитання або опишіть, що вам потрібно — менеджер відповість найближчим часом.\n\n<i>Ви також можете надіслати фото або файл.</i>`
      );
      // Mark this chat as "waiting for message" by upserting a lead
      await upsertLead(chatId, cq.from, "");
    } else if (cq.data === "about_products") {
      await sendMessage(
        chatId,
        `📦 <b>Наша продукція:</b>\n\n• Футболки, худі, поло\n• Кепки, шапки, рюкзаки\n• Корпоративний мерч під ключ\n• Нанесення: шовкодрук, вишивка, DTF\n\nДля замовлення або консультації — натисніть кнопку нижче 👇`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "💬 Написати менеджеру", callback_data: "contact_manager" }],
              [{ text: "🛍 Зробити замовлення", url: process.env.NEXT_PUBLIC_CLIENT_URL || "https://u-do-craft.store" }],
            ],
          },
        }
      );
    }

    return NextResponse.json({ ok: true });
  }

  // Handle regular messages
  const message = update.message as {
    chat: { id: number };
    from?: { id: number; first_name?: string; last_name?: string; username?: string };
    text?: string;
    caption?: string;
    photo?: { file_id: string }[];
  } | undefined;

  if (!message) return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);
  const text = message.text || message.caption || "";
  const from = message.from;

  // /start command — show main menu
  if (text === "/start" || text.startsWith("/start ")) {
    await sendMenu(chatId);
    return NextResponse.json({ ok: true });
  }

  // Any other message — treat as contact with manager
  const lead = await upsertLead(chatId, from, text);
  if (!lead) return NextResponse.json({ ok: true });

  // Handle photo
  let attachments: string[] = [];
  if (message.photo?.length) {
    const fileId = message.photo[message.photo.length - 1].file_id;
    const fileInfo = await tg("getFile", { file_id: fileId });
    if ((fileInfo as { result?: { file_path?: string } }).result?.file_path) {
      const token = process.env.TELEGRAM_BOT_TOKEN!;
      attachments = [`https://api.telegram.org/file/bot${token}/${(fileInfo as { result: { file_path: string } }).result.file_path}`];
    }
  }

  // Save message to DB
  const { error: msgErr } = await db().from("messages").insert({
    lead_id: lead.id,
    body: text,
    sender: "client",
    channel: "telegram",
    attachments,
  });

  if (msgErr) {
    console.error("Failed to insert message:", msgErr);
  }

  // Acknowledge receipt on first message only (no lead existed before)
  if (lead.isNew) {
    await sendMessage(
      chatId,
      `✅ Дякуємо! Ваше повідомлення отримано. Менеджер відповість найближчим часом.\n\n<i>Ви можете продовжувати писати — всі повідомлення ми бачимо.</i>`
    );
  }

  return NextResponse.json({ ok: true });
}

async function upsertLead(
  chatId: string,
  from: { id?: number; first_name?: string; last_name?: string; username?: string } | undefined,
  firstMessage: string
): Promise<{ id: string; isNew: boolean } | null> {
  const supabase = db();
  const name = [from?.first_name, from?.last_name].filter(Boolean).join(" ") || from?.username || "Telegram User";
  const username = from?.username ? `@${from.username}` : null;

  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("tg_chat_id", chatId)
    .maybeSingle();

  if (existing) return { id: existing.id, isNew: false };

  const { data: newLead, error } = await supabase
    .from("leads")
    .insert({
      status: "new",
      source: "telegram",
      tg_chat_id: chatId,
      total_amount_cents: 0,
      customer_data: {
        name,
        email: username
          ? `${username.replace("@", "")}@telegram.placeholder`
          : `tg_${chatId}@telegram.placeholder`,
        phone: null,
        company: null,
        message: firstMessage,
        tg_username: username,
      },
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create lead:", error);
    return null;
  }

  return { id: newLead.id, isNew: true };
}
