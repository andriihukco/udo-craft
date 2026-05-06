# Implementation Plan: Pre-Launch Fixes

## Overview

Implement all pre-launch and first-sprint fixes across `apps/client`, `apps/admin`, and `packages/shared`. Tasks are ordered by priority: critical security first, then SEO, then resilience/UX, then performance, then data integrity. Each task is independently implementable and maps to specific requirements.

## Tasks

- [x] 1. Security — Cabinet route protection via edge middleware
  - [x] 1.1 Create `apps/client/src/lib/supabase/middleware.ts` with `updateSession` function
    - Model on `apps/admin/src/lib/supabase/middleware.ts` — same `createServerClient` + cookie pattern
    - Redirect unauthenticated requests to `/cabinet/login`; redirect authenticated requests away from `/cabinet/login` to `/cabinet`
    - When Supabase env vars are absent, return `NextResponse.next()` to avoid redirect loops
    - _Requirements: 1.4, 1.6_

  - [x] 1.2 Create `apps/client/src/middleware.ts` with matcher config
    - Import and call `updateSession` from `./lib/supabase/middleware`
    - Matcher must cover `/cabinet` and `/cabinet/*` while excluding `_next/static`, `_next/image`, `favicon.ico`, static asset extensions (`.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [ ]* 1.3 Write property test for cabinet middleware redirect (Property 1)
    - **Property 1: Cabinet middleware redirects unauthenticated requests**
    - For any `/cabinet/*` path, a request without a valid session SHALL redirect to `/cabinet/login`
    - Use `fast-check` with random path generator matching `/cabinet/[a-z0-9/-]+`
    - Mock `createServerClient` to return no user
    - **Validates: Requirements 1.2**

  - [ ]* 1.4 Write unit tests for middleware edge cases
    - Authenticated request to `/cabinet/login` → redirect to `/cabinet`
    - Missing env vars → pass-through (no redirect loop)
    - Static asset paths → not matched by middleware
    - _Requirements: 1.3, 1.6_

- [x] 2. Security — Rate limiting on public API endpoints
  - [x] 2.1 Create `apps/client/src/lib/rate-limit.ts` with in-memory and Upstash backends
    - Export `rateLimit(request: NextRequest, options: { limit: number; window: number }): Promise<{ success: boolean; remaining: number }>`
    - Extract IP from `x-forwarded-for` header (first entry in comma-separated list), fall back to `request.ip`, then `"unknown"`
    - In-memory backend: module-level `Map<string, { count: number; resetAt: number }>` with TTL expiry
    - Upstash backend: dynamic import of `@upstash/ratelimit` when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set; fall back to in-memory silently on import failure
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 2.2 Apply rate limiting to `apps/client/src/app/api/leads/route.ts`
    - Call `rateLimit(request, { limit: 5, window: 60 })` at the top of the POST handler, before schema validation
    - Return `NextResponse.json({ error: "Too many requests" }, { status: 429 })` when `success` is false
    - _Requirements: 2.1, 2.3_

  - [x] 2.3 Apply rate limiting to `apps/client/src/app/api/upload/route.ts`
    - Call `rateLimit(request, { limit: 10, window: 60 })` at the top of the POST handler
    - Return HTTP 429 with `{ "error": "Too many requests" }` when limit exceeded
    - _Requirements: 2.2, 2.3_

  - [ ]* 2.4 Write property test for rate limit threshold enforcement (Property 2)
    - **Property 2: Rate limit threshold enforcement**
    - For any IP, after `limit + n` requests (n ≥ 1) within the window, `rateLimit()` SHALL return `{ success: false }`
    - Use `fast-check` with random IP strings and random counts above the limit
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 2.5 Write property test for IP extraction (Property 3)
    - **Property 3: IP extraction from forwarded headers**
    - For any `x-forwarded-for` value (single IP, comma-separated list, or absent), the extracted key SHALL be the first entry when present
    - Export `extractIp` as a named function from `rate-limit.ts` for testability
    - **Validates: Requirements 2.4**

  - [ ]* 2.6 Write unit tests for rate limiter
    - Requests below limit → `{ success: true }`
    - In-memory fallback when Upstash env vars are absent
    - Window expiry resets the counter
    - _Requirements: 2.5, 2.6_

- [x] 3. Security — Server-side file validation on upload routes
  - [x] 3.1 Add `validateFile` helper and apply it to `apps/client/src/app/api/upload/route.ts`
    - Define `ALLOWED_MIME_TYPES` set and `MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024`
    - `validateFile(file: File): { valid: true } | { valid: false; error: string; status: 400 }`
    - Call `validateFile` for each file before `file.arrayBuffer()` — reject with HTTP 400 on failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Apply the same `validateFile` logic to `apps/client/src/app/api/cabinet/upload/route.ts`
    - Import or inline the same allowlist and size limit
    - Validate before `file.arrayBuffer()` call
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.3 Write property test for MIME type allowlist enforcement (Property 4)
    - **Property 4: Upload MIME type allowlist enforcement**
    - For any MIME type string not in the allowlist, `validateFile` SHALL return `{ valid: false, error: "Invalid file type" }`
    - Use `fast-check` with random strings filtered to exclude allowlisted values
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 3.4 Write property test for file size enforcement (Property 5)
    - **Property 5: Upload file size enforcement**
    - For any file size > 10 MB, `validateFile` SHALL return `{ valid: false, error: "File too large" }`
    - Use `fc.integer({ min: 10 * 1024 * 1024 + 1, max: 100 * 1024 * 1024 })`
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 3.5 Write unit tests for upload validation
    - Each allowed MIME type → `{ valid: true }`
    - File exactly at 10 MB limit → `{ valid: true }`
    - File at 10 MB + 1 byte → `{ valid: false }`
    - _Requirements: 3.1, 3.3_

- [x] 4. Security — Telegram webhook signature verification
  - [x] 4.1 Strengthen signature check in `apps/admin/src/app/api/telegram/webhook/route.ts`
    - Replace the current `secret !== expectedSecret` string comparison with `timingSafeEqual` from Node.js `crypto`
    - Pad both buffers to equal length before comparison to prevent length-based timing leaks
    - When `TELEGRAM_WEBHOOK_SECRET` is set and header is absent → return HTTP 403
    - When `TELEGRAM_WEBHOOK_SECRET` is not set → log warning and allow through
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 4.2 Write property test for webhook signature rejection (Property 7)
    - **Property 7: Telegram webhook signature rejection**
    - For any string not equal to `TELEGRAM_WEBHOOK_SECRET`, the handler SHALL return HTTP 403
    - Use `fast-check` with random strings filtered to exclude the configured secret
    - **Validates: Requirements 15.2, 15.3**

  - [ ]* 4.3 Write unit tests for webhook auth
    - Absent secret env var → warning logged, request processed
    - Matching secret → request processed normally
    - Missing header when secret is configured → HTTP 403
    - _Requirements: 15.4, 15.5_

- [x] 5. Security — Honeypot spam protection on contact form
  - [x] 5.1 Add honeypot field to `apps/client/src/components/ContactForm.tsx`
    - Add `const [honeypot, setHoneypot] = useState("")` state
    - Render hidden input: `name="website"`, `tabIndex={-1}`, `aria-hidden="true"`, `autoComplete="off"`, CSS `position: absolute; left: -9999px; opacity: 0`
    - Include `website: honeypot` in the `customer_data` payload sent to `/api/leads`
    - _Requirements: 14.1, 14.2, 14.4_

  - [x] 5.2 Add honeypot field to `CreateLeadSchema` in `packages/shared/index.ts` and check it in `apps/client/src/app/api/leads/route.ts`
    - Add `website: z.string().optional()` to the `customer_data` object in `CreateLeadSchema`
    - In the POST handler, after rate limit check and before DB insert: if `parsed.data.customer_data.website` is a non-empty string, return `NextResponse.json({ id: "bot-rejected" }, { status: 200 })`
    - _Requirements: 14.3_

  - [ ]* 5.3 Write property test for honeypot silent rejection (Property 6)
    - **Property 6: Honeypot silent rejection**
    - For any non-empty string in `customer_data.website`, the handler SHALL return `{ id: "bot-rejected" }` with status 200 and SHALL NOT call the DB insert
    - Use `fast-check` with `fc.string({ minLength: 1 })`
    - **Validates: Requirements 14.3**

  - [ ]* 5.4 Write unit test for honeypot pass-through
    - Empty `website` field → normal lead creation proceeds
    - _Requirements: 14.3_

- [x] 6. Checkpoint — Security tasks complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. SEO — Metadata, Open Graph, and structured data
  - [x] 7.1 Extend `metadata` export in `apps/client/src/app/layout.tsx`
    - Add `metadataBase: new URL("https://u-do-craft.store")`
    - Add `openGraph` object: `title`, `description`, `url`, `siteName: "U:DO CRAFT"`, `locale: "uk_UA"`, `type: "website"`, `images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "U:DO CRAFT" }]`
    - Add `twitter` object: `card: "summary_large_image"`, `title`, `description`, `images: ["/og-image.jpg"]`
    - _Requirements: 4.1, 4.2_

  - [x] 7.2 Add JSON-LD Organization schema to `apps/client/src/app/layout.tsx`
    - Add a `<script type="application/ld+json">` tag inside `<head>` via `dangerouslySetInnerHTML` with `@type: "Organization"`, `name`, `url`, and `logo` fields
    - _Requirements: 4.5_

  - [x] 7.3 Create `apps/client/src/app/robots.ts`
    - Export default `robots()` returning `{ rules: { userAgent: "*", allow: "/" }, sitemap: "https://u-do-craft.store/sitemap.xml" }`
    - _Requirements: 4.3_

  - [x] 7.4 Create `apps/client/src/app/sitemap.ts`
    - Export default `sitemap()` returning entries for `/`, `/order`, and `/cabinet` with `lastModified`, `changeFrequency`, and `priority` values
    - _Requirements: 4.4_

  - [x] 7.5 Create `apps/admin/src/app/robots.ts`
    - Export default `robots()` returning `{ rules: { userAgent: "*", disallow: "/" }, host: "https://admin.u-do-craft.store" }`
    - _Requirements: 4.6, 6.1, 6.2, 6.3_

- [x] 8. Resilience — Error boundaries and loading/not-found pages
  - [x] 8.1 Create global error boundary `apps/client/src/app/error.tsx`
    - Mark `"use client"`, accept `{ error, reset }` props
    - Render full-page Ukrainian recovery UI with a "Спробувати знову" button that calls `reset()`
    - Log `error` and `error.digest` to console in `useEffect`
    - _Requirements: 5.1, 5.4, 5.5_

  - [x] 8.2 Create segment error boundaries for `/order` and `/cabinet`
    - `apps/client/src/app/order/error.tsx` — inline recovery UI with link back to `/`
    - `apps/client/src/app/cabinet/error.tsx` — inline recovery UI with link back to `/`
    - Both marked `"use client"`, both log error to console
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x] 8.3 Create loading skeletons for `/order` and `/cabinet`
    - `apps/client/src/app/order/loading.tsx` — grid of 4–8 skeleton product cards using `animate-pulse` Tailwind classes
    - `apps/client/src/app/cabinet/loading.tsx` — two-column skeleton (sidebar list rows + detail panel) using `animate-pulse`
    - _Requirements: 12.1, 12.2, 12.5_

  - [x] 8.4 Create not-found pages
    - `apps/client/src/app/not-found.tsx` — global 404 in Ukrainian with a link back to `/`
    - `apps/client/src/app/products/[slug]/not-found.tsx` — product-not-found page with a link to `/order`
    - _Requirements: 12.3, 12.4_

- [x] 9. Performance — Hero video fallback and `next/image` migration
  - [x] 9.1 Add `poster` attribute and CSS background fallback to hero video in `apps/client/src/app/page.tsx`
    - Add `poster="/hero-poster.jpg"` to the `<video>` element
    - Add `style={{ backgroundImage: "url('/hero-poster.jpg')" }}` to the parent `<section>` element
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 9.2 Replace raw `<img>` tags with `<Image>` in `apps/client/src/app/page.tsx`
    - Replace `<img>` in `PopupStepCarousel` (Unsplash images) with `<Image fill className="object-cover" />`
    - Add `{ protocol: "https", hostname: "images.unsplash.com" }` to `remotePatterns` in `apps/client/next.config.mjs`
    - Do NOT touch `<img>` tags inside Fabric.js canvas operations in `ProductCanvas.tsx`
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [x] 9.3 Replace raw `<img>` tags with `<Image>` in `apps/client/src/components/ProductCardDetailed.tsx`
    - Replace product image `<img>` tags with `<Image>` from `next/image`
    - Use `fill` + `object-cover` for images inside positioned containers, or explicit `width`/`height` where dimensions are known
    - _Requirements: 8.2, 8.3_

- [x] 10. Performance — Decompose monolithic landing page and replace cart polling
  - [x] 10.1 Extract static sections from `apps/client/src/app/page.tsx` into `_sections/` components
    - Create `apps/client/src/app/_sections/HeroSection.tsx` — Server Component (static text + video element, no state)
    - Create `apps/client/src/app/_sections/ServicesSection.tsx` — Server Component (static content cards)
    - Create `apps/client/src/app/_sections/StatsSection.tsx` — Client Component (uses `CountUp` with `useEffect`)
    - Create `apps/client/src/app/_sections/PopupSection.tsx` — Server Component (static layout; `PopupStepCarousel` stays as Client Component)
    - Move `PopupStepCarousel` to its own file or keep it co-located in `PopupSection.tsx` as a Client Component
    - _Requirements: 9.1, 9.2, 9.5_

  - [x] 10.2 Create `apps/client/src/hooks/useCart.ts` hook
    - Export `useCart(): { cart: CartItem[]; cartCount: number; totalCents: number }`
    - `readCart()` reads and parses `sessionStorage.getItem("client-order-draft")`
    - Register `window.addEventListener("storage", readCart)` for cross-tab sync
    - Create `new BroadcastChannel("udo-cart")` and set `channel.onmessage = () => readCart()` for same-tab sync
    - Cleanup: close channel and remove storage listener on unmount
    - No `setInterval` — polling is removed entirely
    - _Requirements: 9.3, 9.4, 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 10.3 Wire `useCart` into `apps/client/src/app/page.tsx` and remove polling
    - Replace the inline cart `useEffect` (with `setInterval`) in `page.tsx` with `const { cart, cartCount, totalCents } = useCart()`
    - Remove the `setInterval(readCart, 2000)` call entirely
    - Import the extracted `_sections/` components and replace the inline section JSX
    - Verify the page remains functionally equivalent (nav, cart sidebar, auth state, all sections)
    - _Requirements: 9.4, 9.5, 13.1_

- [x] 11. Checkpoint — Performance and UX tasks complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Data integrity — Store unit price and print cost per order item
  - [x] 12.1 Add `unit_price_cents` and `print_cost_cents` to `OrderItemSchema` in `packages/shared/index.ts`
    - Add `unit_price_cents: z.number().int().nonnegative().optional()` and `print_cost_cents: z.number().int().nonnegative().optional()` to `OrderItemSchema`
    - _Requirements: 16.3_

  - [x] 12.2 Persist price fields in `apps/client/src/app/api/leads/route.ts`
    - In the `order_items.map()`, include `unit_price_cents: item.unit_price_cents ?? null` and `print_cost_cents: item.print_cost_cents ?? null`
    - _Requirements: 16.2_

  - [x] 12.3 Update invoice generator in `apps/client/src/app/cabinet/page.tsx`
    - In `handleDownloadInvoice`, use `item.unit_price_cents` when present
    - Fall back to `Math.round(selectedLead.total_amount_cents / Math.max(1, totalQty))` for legacy items where `unit_price_cents` is null/undefined
    - _Requirements: 16.4, 16.5_

  - [ ]* 12.4 Write property test for order item price round-trip (Property 8)
    - **Property 8: Order item price round-trip**
    - For any non-negative integers submitted as `unit_price_cents` and `print_cost_cents`, the values stored in `order_items` SHALL equal the submitted values
    - Use `fast-check` with `fc.nat()` generators for both fields
    - Mock the Supabase insert and verify the mapped values
    - **Validates: Requirements 16.2**

  - [ ]* 12.5 Write unit tests for invoice fallback
    - Invoice uses `unit_price_cents` when present on order item
    - Invoice falls back to estimation formula when `unit_price_cents` is null
    - _Requirements: 16.4, 16.5_

- [x] 13. Data integrity — RLS migrations and service role audit
  - [x] 13.1 Create `supabase/migrations/` directory with RLS policy SQL file
    - Create `supabase/migrations/20240101000000_rls_policies.sql` with `CREATE POLICY` statements for `leads`, `order_items`, `products`, `messages`, `categories`, `materials`, `print_zones`, and `print_type_pricing` tables
    - Follow Supabase CLI naming convention: `YYYYMMDDHHMMSS_description.sql`
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 13.2 Create `supabase/migrations/README.md`
    - Document how to apply migrations using the Supabase CLI (`supabase db push`, `supabase migration up`)
    - Include instructions for both production and dev Supabase projects
    - _Requirements: 10.4_

  - [x] 13.3 Audit service role usage in `apps/client` API routes
    - Add a comment block to each route that calls `createServiceClient()` explaining why the service role is required
    - For `/api/cabinet/leads` and `/api/cabinet/messages`, replace `createServiceClient()` with the session-based `createClient()` where RLS policies permit
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (TypeScript-native, works with Vitest/Jest)
- Each property test runs a minimum of 100 iterations
- Checkpoints at tasks 6, 11, and 14 ensure incremental validation
- The `validateFile` helper (task 3.1) should be extracted to a shared utility if both upload routes are in the same app — a simple module at `apps/client/src/lib/validate-file.ts` works well
- The `extractIp` function (task 2.5) should be exported from `rate-limit.ts` as a named export for testability
- Fabric.js canvas `<img>` elements in `ProductCanvas.tsx` must remain as raw `<img>` — do not replace them
- The `supabase/migrations/` directory goes at the repo root, not inside either app
