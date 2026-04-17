# U:DO Craft — System Review
**Date:** April 14, 2026  
**Reviewer:** Kiro (Software Engineer · UX/UI Designer · Marketing Specialist)  
**Overall Score: 7.4 / 10**

---

## Executive Summary

U:DO Craft is a well-conceived B2B merch platform with a solid technical foundation, a genuinely impressive canvas customizer, and a clean visual identity. The codebase is organized, the monorepo structure is sound, and the product vision is clear. However, several gaps in code consistency, UX polish, and marketing execution are holding it back from being a truly production-grade platform. The issues are fixable — none are architectural — and the roadmap (Canvas v2, AI generation) is pointed in the right direction.

---

## 1. Software Engineering

### Score: 7.5 / 10

### Strengths

- **Monorepo architecture is clean.** npm workspaces + Turborepo with a proper build order (`shared → ui → admin → client`) is the right call. The `@udo-craft/shared` package as a single source of truth for schemas and types is excellent discipline.
- **Zod validation is used correctly.** `CreateLeadSchema` in shared, `safeParse()` with structured error responses — this is the right pattern.
- **Supabase integration is solid.** SSR client with cookie-based sessions, middleware-level auth, Realtime subscriptions for the Kanban and cabinet — all implemented correctly.
- **Canvas customizer is genuinely impressive.** Fabric.js 5 with layer management, undo/redo, background removal, text curves, print zone constraints, and AI generation is a lot of functionality done well.
- **CI pipeline exists.** Type-check + lint on PRs is the minimum viable gate and it's there.
- **Error classes are defined.** `ApiException`, `NotFoundError`, `ValidationError`, etc. in `lib/api/errors.ts` show intent toward consistency.

### Issues

#### Critical

- **`verifyAuth()` is a stub.** The function in `apps/admin/src/lib/api/errors.ts` checks for an Authorization header but does not actually validate the token against Supabase. Any route using it has a false sense of security. Either implement real token validation or remove it — the middleware already handles session auth for page routes.

- **No rate limiting on any API route.** `/api/leads` (POST), `/api/upload`, and `/api/ai/generate` are all open to abuse. A single bad actor could spam lead creation or exhaust Gemini API quota. Upstash Redis with `@upstash/ratelimit` is the standard Vercel-compatible solution.

- **`NEXT_PUBLIC_GEMINI_API_KEY` is client-exposed.** The spec says the key should be server-side only, but the `NEXT_PUBLIC_` prefix makes it available in the browser bundle. Rename to `GEMINI_API_KEY` and ensure all calls go through the `/api/ai/generate` server route.

#### High

- **Cart state lives in `sessionStorage` with a 2-second polling interval.** `apps/client/src/app/page.tsx` polls `sessionStorage` every 2 seconds to sync cart count across tabs. This is fragile and wasteful. Use a `storage` event listener (already present) and a React context or Zustand store instead. The polling interval should be removed.

- **`any` types scattered throughout.** `cart: any[]`, `item: any`, `(payload: any)` in Realtime handlers, `product as any` in `QtyPriceContent` — these defeat TypeScript's purpose. The shared package has the types; they should be used.

- **Duplicate `MockupViewer` component.** Exists in `apps/admin/src/components/`, `apps/client/src/components/`, and `packages/ui/`. The package version is the canonical one but the apps have local copies that may diverge.

- **Silent fetch failures.** Multiple `.fetch().then().catch(() => {})` chains in `Customizer.tsx` swallow errors without user feedback. Print pricing and product data failing silently means the user sees a broken price with no explanation.

- **`order_items` insert has no schema validation.** In `apps/client/src/app/api/leads/route.ts`, `order_items` is mapped and inserted directly from the raw request body with only a loose type annotation. A malformed payload could insert garbage data.

#### Medium

- **`pages/orders/page.tsx` is 1,139 lines.** The Kanban board, detail drawer, touch drag, contact editing, tag management, and note saving are all in one file. This is a maintenance burden. The detail drawer alone should be its own component.

- **`PREDEFINED_TAGS` is defined in both `orders/page.tsx` and referenced from `@udo-craft/shared`.** Single source of truth is broken here.

- **No retry logic on Supabase storage uploads.** Transient network failures on file upload result in a hard error with no retry. Given that uploads are a core user action, at least one retry attempt is warranted.

- **`console.error` is the only production error logging.** Sentry is installed and configured but API route errors are only logged to console. `Sentry.captureException()` should be called in catch blocks for server-side errors.

- **Missing `<Suspense>` boundaries.** Several pages use `useSearchParams()` without wrapping in `<Suspense>`, which causes Next.js 14 build warnings and can break static rendering.

#### Low

- **Hardcoded `#1B18AC` hex in `LayersPanel.tsx`.** Should use `var(--color-primary)` or a Tailwind token.
- **Native `<select>` elements in client `LayersPanel`.** Inconsistent with the shadcn/ui `<Select>` used everywhere else.
- **`void sizeChart` in admin `Customizer.tsx`.** A prop is accepted and immediately discarded. Either use it or remove it from the interface.
- **`eslint-disable` comments** are used in several places to suppress legitimate warnings (missing deps in `useEffect`) rather than fixing the underlying issue.

---

## 2. UX / UI Design

### Score: 7.2 / 10

### Strengths

- **Canvas customizer UX is the product's crown jewel.** The sidebar tab navigation, animated panel, mobile bottom sheets, layer management, and contextual toolbar are all well-thought-out. The touch drag on the Kanban is a nice detail.
- **Admin Kanban is functional and fast.** Optimistic updates on status change, resizable detail drawer, real-time notifications — this is a solid internal tool.
- **Landing page has good visual hierarchy.** Hero → Stats → Collections → How It Works → Why Us → Testimonials → Contact is a textbook B2B landing structure and it's executed cleanly.
- **Mobile responsiveness is taken seriously.** Bottom sheets, tab bars, and touch drag all exist. This is more than most internal tools bother with.
- **Micro-interactions are present.** Framer Motion animations on the customizer panel, hover states, active scale transforms — the UI feels alive.

### Issues

#### Critical

- **No empty state for the customizer when no product is selected.** If a user navigates to `/order` without a product context, the experience is undefined. There should be a product picker or redirect.

- **Cart is session-only with no persistence.** If the user closes the tab, their cart is gone. For a B2B platform where customers may spend 20+ minutes configuring an order, this is a significant trust and conversion issue. At minimum, persist to `localStorage`; ideally sync to Supabase for logged-in users.

- **No order confirmation screen.** After submitting an order, the user is redirected but there's no dedicated "Your order was received" page with an order number, summary, and next steps. This is a critical trust signal in e-commerce.

#### High

- **The checkout flow is unclear.** The path from "Add to cart" → "Submit order" is not obvious from the landing page. The CTA says "Почати проєкт" which leads to the customizer, but the actual checkout/lead submission flow is buried. B2B buyers need to understand the commitment level before they start.

- **No size guide in the customizer.** `sizeChart` is accepted as a prop but immediately discarded (`void sizeChart`). Size selection is present but there's no reference chart. For apparel, this is a conversion killer — buyers won't commit to a size without a guide.

- **Testimonials are hardcoded and obviously fake.** Three testimonials with generic Ukrainian names, all 5 stars, all perfectly formatted. Real social proof requires real names, real companies, and ideally photos or logos. Hardcoded testimonials actively damage credibility with sophisticated B2B buyers.

- **The cabinet has no onboarding state.** A new user who logs in and has no orders sees "Замовлень ще немає" with a link to the catalog. There's no guidance on what to do next, no sample order, no explainer. First-time users need more hand-holding.

- **Mobile nav has no active state indicator.** The hamburger menu opens correctly but there's no visual indication of the current page in the nav links.

- **Analytics page has no empty state for zero data.** If `site_events` table is empty (new deployment), the page shows zeros with no explanation. A "No data yet — events will appear here once visitors arrive" message would be more professional.

#### Medium

- **Color picker in the customizer has no label on hover for mobile.** On desktop, `title` attribute shows the color name. On mobile, there's no equivalent — users can't identify colors without tapping.

- **The "Приміряти на людину" (AI try-on) button is disabled when there are no layers.** The disabled state is correct, but there's no tooltip explaining why. Users may not understand the dependency.

- **Print type assignment UI is not discoverable.** Users can assign DTF, embroidery, etc. to layers, but this is hidden in the layers panel. Most customers won't know to look there, and the pricing impact is significant.

- **No progress indicator during order submission.** The "Додати до замовлення" button shows a spinner, but there's no indication of what's happening (uploading mockup, saving to database, etc.) for what can be a 5–10 second operation.

- **The admin messages page has no unread count in the sidebar nav.** The Kanban shows real-time notifications via toast, but the `/messages` nav item has no badge. Admins can miss messages.

#### Low

- **Hero background image references `/hero-bg.jpg` which doesn't exist in `/public`.** The `opacity-40` overlay hides the broken image, but it's still a 404 in the network tab.
- **`/designer-bg.jpg` same issue** in the Services section.
- **Footer is missing.** The landing page ends with the contact form and no footer — no legal links, no social links beyond the contact section, no copyright.

---

## 3. Marketing

### Score: 7.4 / 10

### Strengths

- **The value proposition is clear and differentiated.** "Одяг, який стає частиною вашої корпоративної ДНК" is a strong, memorable positioning statement that goes beyond "we print t-shirts."
- **The B2B focus is explicit and consistent.** "Від 10 одиниць", "B2B Мерч-платформа", "Ваш мерч — це інструмент стратегічної комунікації" — the messaging is targeted and avoids the trap of trying to appeal to everyone.
- **"Box of Touch" is a clever product concept.** A sample kit that lets buyers feel quality before committing to a run is a smart conversion tool and a differentiator.
- **The "How It Works" section is well-structured.** Three clear steps with CTAs reduce friction and set expectations correctly.
- **Microsoft Clarity is integrated.** Heatmaps and session recordings are available for UX research.
- **Analytics infrastructure exists.** `site_events` table with session tracking, customization funnel events, and form submissions shows marketing maturity.

### Issues

#### Critical

- **No SEO metadata.** The client app has no `<title>`, `<meta description>`, Open Graph tags, or structured data. For a B2B platform that should rank for "корпоративний мерч Україна" and similar queries, this is a significant missed opportunity. Next.js 14 App Router makes this trivial with the `metadata` export.

- **No blog or content marketing.** B2B merch is a considered purchase. Buyers research before they buy. There's no content (case studies, "how to choose print type", "corporate merch ROI") to capture top-of-funnel traffic or build authority.

- **Social proof is weak.** Three hardcoded testimonials with no photos, no company logos, no case studies. For B2B, logos of recognizable clients ("Trusted by...") are far more persuasive than anonymous reviews.

#### High

- **No email capture or nurture flow.** The contact form submits a lead, but there's no automated email sequence (confirmation, follow-up, educational content). The first touchpoint after form submission is a human manager — which doesn't scale and creates delays.

- **No pricing transparency.** The landing page has no pricing information. B2B buyers often want a ballpark before investing time in a customizer. A "Starting from X ₴ per unit" or a pricing calculator would reduce drop-off.

- **The "Почати проєкт" CTA is vague.** It leads to the customizer, which is correct, but "Start a project" implies a longer commitment than "Browse products" or "Design your merch." The CTA should match the actual next step.

- **No retargeting or remarketing setup.** There's no Facebook Pixel, Google Ads tag, or similar. Users who visit and leave cannot be retargeted. For a B2B platform with a long sales cycle, retargeting is essential.

- **Instagram and Telegram links in the contact section are placeholders.** The icons are rendered but the `href` values need to be verified — if they're `#` or dead links, it damages credibility.

#### Medium

- **The stats section ("500+ задоволених клієнтів", "14 дн середній термін") are hardcoded.** If these numbers are real, they should be sourced from the database and updated automatically. If they're aspirational, they're misleading.

- **No case studies or portfolio.** "Аліна Мороз, Brand Manager, RetailGroup" ordered 200 shirts for a conference — that's a great story. A dedicated case study page with photos of the actual product would be far more persuasive than a text testimonial.

- **The "Найми дизайнера" service card references a background image that doesn't exist.** The `bg-black/60` overlay hides it, but the service itself has no pricing, no portfolio, and no clear CTA beyond "Обговорити проєкт."

- **No Google Analytics or GA4.** Microsoft Clarity is good for UX research but doesn't provide the acquisition channel data (organic, paid, referral, direct) needed for marketing decisions. GA4 should be added alongside Clarity.

- **No sitemap or robots.txt.** Basic SEO infrastructure is missing.

#### Low

- **The brand name "U:DO Craft" has inconsistent capitalization** across the codebase (`U:DO`, `UDO`, `udo-craft`). Pick one and be consistent in all customer-facing copy.
- **No favicon beyond the default Next.js one.** The `logo.png` exists in `/public` but isn't referenced as a favicon.

---

## 4. Infrastructure & DevOps

### Score: 8.0 / 10

### Strengths

- **Vercel + Supabase is the right stack** for this scale. Auto-deploys, preview URLs, edge functions — all handled without ops overhead.
- **Two Supabase environments** (production + dev) with branch-based deployments is correct practice.
- **Husky pre-commit hook** blocking `.env` commits is a good safety net.
- **CI runs type-check and lint on every PR.** The gate is minimal but it's there.

### Issues

- **CI has a `test` job that runs `npm run test`** but there are no tests in the codebase yet (Vitest and fast-check are installed but unused). The job will either fail or pass vacuously. Write at least smoke tests for the shared schema validation.
- **No automated database migration tooling.** Schema changes require manual Supabase dashboard edits. As the team grows, this becomes a coordination problem. Consider Supabase migrations or a tool like `dbmate`.
- **`--legacy-peer-deps` in the Vercel install command** is a smell. It suggests dependency conflicts that should be resolved rather than suppressed.
- **No health check monitoring.** `/api/health` exists and is well-implemented, but there's no external uptime monitor (UptimeRobot, Better Uptime) pinging it. Downtime goes undetected until a customer reports it.

---

## 5. Roadmap Assessment

The two in-progress specs are well-chosen:

**Canvas Editor v2** — The current sidebar is already implemented (the spec is partially done). The remaining work (Draw panel with freehand tools, richer text controls, print presets from Supabase) will meaningfully differentiate the product. The spec is detailed and implementation-ready.

**AI Image Generation** — Already implemented in both apps. The Gemini integration, system prompt constraints, and canvas layer integration are all in place. The `NEXT_PUBLIC_GEMINI_API_KEY` exposure issue needs to be fixed before this goes to production.

**Missing from the roadmap:**
- Email notifications to customers (order confirmation, status updates)
- Invoice/quote generation improvements (the PDF generator exists but unit prices are estimated)
- Product search and filtering on the landing page
- Admin bulk operations (bulk status change, bulk export)
- Customer re-order flow (the cabinet shows past orders but there's no "reorder" button)

---

## Priority Fix List

### Do immediately
1. Rename `NEXT_PUBLIC_GEMINI_API_KEY` → `GEMINI_API_KEY` (security)
2. Add SEO metadata to the client app (marketing impact)
3. Fix missing hero/designer background images (visual quality)
4. Add a footer to the landing page (professionalism)
5. Remove the 2-second `sessionStorage` polling interval (performance)

### Do this sprint
6. Implement rate limiting on `/api/leads`, `/api/upload`, `/api/ai/generate`
7. Persist cart to `localStorage` (conversion)
8. Add an order confirmation page (trust)
9. Implement the size chart display in the customizer (conversion)
10. Add `Sentry.captureException()` to API route catch blocks (observability)

### Do next sprint
11. Replace hardcoded testimonials with real ones or remove them
12. Add GA4 alongside Microsoft Clarity
13. Add email confirmation on lead creation (Resend or Supabase Edge Functions)
14. Break `orders/page.tsx` into smaller components
15. Write smoke tests for shared schema validation

---

## Scores Summary

| Dimension | Score |
|---|---|
| Software Engineering | 7.5 / 10 |
| UX / UI Design | 7.2 / 10 |
| Marketing | 7.4 / 10 |
| Infrastructure & DevOps | 8.0 / 10 |
| **Overall** | **7.4 / 10** |

The platform is genuinely good — better than most at this stage. The canvas customizer alone is a competitive advantage. The path to 9/10 runs through: fixing the security gaps, adding SEO, replacing fake social proof with real, and shipping the email notification layer. None of these are hard problems.
