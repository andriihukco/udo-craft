/**
 * Minimal compatible interfaces for the Lead and Message types used in cabinet/page.tsx.
 * These match the shapes inferred from the Supabase queries in that file.
 */
export interface OrderItem {
  id: string;
  custom_print_url?: string | null;
  [key: string]: unknown;
}

export interface Lead {
  id: string;
  order_items?: OrderItem[] | null;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  sender: "client" | "manager";
  attachments?: string[] | null | unknown;
  [key: string]: unknown;
}

/**
 * Aggregates all file URLs associated with an order from two sources:
 * 1. `order_items[].custom_print_url` — print files attached to each order item
 * 2. `messages[].attachments` — files sent by the client in chat messages
 *
 * Deduplicates URLs using a Set so each URL appears at most once.
 *
 * Requirements: 4.2, 4.3, 4.4
 */
export function aggregateOrderFiles(lead: Lead, messages: Message[]): string[] {
  const urls = new Set<string>();

  // Source 1: order_items.custom_print_url
  for (const item of lead.order_items ?? []) {
    if (item.custom_print_url) urls.add(item.custom_print_url);
  }

  // Source 2: messages.attachments where sender = 'client'
  for (const msg of messages) {
    if (
      msg.sender === "client" &&
      Array.isArray(msg.attachments) &&
      msg.attachments.length > 0
    ) {
      for (const url of msg.attachments) {
        urls.add(url);
      }
    }
  }

  return Array.from(urls);
}
