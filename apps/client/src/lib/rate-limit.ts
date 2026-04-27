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

  // Try Upstash if env vars are set
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — optional peer dependency, only used when UPSTASH env vars are set
      const { Ratelimit } = await import("@upstash/ratelimit");
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — optional peer dependency
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, `${options.window}s`),
      });
      const result = await ratelimit.limit(key);
      return { success: result.success, remaining: result.remaining };
    } catch {
      // Fall through to in-memory on import or connection failure
    }
  }

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
