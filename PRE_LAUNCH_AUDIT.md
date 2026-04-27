# U:DO Craft — Pre-Launch Audit Report
**Date:** April 27, 2026  
**Team:** Full-Stack · QA · UI/UX · Product · Marketing/BA  
**Scope:** `apps/client` + `apps/admin` + `packages/*`  
**Verdict:** Platform is functionally solid and close to launch-ready. The gaps below are real and prioritised — address criticals before go-live, the rest can follow in the first sprint post-launch.

---

## Executive Summary

The codebase is well-structured, uses modern tooling correctly, and the core order flow works end-to-end. The monorepo separation is clean, shared schemas prevent data drift, and the Kanban + Realtime stack is production-grade. The main risks before launch are: **no server-side auth protection on `/cabinet`**, **no rate limiting on public API endpoints**, **zero SEO metadata**, and **no error boundaries** — all fixable in a day or two.

---

## 🔴 CRITICAL — Must fix before launch

### C-1 · Client `/cabinet` routes have no middleware protection
**Area:** Security  
**File:** `apps/client/src/` — no `middleware.ts` exists  

The admin app has proper Supabase SSR middleware. The client app has none. `/cabinet` and all its sub-routes rely entirely on a client-side `useEffect` redirect:
```ts
supabase.auth.getUser().then((res) => {
  if (!authUser) router.push("/cabinet/login"); // too late — page already rendered
});
```
A logged-out user can see the cabinet shell, and API routes like `/api/cabinet/leads` and `/api/cabinet/messages` are reachable without a session cookie.

**Fix:** Add `apps/client/src/middleware.ts` mirroring the admin pattern — protect `/cabinet/*` at the edge, redirect to `/cabinet/login`.

---

### C-2 · No rate limiting on public API endpoints
**Area:** Security / Reliability  
**Files:** `apps/client/src/app/api/leads/route.ts`, `/api/upload/route.ts`  

`RateLimitError` is defined in `apps/admin/src/lib/api/errors.ts` but never used anywhere. `/api/leads` (POST) is fully public — no auth, no throttle. A bot can spam thousands of fake leads or exhaust Supabase storage via `/api/upload`.

**Fix:** Add Upstash Redis rate limiting (free tier covers this) or use Vercel's built-in edge rate limiting. At minimum, add IP-based throttle on `/api/leads` (e.g. 5 req/min) and file size + type validation on upload routes.

---

### C-3 · Upload routes accept any file type and have no server-side size limit
**Area:** Security  
**Files:** `apps/client/src/app/api/upload/route.ts`, `apps/client/src/app/api/cabinet/upload/route.ts`  

The client-side cabinet enforces 10 MB per file, but the API routes themselves do not validate `file.type` or `file.size`. An attacker can bypass the UI and POST arbitrary files (executables, SVG with scripts, etc.) directly to Supabase Storage.

**Fix:** In each upload route, whitelist MIME types (`image/*`, `application/pdf`, `image/svg+xml`) and enforce a server-side size cap before calling `supabase.storage.upload()`.

---

### C-4 · Zero SEO metadata on the client app
**Area:** Marketing / SEO  
**Files:** `apps/client/src/app/layout.tsx`, all page files  

The root layout has a single static `<title>` and `<description>`. There are no Open Graph tags, no Twitter Card tags, no canonical URLs, no `robots.txt`, no `sitemap.xml`, and no structured data (JSON-LD). Sharing any URL on Slack, Telegram, or LinkedIn will show a blank preview. Google will not index the site effectively.

**Fix (1–2 hours):**
- Add `openGraph` and `twitter` to root metadata
- Add `apps/client/src/app/robots.ts` and `sitemap.ts` (Next.js 14 file-based)
- Add `generateMetadata` to `/order` and `/products` pages
- Add `Organization` + `WebSite` JSON-LD to root layout

---

### C-5 · No error boundaries — unhandled React errors crash the whole page
**Area:** Reliability / UX  
**Files:** `apps/client/src/app/` — no `error.tsx` files found  

Next.js App Router uses `error.tsx` as the error boundary per segment. None exist in the client app. A runtime error in the canvas editor, product grid, or cabinet will show a blank white screen with no recovery path.

**Fix:** Add `apps/client/src/app/error.tsx` (global), `apps/client/src/app/order/error.tsx`, and `apps/client/src/app/cabinet/error.tsx` with a friendly "Something went wrong" UI and a retry button.

---

## 🟠 HIGH — Fix in first post-launch sprint (week 1)

### H-1 · `<img>` tags used everywhere instead of `next/image`
**Area:** Performance  
**Files:** `apps/client/src/app/page.tsx` (1331 lines), `ProductCardDetailed.tsx`, `ProductCanvas.tsx`  

`next/image` is imported only in `brand-logo.tsx`. Every product image, hero image, and carousel image uses a raw `<img>` tag. This means:
- No automatic WebP/AVIF conversion
- No lazy loading (LCP suffers)
- No responsive `srcset`
- No blur placeholder

The landing page loads multiple full-resolution product images on initial paint. This will hurt Core Web Vitals (LCP, CLS) and Lighthouse scores.

**Fix:** Replace `<img>` with `<Image>` from `next/image` for all above-the-fold and product images. Canvas/Fabric.js images must stay as `<img>` — that's correct.

---

### H-2 · Landing page is a 1331-line monolithic "use client" component
**Area:** Performance / Maintainability  
**File:** `apps/client/src/app/page.tsx`  

The entire homepage — nav, hero, collections, popup section, services, stats, contact form — is one `"use client"` file. This means:
- The entire page is client-rendered (no SSR for SEO)
- No code splitting between sections
- Cart polling runs a `setInterval` every 2 seconds on the homepage

**Fix:** Convert static sections (hero text, services, stats) to Server Components. Extract `CartSidebar`, `HeroSection`, `CollectionsSection`, `PopupSection`, `ContactSection` into separate files. Move the 2-second cart poll to a custom hook with `visibilitychange` awareness.

---

### H-3 · Analytics page queries raw Supabase tables client-side with `any` types
**Area:** Performance / Security / TypeScript  
**File:** `apps/admin/src/app/(dashboard)/analytics/page.tsx`  

The analytics page runs 5 parallel Supabase queries directly from the browser using the service-role-equivalent anon key, with `(e: any)` throughout the data processing. For a small dataset this is fine, but as data grows this will be slow and the `any` types hide real bugs.

**Fix:** Move analytics aggregation to `/api/analytics/badges` (already exists — extend it). Add proper TypeScript types for event rows. Add a `site_events` index on `(created_at, event_type)` in Supabase.

---

### H-4 · RLS policies not version-controlled
**Area:** Security / DevOps  
**Files:** Supabase dashboard only  

Row Level Security policies are the primary data access control layer. They exist only in the Supabase dashboard — not in git. If the production project is accidentally reset, or a new developer sets up a fresh Supabase project, there is no record of what policies should exist.

**Fix:** Export all RLS policies as SQL migration files into a `supabase/migrations/` directory. Use `supabase db dump --schema public` or the Supabase CLI to capture the current state.

---

### H-5 · `SUPABASE_SERVICE_ROLE_KEY` in client app
**Area:** Security  
**File:** `apps/client/.env.example`  

The service role key bypasses all RLS. It should only exist in the admin app. The client app has API routes that use it (e.g. `cabinet/leads`, `cabinet/messages`) — these should use the user's session token with RLS instead, or be proxied through the admin API.

**Fix:** Audit which client API routes use the service role key. Replace with session-based queries where possible. If the service role is genuinely needed (e.g. reading messages across leads), document why and ensure those routes are auth-gated.

---

### H-6 · No `not-found.tsx` or `loading.tsx` on key routes
**Area:** UX  
**Files:** `apps/client/src/app/order/`, `apps/client/src/app/cabinet/`  

The root `loading.tsx` exists but individual route segments don't have their own. The order page shows a full `LogoLoader` while fetching 5 parallel Supabase queries — there's no skeleton for the product grid, so the page feels broken on slow connections.

**Fix:** Add `loading.tsx` with skeleton cards to `/order` and `/cabinet`. Add `not-found.tsx` to the root and `/products/[slug]`.

---

## 🟡 MEDIUM — Address within first 2 weeks post-launch

### M-1 · No `prefers-reduced-motion` support
**Area:** Accessibility  
**Files:** `apps/client/src/app/page.tsx`, all Framer Motion usage  

The landing page has heavy scroll-triggered animations (FadeUp, StaggerGrid, CountUp, hero video). Users with vestibular disorders or motion sensitivity get no opt-out. This is a WCAG 2.1 AA requirement.

**Fix:** Wrap Framer Motion variants with a `useReducedMotion()` hook (built into Framer Motion). Disable the CountUp animation and hero video autoplay when `prefers-reduced-motion: reduce` is set.

---

### M-2 · Cart state uses `setInterval` polling (2s) instead of storage events
**Area:** Performance  
**File:** `apps/client/src/app/page.tsx` lines ~310–325  

```ts
const interval = setInterval(readCart, 2000); // polls every 2s
```
This runs on the homepage even when the user is not interacting with the cart. Combined with the Realtime subscription in cabinet, this adds unnecessary CPU and battery drain on mobile.

**Fix:** Use `window.addEventListener("storage", readCart)` (already present) and a custom `BroadcastChannel` for same-tab updates. Remove the interval entirely.

---

### M-3 · Contact form has no honeypot or spam protection
**Area:** Security / Marketing  
**File:** `apps/client/src/components/ContactForm.tsx`  

The form POSTs to `/api/leads` with no bot protection. Combined with no rate limiting (C-2), this is a spam magnet. The form is publicly accessible and requires only name + email + phone.

**Fix:** Add a hidden honeypot field. Consider adding Cloudflare Turnstile (free, privacy-friendly) or hCaptcha. At minimum, validate phone format server-side more strictly.

---

### M-4 · Telegram webhook not verified
**Area:** Security  
**File:** `apps/admin/src/app/api/telegram/` (webhook handler)  

`TELEGRAM_WEBHOOK_SECRET` is in `.env.example` but webhook signature verification needs to be confirmed in the handler. If not implemented, anyone who discovers the webhook URL can send fake messages to the admin.

**Fix:** Verify the `X-Telegram-Bot-Api-Secret-Token` header on every incoming webhook request. Reject requests that don't match.

---

### M-5 · TypeScript `any` in analytics and canvas — catch blocks use `any`
**Area:** Code Quality  
**Files:** `analytics/page.tsx`, `ProductCanvas.tsx`, multiple API route catch blocks  

Fabric.js `as any` casts are unavoidable (the `@types/fabric` package is incomplete). But catch blocks across API routes use `error: any` instead of `unknown`, and the analytics page processes all event data as `any`. This hides real type errors.

**Fix:** Change catch blocks to `catch (err: unknown)` with `err instanceof Error` guards. Add a typed `SiteEvent` interface for analytics data processing.

---

### M-6 · No `robots.txt` — search engines will crawl admin
**Area:** SEO / Security  
**Files:** Missing from both apps  

Without `robots.txt`, search engines will attempt to crawl `admin.u-do-craft.store`. While auth blocks access, the login page and any public-facing admin routes will appear in search results.

**Fix:** Add `apps/admin/src/app/robots.ts` with `disallow: ["/"]`. Add `apps/client/src/app/robots.ts` with proper `allow` rules and sitemap reference.

---

### M-7 · Hero video (`/hero-video.mp4`) — no fallback, no poster
**Area:** Performance / UX  
**File:** `apps/client/src/app/page.tsx`  

The hero section has a `<video>` that starts `opacity-0` and fades in on `canplay`. If the video fails to load (slow connection, ad blocker, iOS data-saver), the hero shows only the `bg-primary` color with no content visible until the video loads.

**Fix:** Add a `poster` attribute pointing to a static hero image. Add a CSS fallback background image on the hero section. Ensure the hero text is visible regardless of video load state.

---

### M-8 · No invoice price breakdown — unit price is estimated
**Area:** Product / UX  
**File:** `apps/client/src/app/cabinet/page.tsx` lines ~280–290  

```ts
unitPriceCents: Math.round(selectedLead.total_amount_cents / Math.max(1, totalQty))
```
The PDF invoice calculates unit price by dividing total by quantity — a rough estimate that will be wrong for mixed orders (different products, different print types). This could cause trust issues with B2B clients.

**Fix:** Store `unit_price_cents` and `print_cost_cents` per `order_item` at creation time. Use those values in the invoice generator.

---

## 🟢 LOW — Nice to have, schedule for sprint 2+

### L-1 · No test coverage
**Area:** QA  
Zero test files exist. No Jest, Vitest, or Playwright configuration. The CI pipeline only runs `type-check` and `lint`.

**Recommendation:** Start with Playwright E2E tests for the critical path: landing → order → submit lead → admin sees order. Add unit tests for `@udo-craft/shared` schema validation. Target 40% coverage before the first major feature sprint.

---

### L-2 · Large components need splitting
**Area:** Maintainability  
- `apps/client/src/app/page.tsx` — 1331 lines  
- `apps/client/src/app/cabinet/page.tsx` — 754 lines  
- `apps/admin/src/app/(dashboard)/analytics/page.tsx` — 609 lines  

These are hard to review, test, and maintain. Not a launch blocker but will slow down future development.

**Recommendation:** Extract each logical section into its own component file. The homepage alone should be split into ~8 components.

---

### L-3 · No API versioning
**Area:** Architecture  
All API routes are at `/api/*` with no version prefix. Future breaking changes will require coordinated deploys across both apps.

**Recommendation:** Not urgent for a monorepo where both apps deploy together, but add `/api/v1/` prefix before exposing any API to third parties.

---

### L-4 · `novel` and `cmdk` packages may be unused in admin
**Area:** Bundle size  
`novel@1.0.2` (rich text editor) and `cmdk@1.1.1` (command palette) are in admin's `package.json`. If unused, they add unnecessary bundle weight.

**Recommendation:** Verify usage with `grep -r "from 'novel'" apps/admin/src`. Remove if unused.

---

### L-5 · Phone validation is too permissive
**Area:** Data Quality  
The contact form accepts any string in the phone field with no format enforcement. Ukrainian phone numbers follow `+380XXXXXXXXX`. Invalid numbers make it harder for the sales team to follow up.

**Recommendation:** Add client-side format hint (`+380 XX XXX XX XX`) and server-side regex validation in `CreateLeadSchema`.

---

### L-6 · No database migration files in repo
**Area:** DevOps  
Schema changes are made directly in the Supabase dashboard. There's no migration history, making it impossible to reproduce the exact schema on a new project or roll back a bad change.

**Recommendation:** Adopt Supabase CLI migrations (`supabase migration new`). Commit all future schema changes as SQL files in `supabase/migrations/`.

---

### L-7 · Unsplash images hardcoded in popup carousel
**Area:** Content / Legal  
**File:** `apps/client/src/app/page.tsx` — `POPUP_STEPS` array  

Three Unsplash URLs are hardcoded as step images in the popup carousel. These are fine for development but should be replaced with actual U:DO Craft photography before launch for brand consistency and to avoid any licensing ambiguity.

---

### L-8 · `any[]` cart type on homepage
**Area:** TypeScript  
**File:** `apps/client/src/app/page.tsx`  
```ts
const [cart, setCart] = useState<any[]>([]);
```
The cart item shape is well-defined in the order flow but typed as `any[]` on the homepage. This means no autocomplete and no type safety when rendering cart items.

**Recommendation:** Export the `CartItem` type from `@udo-craft/shared` and use it here.

---

## Summary Scorecard

| Dimension | Score | Status |
|---|---|---|
| **Architecture & Structure** | 9/10 | ✅ Excellent monorepo setup |
| **Core Order Flow** | 8/10 | ✅ Works end-to-end |
| **Auth & Security** | 4/10 | 🔴 Cabinet unprotected, no rate limiting |
| **SEO & Discoverability** | 1/10 | 🔴 No OG tags, no sitemap, no robots.txt |
| **Performance** | 5/10 | 🟠 No next/image, monolithic CSR page |
| **Error Handling & Resilience** | 4/10 | 🟠 No error boundaries, no not-found pages |
| **Accessibility** | 6/10 | 🟡 Basic ARIA present, no reduced-motion |
| **Mobile Responsiveness** | 8/10 | ✅ Tailwind breakpoints, touch-friendly |
| **TypeScript Safety** | 7/10 | 🟡 Fabric.js `any` is unavoidable; catch blocks fixable |
| **Code Quality** | 6/10 | 🟡 Large files, but patterns are consistent |
| **DevOps & CI** | 6/10 | 🟡 No migrations, no tests in CI |
| **Marketing Readiness** | 3/10 | 🔴 No social previews, no structured data |

---

## Launch Checklist

### Must-do before go-live (1–2 days)
- [ ] **C-1** Add `middleware.ts` to client app — protect `/cabinet/*`
- [ ] **C-2** Add rate limiting to `/api/leads` and `/api/upload`
- [ ] **C-3** Add server-side file type + size validation to upload routes
- [ ] **C-4** Add OG tags, Twitter cards, `robots.ts`, `sitemap.ts`
- [ ] **C-5** Add `error.tsx` to root, `/order`, `/cabinet`
- [ ] **M-6** Add `robots.ts` to admin app (disallow all)
- [ ] **M-7** Add `poster` attribute to hero video

### Do in week 1 post-launch
- [ ] **H-1** Replace `<img>` with `<Image>` for product/hero images
- [ ] **H-2** Split homepage into Server + Client components
- [ ] **H-4** Export RLS policies to `supabase/migrations/`
- [ ] **H-5** Audit and reduce service role key usage in client app
- [ ] **H-6** Add skeleton `loading.tsx` to `/order` and `/cabinet`
- [ ] **M-2** Remove 2s cart polling interval
- [ ] **M-3** Add honeypot to contact form
- [ ] **M-4** Verify Telegram webhook signature verification
- [ ] **M-8** Fix invoice unit price calculation

### Schedule for sprint 2
- [ ] **L-1** Add Playwright E2E tests for critical path
- [ ] **L-2** Split large components
- [ ] **M-1** Add `prefers-reduced-motion` support
- [ ] **M-5** Fix `any` types in analytics and catch blocks
- [ ] **L-5** Strengthen phone validation
- [ ] **L-6** Adopt Supabase CLI migrations
- [ ] **L-7** Replace Unsplash placeholder images
- [ ] **L-8** Type the cart state properly

---

*Report generated by automated codebase analysis + manual review. All file paths and code snippets reference actual source files.*
