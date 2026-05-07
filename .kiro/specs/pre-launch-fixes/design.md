# Design Document: Pre-Launch Fixes

## Overview

This document describes the technical design for all pre-launch and first-sprint fixes identified in `PRE_LAUNCH_AUDIT.md`. The work spans two apps in the monorepo — `apps/client` (customer-facing store) and `apps/admin` (internal dashboard) — plus the `packages/shared` library.

The fixes are grouped into five concern areas:

1. **Security hardening** — middleware auth, rate limiting, upload validation, service-role audit, Telegram webhook verification, honeypot
2. **SEO and discoverability** — Open Graph metadata, robots.txt, sitemap.xml, JSON-LD, admin exclusion
3. **Resilience and UX** — error boundaries, loading skeletons, 404 pages, hero video fallback
4. **Performance** — replace raw `<img>` with `next/image`, decompose monolithic page, replace cart polling with events
5. **Data integrity** — store unit price and print cost per order item, RLS migrations

No new external services are introduced beyond the optional Upstash Redis dependency for rate limiting. All changes are backward-compatible with existing data.

---

## Architecture

The monorepo structure is unchanged. Changes are additive (new files) or surgical edits to existing files.

```
udo-craft/
├── apps/
│   ├── client/
│   │   └── src/
│   │       ├── middleware.ts                    ← NEW: cabinet route protection
│   │       ├── app/
│   │       │   ├── layout.tsx                   ← EDIT: OG/Twitter metadata + JSON-LD
│   │       │   ├── robots.ts                    ← NEW: allow all crawlers + sitemap ref
│   │       │   ├── sitemap.ts                   ← NEW: static URL list
│   │       │   ├── not-found.tsx                ← NEW: global 404
│   │       │   ├── error.tsx                    ← NEW: global error boundary
│   │       │   ├── page.tsx                     ← EDIT: img→Image, extract sections, poster
│   │       │   ├── _sections/                   ← NEW: extracted static section components
│   │       │   │   ├── HeroSection.tsx
│   │       │   │   ├── ServicesSection.tsx
│   │       │   │   ├── StatsSection.tsx
│   │       │   │   └── PopupSection.tsx
│   │       │   ├── order/
│   │       │   │   ├── loading.tsx              ← NEW: skeleton
│   │       │   │   └── error.tsx                ← NEW: segment error boundary
│   │       │   └── cabinet/
│   │       │       ├── loading.tsx              ← NEW: skeleton
│   │       │       └── error.tsx                ← NEW: segment error boundary
│   │       ├── hooks/
│   │       │   └── useCart.ts                   ← NEW: extracted cart hook (BroadcastChannel)
│   │       ├── lib/
│   │       │   └── rate-limit.ts                ← NEW: in-memory + Upstash rate limiter
│   │       └── api/
│   │           ├── leads/route.ts               ← EDIT: rate limit + honeypot check
│   │           └── upload/route.ts              ← EDIT: rate limit + MIME/size validation
│   └── admin/
│       └── src/
│           └── app/
│               └── robots.ts                    ← NEW: disallow all
├── packages/
│   └── shared/
│       └── index.ts                             ← EDIT: add unit_price_cents/print_cost_cents to OrderItemSchema
└── supabase/
    └── migrations/
        ├── 20240101000000_rls_policies.sql      ← NEW: RLS policy definitions
        └── README.md                            ← NEW: migration instructions
```

### Key Design Decisions

**Rate limiter as a shared utility** — `apps/client/src/lib/rate-limit.ts` exports a single `rateLimit(req, options)` function called at the top of each protected route handler. This keeps the logic in one place and makes it easy to swap the backend (in-memory ↔ Upstash) via env vars.

**Middleware mirrors admin pattern** — The client `middleware.ts` is modelled directly on `apps/admin/src/middleware.ts` + `apps/admin/src/lib/supabase/middleware.ts`. A new `apps/client/src/lib/supabase/middleware.ts` file implements the same `updateSession` pattern, adapted for client-side cabinet routes.

**Section extraction is additive** — Static sections are moved to `_sections/` as Server Components. The root `page.tsx` becomes a thin orchestrator that imports them. No existing component APIs change.

**`useCart` replaces polling** — The hook reads from `sessionStorage`, subscribes to `window.storage` events for cross-tab sync, and uses a `BroadcastChannel("udo-cart")` for same-tab sync. The 2-second `setInterval` is removed entirely.

---

## Components and Interfaces

### 1. Client Middleware (`apps/client/src/middleware.ts`)

```typescript
// apps/client/src/lib/supabase/middleware.ts
export async function updateSession(request: NextRequest): Promise<NextResponse>

// apps/client/src/middleware.ts
export async function middleware(request: NextRequest): Promise<NextResponse>
export const config = { matcher: [...] }
```

The matcher covers `/cabinet` and `/cabinet/*` while excluding `_next/static`, `_next/image`, `favicon.ico`, and common static extensions (`.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`). API routes under `/cabinet/api` are also excluded so that the cabinet API routes are protected by their own auth checks (which already call `supabase.auth.getUser()`).

Redirect logic:
- No session → redirect to `/cabinet/login`
- Has session + path is `/cabinet/login` → redirect to `/cabinet`
- Otherwise → pass through with refreshed session cookie

### 2. Rate Limiter (`apps/client/src/lib/rate-limit.ts`)

```typescript
interface RateLimitOptions {
  limit: number;       // max requests
  window: number;      // window in seconds
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult>
```

**IP extraction** — reads `x-forwarded-for` header (first IP in the comma-separated list), falls back to `request.ip` (Vercel edge), then `"unknown"`.

**In-memory backend** — a module-level `Map<string, { count: number; resetAt: number }>`. Entries expire when `Date.now() > resetAt`. This is the default when Upstash env vars are absent.

**Upstash backend** — when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, uses `@upstash/ratelimit` with `Ratelimit.slidingWindow(limit, `${window}s`)`. The Upstash package is a peer dependency — the code dynamically imports it and falls back to in-memory if the import fails.

### 3. Upload Validation (edit to existing routes)

Both `/api/upload/route.ts` and `/api/cabinet/upload/route.ts` gain a validation step before any buffer reads:

```typescript
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif",
  "image/webp", "image/svg+xml", "application/pdf",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Called before arrayBuffer()
function validateFile(file: File): { valid: true } | { valid: false; error: string; status: 400 }
```

### 4. SEO Metadata

**`apps/client/src/app/layout.tsx`** — the existing `metadata` export is extended:

```typescript
export const metadata: Metadata = {
  title: "U:DO CRAFT — Корпоративний мерч, який носять",
  description: "...",
  metadataBase: new URL("https://u-do-craft.store"),
  openGraph: {
    title: "...", description: "...", url: "https://u-do-craft.store",
    siteName: "U:DO CRAFT", locale: "uk_UA", type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "U:DO CRAFT" }],
  },
  twitter: {
    card: "summary_large_image", title: "...", description: "...",
    images: ["/og-image.jpg"],
  },
};
```

A JSON-LD `<script>` is added inside `<head>` via a `<Script>` component or inline `dangerouslySetInnerHTML`:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "U:DO CRAFT",
  "url": "https://u-do-craft.store",
  "logo": "https://u-do-craft.store/logo.png"
}
```

**`apps/client/src/app/robots.ts`**:
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://u-do-craft.store/sitemap.xml",
  };
}
```

**`apps/client/src/app/sitemap.ts`**:
```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://u-do-craft.store/",       lastModified: new Date(), changeFrequency: "weekly",  priority: 1 },
    { url: "https://u-do-craft.store/order",  lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: "https://u-do-craft.store/cabinet",lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
```

**`apps/admin/src/app/robots.ts`**:
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
    host: "https://admin.u-do-craft.store",
  };
}
```

### 5. Error Boundaries

All `error.tsx` files follow the same pattern:

```typescript
"use client";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);
  return (/* Ukrainian recovery UI */);
}
```

The global `apps/client/src/app/error.tsx` renders a full-page recovery UI with a "Спробувати знову" button. Segment-level boundaries (`order/error.tsx`, `cabinet/error.tsx`) render inline recovery UIs with a link back to `/`.

### 6. Loading Skeletons

`order/loading.tsx` — renders a grid of 4–8 skeleton product cards using `animate-pulse` Tailwind classes, matching the approximate layout of the order page product grid.

`cabinet/loading.tsx` — renders a two-column skeleton (sidebar list + detail panel) matching the cabinet page layout.

### 7. Not-Found Pages

`apps/client/src/app/not-found.tsx` — global 404 in Ukrainian with a link to `/`.

`apps/client/src/app/products/[slug]/not-found.tsx` — product-specific 404 with a link to `/order`.

### 8. Hero Video Fallback

The `<video>` element in `page.tsx` gains:
- `poster="/hero-poster.jpg"` attribute
- The parent `<section>` gains `style={{ backgroundImage: "url('/hero-poster.jpg')" }}` as a CSS fallback

The hero text content (headline, subheadline, CTA buttons) is already rendered as DOM elements overlaid on the video — they remain visible regardless of video load state. The current `opacity-0` class on the video (removed via `onCanPlay`) means the poster/background is visible until the video loads.

### 9. `next/image` Migration

Raw `<img>` tags in `page.tsx` (product images in the carousel/grid) and `ProductCardDetailed.tsx` are replaced with `<Image>` from `next/image`. The Supabase storage hostname (`hsyxyzmnhjybklvlaelw.supabase.co`) is already in `next.config.mjs` `remotePatterns`. Unsplash images used in `POPUP_STEPS` are added to `remotePatterns`:

```javascript
{ protocol: "https", hostname: "images.unsplash.com" }
```

For images inside positioned containers, `fill` + `object-cover` is used. For images with known dimensions, explicit `width`/`height` props are supplied.

Fabric.js canvas `<img>` elements in `ProductCanvas.tsx` are explicitly excluded — they are not rendered to the DOM and must remain raw `<img>` for Fabric.js compatibility.

### 10. Landing Page Decomposition

Static sections extracted to `apps/client/src/app/_sections/`:

| Component | Type | Reason |
|---|---|---|
| `HeroSection.tsx` | Server Component | Static text + video element; no state |
| `ServicesSection.tsx` | Server Component | Static content cards |
| `StatsSection.tsx` | Client Component | Uses `CountUp` animation (requires `useEffect`) |
| `PopupSection.tsx` | Server Component | Static layout; `PopupStepCarousel` extracted separately as Client Component |

The root `page.tsx` retains `"use client"` because it manages nav state, cart state, and auth state. The extracted Server Components are imported directly — Next.js handles the server/client boundary automatically.

### 11. `useCart` Hook

```typescript
// apps/client/src/hooks/useCart.ts
export interface CartItem {
  productName: string;
  quantity: number;
  size: string;
  unitPriceCents: number;
  printCostCents: number;
  mockupsMap?: Record<string, string>;
  mockupDataUrl?: string;
  mockupBackDataUrl?: string;
  productImage?: string;
}

export interface UseCartReturn {
  cart: CartItem[];
  cartCount: number;
  totalCents: number;
}

export function useCart(): UseCartReturn
```

Implementation:
1. `readCart()` reads and parses `sessionStorage.getItem("client-order-draft")`
2. `useEffect` registers `window.addEventListener("storage", readCart)` for cross-tab sync
3. `useEffect` creates `new BroadcastChannel("udo-cart")`, sets `channel.onmessage = () => readCart()`
4. Cleanup closes the channel and removes the storage listener
5. No `setInterval` — polling is removed entirely

### 12. Honeypot

`ContactForm.tsx` gains a hidden field:

```tsx
<input
  name="website"
  type="text"
  tabIndex={-1}
  aria-hidden="true"
  autoComplete="off"
  style={{ position: "absolute", left: "-9999px", opacity: 0 }}
  value={honeypot}
  onChange={(e) => setHoneypot(e.target.value)}
/>
```

The field value is included in the submission payload as `customer_data.website`. The `/api/leads` handler checks this field before any DB operations:

```typescript
if (parsed.data.customer_data.website) {
  return NextResponse.json({ id: "bot-rejected" }, { status: 200 });
}
```

### 13. Telegram Webhook Signature Verification

The existing partial check in `apps/admin/src/app/api/telegram/webhook/route.ts` is strengthened:

```typescript
import { timingSafeEqual } from "crypto"; // Node.js built-in

const secret = request.headers.get("x-telegram-bot-api-secret-token");
const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (expectedSecret) {
  if (!secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const secretBuf   = Buffer.from(secret,         "utf8");
  const expectedBuf = Buffer.from(expectedSecret, "utf8");
  // Pad to equal length before comparison to avoid length-based timing leak
  const maxLen = Math.max(secretBuf.length, expectedBuf.length);
  const a = Buffer.alloc(maxLen); secretBuf.copy(a);
  const b = Buffer.alloc(maxLen); expectedBuf.copy(b);
  if (!timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
} else {
  console.warn("[telegram/webhook] TELEGRAM_WEBHOOK_SECRET is not set — skipping signature check");
}
```

### 14. Order Item Price Storage

**Schema change** — `packages/shared/index.ts` `OrderItemSchema` gains two optional fields:

```typescript
export const OrderItemSchema = z.object({
  // ... existing fields ...
  unit_price_cents:  z.number().int().nonnegative().optional(),
  print_cost_cents:  z.number().int().nonnegative().optional(),
});
```

**API change** — `/api/leads/route.ts` maps these fields when inserting `order_items`:

```typescript
const items = order_items.map((item) => ({
  ...item,
  lead_id: lead.id,
  unit_price_cents:  item.unit_price_cents  ?? null,
  print_cost_cents:  item.print_cost_cents  ?? null,
}));
```

**Invoice change** — `cabinet/page.tsx` `handleDownloadInvoice` uses stored values with fallback:

```typescript
unitPriceCents: item.unit_price_cents
  ?? Math.round(selectedLead.total_amount_cents / Math.max(1, totalQty)),
```

### 15. RLS Migrations

A new `supabase/migrations/` directory at the repo root contains:

- `20240101000000_rls_policies.sql` — `CREATE POLICY` statements for all tables listed in Requirement 10
- `README.md` — instructions for applying migrations with the Supabase CLI

---

## Data Models

### Modified: `OrderItemSchema` (packages/shared)

```typescript
// Before
z.object({
  id, lead_id, product_id, size, color, quantity,
  custom_print_url?, mockup_url?, technical_metadata?
})

// After — two optional fields added
z.object({
  id, lead_id, product_id, size, color, quantity,
  custom_print_url?, mockup_url?, technical_metadata?,
  unit_price_cents?: z.number().int().nonnegative().optional(),
  print_cost_cents?:  z.number().int().nonnegative().optional(),
})
```

### Modified: `CreateLeadSchema` (packages/shared)

The `customer_data` object gains an optional `website` field for honeypot:

```typescript
customer_data: z.object({
  name:    z.string().min(1),
  email:   z.string().email().optional(),
  phone:   z.string().optional(),
  website: z.string().optional(), // honeypot — should always be empty for real users
})
```

### New: Rate Limit Store (in-memory)

```typescript
interface RateLimitEntry {
  count:   number;
  resetAt: number; // Unix ms timestamp
}

// Module-level singleton
const store = new Map<string, RateLimitEntry>();
```

### New: Cart State (sessionStorage)

The existing `client-order-draft` key in `sessionStorage` is unchanged. The `useCart` hook reads it as:

```typescript
interface OrderDraft {
  cart: CartItem[];
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cabinet middleware redirects unauthenticated requests

*For any* `/cabinet/*` path, a request without a valid Supabase session cookie SHALL result in a redirect response to `/cabinet/login`.

**Validates: Requirements 1.2**

---

### Property 2: Rate limit threshold enforcement

*For any* IP address, after sending more than `limit` POST requests to a rate-limited endpoint within the configured time window, every subsequent request SHALL receive an HTTP 429 response with body `{ "error": "Too many requests" }`.

**Validates: Requirements 2.1, 2.2, 2.3**

---

### Property 3: IP extraction from forwarded headers

*For any* `x-forwarded-for` header value (single IP, comma-separated list, or absent), the rate limiter SHALL extract a non-empty string to use as the rate limit key, and that string SHALL be the first entry in the header when the header is present.

**Validates: Requirements 2.4**

---

### Property 4: Upload MIME type allowlist enforcement

*For any* file submitted to `/api/upload` or `/api/cabinet/upload`, if the file's MIME type is not in `{ image/jpeg, image/png, image/gif, image/webp, image/svg+xml, application/pdf }`, the route SHALL return HTTP 400 with `{ "error": "Invalid file type" }` without calling `supabase.storage.upload()`.

**Validates: Requirements 3.1, 3.2**

---

### Property 5: Upload file size enforcement

*For any* file submitted to `/api/upload` or `/api/cabinet/upload`, if the file's size in bytes exceeds `10 * 1024 * 1024`, the route SHALL return HTTP 400 with `{ "error": "File too large" }` without calling `supabase.storage.upload()`.

**Validates: Requirements 3.3, 3.4**

---

### Property 6: Honeypot silent rejection

*For any* POST request to `/api/leads` where `customer_data.website` is a non-empty string, the handler SHALL return HTTP 200 with body `{ "id": "bot-rejected" }` and SHALL NOT insert any row into the `leads` table.

**Validates: Requirements 14.3**

---

### Property 7: Telegram webhook signature rejection

*For any* POST request to `/api/telegram/webhook` where `TELEGRAM_WEBHOOK_SECRET` is set and the `x-telegram-bot-api-secret-token` header either is absent or does not match the configured secret, the handler SHALL return HTTP 403 and SHALL NOT process the update payload.

**Validates: Requirements 15.2, 15.3**

---

### Property 8: Order item price round-trip

*For any* order item submitted with `unit_price_cents` and `print_cost_cents` values via `POST /api/leads`, the values stored in the `order_items` table SHALL equal the submitted values.

**Validates: Requirements 16.2**

---

## Error Handling

### Middleware

- Missing Supabase env vars → `updateSession` returns `NextResponse.next()` (pass-through), preventing redirect loops
- Supabase `getUser()` throws → treated as unauthenticated (redirect to login)

### Rate Limiter

- Upstash import fails or Redis is unreachable → falls back to in-memory store silently; logs a warning
- IP cannot be determined → uses `"unknown"` as the key (all unknown-IP requests share one bucket)

### Upload Routes

- Validation failure → HTTP 400 with JSON error body; no storage call made
- Storage upload error → HTTP 500 with error message (existing behavior, unchanged)
- `formData()` parse failure → caught by outer try/catch, returns HTTP 500

### Leads Route

- Honeypot triggered → HTTP 200 fake success (silent rejection)
- Rate limit exceeded → HTTP 429 before schema validation
- Schema validation failure → HTTP 400 with field errors (existing behavior)

### Error Boundaries

- `error.tsx` components catch unhandled React errors within their route segment
- All boundaries log `error` and `error.digest` to the console
- The `reset` function provided by Next.js re-renders the segment from scratch

### Telegram Webhook

- Missing secret header when secret is configured → HTTP 403
- Non-matching secret → HTTP 403 (constant-time comparison)
- Missing secret env var → warning logged, request allowed through (dev mode)
- Malformed JSON body → returns `{ ok: true }` (existing behavior, unchanged)

---

## Testing Strategy

This feature spans security hardening, infrastructure, and UI changes. The testing approach uses a combination of unit tests, property-based tests, and smoke checks.

### Property-Based Testing

The feature contains several universal properties suitable for property-based testing. The recommended library is **fast-check** (TypeScript-native, works in Jest/Vitest).

Each property test runs a minimum of 100 iterations.

**Property 1 — Cabinet middleware redirects unauthenticated requests**
- Generator: random strings matching `/cabinet/[a-z0-9/-]+`
- Assertion: `middleware(mockRequest(path, noSession))` returns a redirect to `/cabinet/login`
- Tag: `Feature: pre-launch-fixes, Property 1: cabinet middleware redirects unauthenticated requests`

**Property 2 — Rate limit threshold enforcement**
- Generator: random IP strings, random request counts above the limit
- Assertion: after `limit + n` requests (n ≥ 1), `rateLimit()` returns `{ success: false }`
- Tag: `Feature: pre-launch-fixes, Property 2: rate limit threshold enforcement`

**Property 3 — IP extraction from forwarded headers**
- Generator: random IP addresses, random comma-separated lists of IPs
- Assertion: `extractIp(header)` returns the first entry in the list
- Tag: `Feature: pre-launch-fixes, Property 3: IP extraction from forwarded headers`

**Property 4 — Upload MIME type allowlist enforcement**
- Generator: random MIME type strings not in the allowlist
- Assertion: `validateFile(file)` returns `{ valid: false, error: "Invalid file type" }`
- Tag: `Feature: pre-launch-fixes, Property 4: upload MIME type allowlist enforcement`

**Property 5 — Upload file size enforcement**
- Generator: random file sizes > 10MB (e.g. `fc.integer({ min: 10 * 1024 * 1024 + 1, max: 100 * 1024 * 1024 })`)
- Assertion: `validateFile(file)` returns `{ valid: false, error: "File too large" }`
- Tag: `Feature: pre-launch-fixes, Property 5: upload file size enforcement`

**Property 6 — Honeypot silent rejection**
- Generator: random non-empty strings for `customer_data.website`
- Assertion: handler returns `{ id: "bot-rejected" }` with status 200; DB insert is not called
- Tag: `Feature: pre-launch-fixes, Property 6: honeypot silent rejection`

**Property 7 — Telegram webhook signature rejection**
- Generator: random strings that are not equal to `TELEGRAM_WEBHOOK_SECRET`
- Assertion: handler returns HTTP 403
- Tag: `Feature: pre-launch-fixes, Property 7: Telegram webhook signature rejection`

**Property 8 — Order item price round-trip**
- Generator: random non-negative integers for `unit_price_cents` and `print_cost_cents`
- Assertion: after insert, queried values equal submitted values
- Tag: `Feature: pre-launch-fixes, Property 8: order item price round-trip`

### Unit / Example Tests

- Middleware: authenticated request to `/cabinet/login` → redirect to `/cabinet`
- Middleware: missing env vars → pass-through (no redirect loop)
- Rate limiter: requests below limit → `{ success: true }`
- Rate limiter: in-memory fallback when Upstash env vars absent
- Upload validation: each allowed MIME type → `{ valid: true }`
- Upload validation: file exactly at 10MB limit → `{ valid: true }`
- Honeypot: empty `website` field → normal lead creation proceeds
- Telegram webhook: absent secret env var → warning logged, request processed
- Telegram webhook: matching secret → request processed normally
- Invoice generator: uses `unit_price_cents` when present
- Invoice generator: falls back to estimation formula when `unit_price_cents` is null

### Smoke / Integration Checks

- `apps/client/src/middleware.ts` exists with correct matcher config
- `robots.ts` and `sitemap.ts` files exist in both apps
- Error boundary files exist in correct locations with `"use client"` directive
- Loading skeleton files exist for `/order` and `/cabinet`
- `not-found.tsx` files exist at global and product-slug levels
- `supabase/migrations/` directory exists with correctly named SQL files
- `useCart` hook file exists at `apps/client/src/hooks/useCart.ts`
- `_sections/` directory contains extracted section components
- `<video>` element in `page.tsx` has `poster` attribute
- No raw `<img>` tags remain in `page.tsx` or `ProductCardDetailed.tsx` (outside Fabric.js canvas)
