import { type NextRequest } from "next/server";

interface RateLimitOptions {
  limit: number;
  window: number; // seconds
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix ms timestamp
}

// Module-level in-memory store
const store = new Map<string, RateLimitEntry>();

export function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.ip ?? "unknown";
}

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const ip = extractIp(request);
  const key = `${ip}:${options.limit}:${options.window}`;



  // In-memory fallback
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.window * 1000 });
    return { success: true, remaining: options.limit - 1 };
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: options.limit - entry.count };
}
