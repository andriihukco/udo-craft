import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getOrCreateId(key: string): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getOrCreateSession(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "udo_session";
  const expKey = "udo_session_exp";
  const now = Date.now();
  const exp = parseInt(sessionStorage.getItem(expKey) || "0");

  if (now > exp) {
    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    sessionStorage.setItem(expKey, String(now + 30 * 60 * 1000)); // 30 min
    return id;
  }
  return sessionStorage.getItem(key) || crypto.randomUUID();
}

type EventType =
  | "pageview"
  | "session_start"
  | "form_submit"
  | "customize_start"
  | "customize_complete";

export async function track(
  event_type: EventType,
  metadata?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  const visitor_id = getOrCreateId("udo_visitor");
  const session_id = getOrCreateSession();

  try {
    await supabase.from("site_events").insert({
      event_type,
      session_id,
      visitor_id,
      page: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      metadata: metadata || null,
    });
  } catch {
    // Analytics failures should never block the user flow
  }
}
