---
inclusion: always
---

# U:DO Craft — Project Guide

## Stack Overview

**Monorepo** (npm workspaces + Turborepo)

```
udo-craft/
├── apps/
│   ├── admin/     → Next.js 14, internal dashboard (admin.u-do-craft.store, port 3001)
│   └── client/    → Next.js 14, customer-facing store (u-do-craft.store, port 3000)
├── packages/
│   ├── shared/    → Zod schemas, TypeScript types, shared constants + hooks
│   ├── ui/        → Shared React components (MockupViewer, BrandLogo, ClarityInit)
│   ├── config/    → Shared Tailwind config
│   └── styles/    → Global CSS
├── .github/
│   └── workflows/ → ci.yml (type-check + lint on PRs), deploy.yml (not used — Vercel GitHub integration handles deploys)
└── .husky/        → pre-commit hook (blocks .env commits)
```

**Key tech:** Next.js 14 · React 18 · TypeScript 5 · Tailwind CSS · Supabase (Postgres + Auth + Storage + Realtime) · Fabric.js 5 (canvas editor) · Zod · Sentry · Vercel

---

## Apps

### Admin (`apps/admin`) — port 3001

Internal dashboard for managing the business.

| Route | Purpose |
|---|---|
| `/` | Dashboard with KPI badges |
| `/orders` | Kanban board: draft → new → in_progress → production → completed → archived |
| `/orders/new` | Admin-initiated order creator with full canvas customizer |
| `/products` | Product catalog, color variants, print zones, pricing |
| `/categories` | Category management |
| `/materials` | Color/material swatches |
| `/clients` | Customer list |
| `/messages` | Chat with customers (Telegram integration) |
| `/analytics` | Revenue, order, and conversion metrics |
| `/settings` | Notification preferences |

Auth enforced at middleware level (`src/middleware.ts`). No per-route permission stubs.

### Client (`apps/client`) — port 3000

Customer-facing B2B merch platform.

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, collections, services, contact form |
| `/order` | Interactive product customizer (Fabric.js canvas) |
| `/cabinet` | Customer account — order history, messages |

---

## Shared Packages

### `@udo-craft/shared`

Single source of truth for all data shapes, constants, and shared logic. **Update here first when changing DB schema.**

```ts
// Zod schemas + inferred types
import { ProductSchema, LeadSchema, OrderItemSchema, CreateLeadSchema } from "@udo-craft/shared";

// Canvas constants
import { PRINT_TYPES, TEXT_FONTS, type PrintLayer, type PrintTypeId } from "@udo-craft/shared";

// Order constants
import { DISCOUNT_TIERS, PREDEFINED_TAGS } from "@udo-craft/shared";

// Shared canvas/customizer hook
import { useCustomizer } from "@udo-craft/shared";
```

**`CreateLeadSchema`** validates both `/api/leads` POST handlers — returns `{ error: { fieldErrors } }` on invalid input.

**`useCustomizer(config)`** encapsulates `addLayer`, `addTextLayer`, `resolveLayerPrice`, `handleAddToCart`:
```ts
// Client
useCustomizer({ uploadUrl: "/api/upload", uploadResponseKey: "urls[0]" })
// Admin
useCustomizer({ uploadUrl: "/api/upload", uploadResponseKey: "results[0].url", uploadTags: "print" })
```

### `@udo-craft/ui`

```ts
import { MockupViewer, BrandLogo, ClarityInit } from "@udo-craft/ui";
```

---

## Database (Supabase)

Two Supabase projects:
- **Production** — `main` branch / production Vercel deployments
- **`udocraft-dev`** — `develop` branch / staging

**Key tables:**
- `leads` — orders (status, customer_data JSON, total_amount_cents, tags, notes)
- `order_items` — line items (product_id, size, color, custom_print_url, mockup_url, technical_metadata JSON)
- `products` — catalog (name, base_price_cents, images JSON, available_sizes)
- `product_color_variants` — color options per product (material_id, images JSON)
- `materials` — color swatches (name, hex_code)
- `categories` — product categories (name, slug, sort_order)
- `print_zones` — print areas per product side (x, y, width, height, allowed_print_types)
- `print_type_pricing` — pricing tiers by print type and quantity
- `messages` — chat between admin and customers
- `size_charts` — size tables per product

**Lead statuses:** `draft → new → in_progress → production → completed → archived`

**Discount tiers:** 10–49 units = 5%, 50–99 = 12%, 100+ = 15%

---

## Environment Variables

### Admin (`apps/admin/.env`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only
NEXT_PUBLIC_APP_URL=              # https://admin.u-do-craft.store in prod
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
NEXT_PUBLIC_SENTRY_DSN=           # optional
```

### Client (`apps/client/.env`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=              # https://u-do-craft.store in prod
NEXT_PUBLIC_SENTRY_DSN=           # optional
```

`.env` files are never committed — blocked by `.husky/pre-commit`. All production values are set in the Vercel dashboard.

---

## Local Development

```bash
# Always from repo root
npm install

npm run dev        # both apps in parallel
npm run dev:admin  # admin only → localhost:3001
npm run dev:client # client only → localhost:3000
```

---

## Builds

```bash
npm run build          # shared → ui → admin → client (correct order)
npm run build:shared
npm run build:admin
npm run build:client
npm run type-check     # TypeScript check across all packages
npm run lint           # lint all packages
```

---

## Git & Branch Strategy

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production | `admin.u-do-craft.store` + `u-do-craft.store` |
| `develop` | Staging | Vercel preview URLs |
| `feature/*` | New features | PR preview only |
| `fix/*` | Bug fixes | PR preview only |

**Workflow:**
```bash
git checkout develop && git pull origin develop
git checkout -b feature/my-feature

# work...

git push origin feature/my-feature
# Open PR → develop → CI runs → merge → staging
# Open PR → develop → main → merge → production
```

**Never push directly to `main`.**

---

## Deployment

### Standard — just push

```bash
git push origin main     # → production
git push origin develop  # → staging preview
```

Vercel GitHub integration handles both apps automatically. No CLI needed.

### Vercel project settings (already configured)

Both projects use:
- Root Directory: `apps/admin` or `apps/client`
- Include files outside root: ON
- Install: `cd ../.. && npm install --legacy-peer-deps`
- Build: `cd ../.. && npm run build:admin` (or `:client`)

### Vercel projects

| App | Project ID | Domain |
|---|---|---|
| Admin | `prj_UKfsyyoJDIIhJ67xXqSnBy2c7zmk` | `admin.u-do-craft.store` |
| Client | `prj_GTScm9WnDiwD837rrOKHsXiFRsFS` | `u-do-craft.store` |
| Org | `team_XX3rqg5IE2XdK6oxIVibJTt6` | — |

---

## Common Issues & Fixes

**"Cannot find module '@udo-craft/shared'"** — build ran from inside an app. Always build from repo root.

**"No Next.js version detected"** — Vercel project Root Directory is wrong. Must be `apps/admin` or `apps/client`.

**"Missing required Supabase environment variable"** — add env vars in Vercel dashboard.

**Admin shows "loading forever"** — log in at `/login`, or clear cookies.

**Telegram notifications not working** — call `GET /api/telegram/setup` once after deploying admin.

**POST /api/leads returns 400 with fieldErrors** — correct behavior. Payload must include `status` and `customer_data.name`.

---

## Order Flow (End-to-End)

1. Customer visits `u-do-craft.store`, browses products
2. Opens customizer → `/order` (Fabric.js canvas editor)
3. Uploads design, positions it, selects size/color/quantity
4. Submits → `POST /api/leads` (validated by `CreateLeadSchema`)
5. Lead + order_items saved to Supabase
6. Admin sees new order in Kanban via Supabase Realtime
7. Admin moves order: `new → in_progress → production → completed`
8. Customer tracks status in `/cabinet`
