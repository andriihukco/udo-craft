# Requirements Document

## Introduction

The U:DO Craft platform is a Next.js 14 monorepo with two apps: `apps/client` (customer-facing store) and `apps/admin` (internal dashboard). A pre-launch audit identified critical security gaps, missing SEO infrastructure, absent error boundaries, and several high-priority UX and performance issues that must be resolved before go-live and in the first post-launch sprint.

This document captures requirements for all items in the **Critical** tier (must fix before go-live) and the **High Priority** and **Medium** tiers (fix in week 1 post-launch), as identified in `PRE_LAUNCH_AUDIT.md`.

---

## Glossary

- **Middleware**: Next.js edge middleware (`middleware.ts`) that runs before a request reaches a route handler or page
- **Cabinet**: The authenticated customer account area at `/cabinet` and its sub-routes in `apps/client`
- **Rate_Limiter**: The server-side component responsible for counting and throttling requests per IP address
- **Upload_Route**: The API route handlers at `/api/upload` and `/api/cabinet/upload` in `apps/client`
- **MIME_Type**: The media type string (e.g. `image/jpeg`, `application/pdf`) that identifies a file's format
- **Error_Boundary**: A Next.js App Router `error.tsx` file that catches unhandled React errors within a route segment
- **SEO_Metadata**: Structured metadata including Open Graph tags, Twitter Card tags, canonical URLs, JSON-LD structured data, `robots.txt`, and `sitemap.xml`
- **Service_Role_Key**: The Supabase `SUPABASE_SERVICE_ROLE_KEY` that bypasses all Row Level Security policies
- **RLS**: Row Level Security — Supabase Postgres policies that restrict data access per authenticated user
- **Skeleton**: A placeholder UI component that mimics the layout of loading content
- **BroadcastChannel**: A browser API for same-tab and cross-tab communication without polling
- **Honeypot**: A hidden form field invisible to human users but filled by bots, used to detect automated submissions
- **Webhook_Handler**: The API route at `/api/telegram/webhook` in `apps/admin` that receives Telegram bot updates
- **Hero_Section**: The full-viewport introductory section of the landing page containing a background video
- **Server_Component**: A Next.js React Server Component that renders on the server and is not included in the client JavaScript bundle
- **Cart_Hook**: A custom React hook that manages cart state synchronisation across browser tabs

---

## Requirements

### Requirement 1: Cabinet Route Protection via Edge Middleware

**User Story:** As a security engineer, I want all `/cabinet` routes to be protected at the edge, so that unauthenticated users cannot access cabinet pages or API routes even before React renders.

#### Acceptance Criteria

1. THE `apps/client` app SHALL contain a `src/middleware.ts` file that intercepts all requests matching `/cabinet` and `/cabinet/*` paths.
2. WHEN an unauthenticated request reaches any `/cabinet/*` page route, THE Middleware SHALL redirect the request to `/cabinet/login`.
3. WHEN an authenticated request reaches `/cabinet/login`, THE Middleware SHALL redirect the request to `/cabinet`.
4. THE Middleware SHALL refresh the Supabase session cookie on every matched request using the same `updateSession` pattern used in `apps/admin/src/lib/supabase/middleware.ts`.
5. THE Middleware SHALL exclude `_next/static`, `_next/image`, `favicon.ico`, and static asset file extensions from its matcher pattern.
6. WHEN the Supabase environment variables are absent, THE Middleware SHALL allow the request through rather than entering an infinite redirect loop.

---

### Requirement 2: Rate Limiting on Public API Endpoints

**User Story:** As a security engineer, I want public API endpoints to enforce per-IP request limits, so that bots cannot spam fake leads or exhaust Supabase storage.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/leads`, THE Rate_Limiter SHALL allow a maximum of 5 requests per IP address per 60-second window.
2. WHEN a POST request is received at `/api/upload`, THE Rate_Limiter SHALL allow a maximum of 10 requests per IP address per 60-second window.
3. IF a request exceeds the rate limit, THEN THE Rate_Limiter SHALL return an HTTP 429 response with a JSON body `{ "error": "Too many requests" }`.
4. THE Rate_Limiter SHALL derive the client IP address from the `x-forwarded-for` header when running behind Vercel's edge network, falling back to the request's remote address.
5. WHERE Upstash Redis environment variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are configured, THE Rate_Limiter SHALL use Upstash Redis sliding-window counters.
6. WHERE Upstash Redis environment variables are absent, THE Rate_Limiter SHALL use an in-memory fallback so that the application continues to function in local development.

---

### Requirement 3: Server-Side File Validation on Upload Routes

**User Story:** As a security engineer, I want upload API routes to validate file type and size on the server, so that attackers cannot bypass client-side checks to upload malicious or oversized files.

#### Acceptance Criteria

1. WHEN a file is received at `/api/upload` or `/api/cabinet/upload`, THE Upload_Route SHALL validate the file's MIME type against an allowlist of `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`, and `application/pdf`.
2. IF a file's MIME type is not in the allowlist, THEN THE Upload_Route SHALL reject the request with an HTTP 400 response and a JSON body `{ "error": "Invalid file type" }` without calling `supabase.storage.upload()`.
3. WHEN a file is received at `/api/upload` or `/api/cabinet/upload`, THE Upload_Route SHALL validate that the file size does not exceed 10 MB (10 × 1024 × 1024 bytes).
4. IF a file's size exceeds 10 MB, THEN THE Upload_Route SHALL reject the request with an HTTP 400 response and a JSON body `{ "error": "File too large" }` without calling `supabase.storage.upload()`.
5. THE Upload_Route SHALL perform MIME type and size validation before reading the full file buffer into memory.

---

### Requirement 4: SEO Metadata, Open Graph, and Structured Data

**User Story:** As a marketing manager, I want the client app to have complete SEO metadata, so that pages are indexed correctly by search engines and display rich previews when shared on social platforms.

#### Acceptance Criteria

1. THE root `layout.tsx` in `apps/client` SHALL export a `metadata` object that includes `openGraph` fields: `title`, `description`, `url`, `siteName`, `images` (with at least one image URL, width, height, and alt text), `locale`, and `type`.
2. THE root `layout.tsx` in `apps/client` SHALL export a `metadata` object that includes `twitter` fields: `card` set to `"summary_large_image"`, `title`, `description`, and `images`.
3. THE `apps/client/src/app/robots.ts` file SHALL exist and export a `robots()` function that returns rules allowing all crawlers on the client app and references the sitemap URL.
4. THE `apps/client/src/app/sitemap.ts` file SHALL exist and export a `sitemap()` function that returns at minimum the root URL `/`, `/order`, and `/cabinet` with `lastModified` and `changeFrequency` values.
5. THE root `layout.tsx` in `apps/client` SHALL include a JSON-LD `<script type="application/ld+json">` tag in the `<head>` containing an `Organization` schema with `name`, `url`, and `logo`.
6. THE `apps/admin/src/app/robots.ts` file SHALL exist and export a `robots()` function that returns `{ rules: { userAgent: "*", disallow: "/" } }` to prevent search engines from indexing the admin app.

---

### Requirement 5: Error Boundaries for Client App Route Segments

**User Story:** As a UX designer, I want unhandled React errors to show a recovery UI instead of a blank white screen, so that users can retry or navigate away without losing context.

#### Acceptance Criteria

1. THE `apps/client/src/app/error.tsx` file SHALL exist as a global error boundary and SHALL render a user-facing error message in Ukrainian with a "Спробувати знову" retry button that calls the `reset` function provided by Next.js.
2. THE `apps/client/src/app/order/error.tsx` file SHALL exist as a segment-level error boundary for the `/order` route and SHALL render a recovery UI with a link back to the homepage.
3. THE `apps/client/src/app/cabinet/error.tsx` file SHALL exist as a segment-level error boundary for the `/cabinet` route and SHALL render a recovery UI with a link back to the homepage.
4. WHILE an error boundary is active, THE Error_Boundary SHALL log the error and error info to the console.
5. THE `error.tsx` components SHALL be marked `"use client"` as required by the Next.js App Router specification.

---

### Requirement 6: Admin App Search Engine Exclusion

**User Story:** As a security engineer, I want the admin app to be excluded from search engine indexing, so that the admin login page and internal routes do not appear in search results.

#### Acceptance Criteria

1. THE `apps/admin/src/app/robots.ts` file SHALL exist and SHALL export a default `robots()` function.
2. THE `robots()` function SHALL return a `MetadataRoute.Robots` object with `rules` set to `{ userAgent: "*", disallow: "/" }`.
3. THE `robots()` function SHALL include a `host` field set to the admin app's production URL.

---

### Requirement 7: Hero Video Fallback and Poster Image

**User Story:** As a UX designer, I want the hero section to display meaningful content even when the video fails to load, so that users on slow connections or with ad blockers see the brand message immediately.

#### Acceptance Criteria

1. THE hero `<video>` element in `apps/client/src/app/page.tsx` SHALL include a `poster` attribute pointing to a static fallback image (e.g. `/hero-poster.jpg`).
2. WHILE the hero video has not yet loaded, THE Hero_Section SHALL display the hero text content (headline, subheadline, and CTA buttons) with full opacity and legibility.
3. THE Hero_Section SHALL apply a CSS background image fallback on the section element so that a static image is visible if the video element is absent or fails entirely.
4. IF the video fails to load or is blocked, THEN THE Hero_Section SHALL remain fully functional with all interactive elements accessible.

---

### Requirement 8: Replace Raw `<img>` Tags with `next/image`

**User Story:** As a performance engineer, I want product and hero images to use `next/image`, so that the platform benefits from automatic WebP conversion, lazy loading, and responsive `srcset` generation.

#### Acceptance Criteria

1. THE `apps/client/src/app/page.tsx` SHALL replace all raw `<img>` tags used for product images and hero images with the `<Image>` component from `next/image`.
2. THE `apps/client/src/components/ProductCardDetailed.tsx` SHALL replace raw `<img>` tags used for product images with the `<Image>` component from `next/image`.
3. WHEN replacing `<img>` tags with `<Image>`, THE developer SHALL preserve all existing `className`, `alt`, and layout attributes, and SHALL supply `width` and `height` props or use `fill` with a positioned parent container.
4. THE `<img>` tags used inside Fabric.js canvas operations in `ProductCanvas.tsx` SHALL remain as raw `<img>` tags and SHALL NOT be replaced.
5. THE `next.config.mjs` in `apps/client` SHALL include any required external image domains in the `images.remotePatterns` configuration.

---

### Requirement 9: Decompose Monolithic Landing Page Component

**User Story:** As a performance engineer, I want the landing page to use Server Components for static sections, so that the initial HTML payload is server-rendered and the client JavaScript bundle is reduced.

#### Acceptance Criteria

1. THE `apps/client/src/app/page.tsx` file SHALL be refactored so that static sections (hero text, services, stats, popup section) are extracted into separate component files under `apps/client/src/app/_sections/` or `apps/client/src/components/`.
2. WHEN a section contains no client-side interactivity (no `useState`, `useEffect`, event handlers, or browser APIs), THE section component SHALL be a Server Component without a `"use client"` directive.
3. THE cart state synchronisation logic SHALL be extracted into a `useCart` custom hook in `apps/client/src/hooks/useCart.ts`.
4. THE `setInterval` polling for cart state in `apps/client/src/app/page.tsx` SHALL be removed from the `useCart` hook implementation (addressed separately in Requirement 12).
5. THE refactored `apps/client/src/app/page.tsx` SHALL remain functionally equivalent to the original — all sections, navigation, and interactions SHALL continue to work correctly.

---

### Requirement 10: RLS Policies Version-Controlled as SQL Migrations

**User Story:** As a DevOps engineer, I want all Supabase RLS policies to be stored as SQL migration files in the repository, so that the database access control layer can be reproduced on any environment.

#### Acceptance Criteria

1. THE repository SHALL contain a `supabase/migrations/` directory with at least one SQL file capturing the current RLS policies for all tables that have policies defined.
2. THE migration file(s) SHALL include `CREATE POLICY` or `ALTER POLICY` statements for the `leads`, `order_items`, `products`, `messages`, `categories`, `materials`, `print_zones`, and `print_type_pricing` tables.
3. THE migration file(s) SHALL be named following the Supabase CLI convention: `YYYYMMDDHHMMSS_description.sql`.
4. THE `supabase/migrations/` directory SHALL contain a `README.md` explaining how to apply migrations using the Supabase CLI.

---

### Requirement 11: Audit and Reduce Service Role Key Usage in Client App

**User Story:** As a security engineer, I want the client app to use session-based Supabase queries wherever possible, so that the service role key — which bypasses all RLS — is not used for operations that can be scoped to the authenticated user.

#### Acceptance Criteria

1. THE `apps/client` codebase SHALL be audited and a comment block SHALL be added to each API route that uses `createServiceClient()`, documenting why the service role is required for that specific operation.
2. WHEN a client API route reads or writes data that belongs to the currently authenticated user, THE route SHALL use the session-based `createClient()` instead of `createServiceClient()`.
3. THE `/api/cabinet/leads` and `/api/cabinet/messages` routes SHALL use the authenticated user's session to scope Supabase queries, replacing service role usage where RLS policies permit.
4. IF a route genuinely requires the service role (e.g. cross-user reads for admin-initiated operations), THEN THE route SHALL verify that the request is authenticated before using the service role client.

---

### Requirement 12: Loading and Not-Found Pages for Key Routes

**User Story:** As a UX designer, I want key routes to display skeleton loading states and proper 404 pages, so that users on slow connections see meaningful feedback and invalid URLs show a helpful error page.

#### Acceptance Criteria

1. THE `apps/client/src/app/order/loading.tsx` file SHALL exist and SHALL render a skeleton layout that approximates the structure of the order page (product grid skeleton cards).
2. THE `apps/client/src/app/cabinet/loading.tsx` file SHALL exist and SHALL render a skeleton layout that approximates the structure of the cabinet page (order list skeleton rows).
3. THE `apps/client/src/app/not-found.tsx` file SHALL exist and SHALL render a user-facing 404 page in Ukrainian with a link back to the homepage.
4. THE `apps/client/src/app/products/[slug]/not-found.tsx` file SHALL exist and SHALL render a product-not-found page with a link to the `/order` catalogue.
5. THE Skeleton components SHALL use Tailwind CSS `animate-pulse` classes to indicate loading state.

---

### Requirement 13: Replace Cart Polling with Storage Events and BroadcastChannel

**User Story:** As a performance engineer, I want cart state to synchronise via browser events instead of a 2-second polling interval, so that unnecessary CPU and battery usage is eliminated on the landing page.

#### Acceptance Criteria

1. THE `useCart` hook (extracted per Requirement 9) SHALL remove the `setInterval(readCart, 2000)` polling mechanism entirely.
2. THE `useCart` hook SHALL listen for `window.addEventListener("storage", readCart)` to detect cross-tab cart updates.
3. THE `useCart` hook SHALL use a `BroadcastChannel` named `"udo-cart"` to broadcast cart change events within the same browser tab when the cart is modified.
4. THE `useCart` hook SHALL subscribe to the `BroadcastChannel` to receive same-tab cart updates and call `readCart` on each message.
5. WHEN the component using `useCart` unmounts, THE hook SHALL close the `BroadcastChannel` and remove all event listeners to prevent memory leaks.

---

### Requirement 14: Honeypot Spam Protection on Contact Form

**User Story:** As a marketing manager, I want the contact form to include bot detection, so that automated spam submissions are rejected before reaching the database.

#### Acceptance Criteria

1. THE `ContactForm` component in `apps/client/src/components/ContactForm.tsx` SHALL include a hidden honeypot input field with `name="website"`, `tabIndex={-1}`, `aria-hidden="true"`, and `autoComplete="off"`.
2. THE honeypot field SHALL be visually hidden using CSS (`position: absolute; left: -9999px; opacity: 0`) rather than `display: none` or `visibility: hidden`, to avoid detection by sophisticated bots.
3. WHEN the `/api/leads` POST handler receives a request where `customer_data.website` is a non-empty string, THE handler SHALL return an HTTP 200 response with a fake success body `{ "id": "bot-rejected" }` without inserting any data into the database.
4. THE honeypot field value SHALL be passed as `customer_data.website` in the form submission payload.

---

### Requirement 15: Telegram Webhook Signature Verification

**User Story:** As a security engineer, I want the Telegram webhook handler to verify the request signature on every call, so that only genuine Telegram updates are processed.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/telegram/webhook`, THE Webhook_Handler SHALL read the `x-telegram-bot-api-secret-token` header from the request.
2. IF the `TELEGRAM_WEBHOOK_SECRET` environment variable is set and the header value does not match it, THEN THE Webhook_Handler SHALL return an HTTP 403 response and SHALL NOT process the update.
3. IF the `TELEGRAM_WEBHOOK_SECRET` environment variable is set and the header is absent, THEN THE Webhook_Handler SHALL return an HTTP 403 response.
4. WHERE the `TELEGRAM_WEBHOOK_SECRET` environment variable is not set, THE Webhook_Handler SHALL log a warning and allow the request through, to preserve local development functionality.
5. THE secret token comparison SHALL use a constant-time string comparison to prevent timing attacks.

---

### Requirement 16: Store Unit Price and Print Cost per Order Item

**User Story:** As a finance manager, I want each order item to store its unit price and print cost at the time of order creation, so that invoices reflect the actual agreed price rather than a derived estimate.

#### Acceptance Criteria

1. THE `order_items` table in Supabase SHALL have `unit_price_cents` (integer) and `print_cost_cents` (integer) columns.
2. WHEN an order is submitted via `POST /api/leads`, THE handler SHALL persist `unit_price_cents` and `print_cost_cents` for each order item using the values provided in the request payload.
3. THE `OrderItemSchema` in `@udo-craft/shared` SHALL include optional `unit_price_cents` and `print_cost_cents` fields of type `number`.
4. WHEN generating a PDF invoice in `apps/client/src/app/cabinet/page.tsx`, THE Invoice_Generator SHALL use the stored `unit_price_cents` and `print_cost_cents` values from the order item record instead of dividing `total_amount_cents` by quantity.
5. IF `unit_price_cents` is absent on a legacy order item, THEN THE Invoice_Generator SHALL fall back to the current estimation formula `Math.round(total_amount_cents / Math.max(1, totalQty))` to maintain backward compatibility.
