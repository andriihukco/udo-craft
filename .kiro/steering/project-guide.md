---
inclusion: always
---

# U:DO Craft — Project Guide

## Stack Overview

**Monorepo** (npm workspaces + Turborepo)

```
udo-craft/
├── apps/
│   ├── admin/     → Next.js 14, internal dashboard (admin.u-do-craft.store)
│   └── client/    → Next.js 14, customer-facing store (u-do-craft.store)
├── packages/
│   ├── shared/    → Zod schemas, TypeScript types, shared constants + hooks
│   ├── ui/        → Shared React components (MockupViewer, BrandLogo, ClarityInit)
│   ├── config/    → Shared Tailwind config
│   └── styles/    → Global CSS
├── .github/
│   └── workflows/ → ci.yml (type-check + lint on PRs), deploy.yml (Vercel on push)
└── .husky/        → pre-commit hook (blocks .env commits)
```

**Key tech:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage) · Fabric.js (canvas editor) · Sentry · Vercel

---

## Apps

### Admin (`apps/admin`) — port 3001
Internal dashboard for managing the business.

| Route | Purpose |
|---|---|
| `/` | Dashboard with KPI badges |
| `/orders` | Kanban board: draft → new → in_progress → production → completed → archived |
| `/products` | Product catalog, color variants, print zones, pricing |
| `/categories` | Category management |
| `/materials` | Color/material swatches |
| `/clients` | Customer list |
| `/messages` | Chat with customers (Telegram integration) |
| `/analytics` | Revenue, order, and conversion metrics |
| `/settings` | Notification preferences |

All pages require Supabase auth. Middleware (`src/middleware.ts`) redirects unauthenticated users to `/login`. Auth is enforced at middleware level — no per-route permission stubs.

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
Single source of truth for all data shapes, constants, and shared logic.

```ts
// Zod schemas + types
import { Product, Lead, OrderItem, LeadStatus, CreateLeadSchema } from "@udo-craft/shared";

// Print types and canvas constants
import { PRINT_TYPES, TEXT_FONTS, type PrintLayer, type PrintTypeId } from "@udo-craft/shared";

// Order constants
import { DISCOUNT_TIERS, PREDEFINED_TAGS } from "@udo-craft/shared";

// Shared canvas/customizer hook
import { useCustomizer } from "@udo-craft/shared";
```

When adding new DB columns or changing data shapes, update `packages/shared/index.ts` first.

**`CreateLeadSchema`** is used by both `/api/leads` POST handlers for Zod validation — returns structured `{ error: { fieldErrors } }` on invalid input.

**`useCustomizer(config)`** encapsulates `addLayer`, `addTextLayer`, `resolveLayerPrice`, and `handleAddToCart` with app-specific upload config:
```ts
// Client
useCustomizer({ uploadUrl: "/api/upload", uploadResponseKey: "urls[0]" })
// Admin
useCustomizer({ uploadUrl: "/api/upload", uploadResponseKey: "results[0].url", uploadTags: "print" })
```

### `@udo-craft/ui`
Shared React components used in both apps.

```ts
import { MockupViewer, BrandLogo, ClarityInit } from "@udo-craft/ui";
```

Add new components here if they're needed in both apps.

---

## Database (Supabase)

Two Supabase projects:
- **Production** — used by `main` branch / production Vercel deployments
- **`udocraft-dev`** — used by `develop` branch / staging Vercel deployments

**Key tables:**
- `leads` — orders (status, customer_data JSON, total_amount_cents, tags, notes)
- `order_items` — line items per lead (product_id, size, color, custom_print_url, mockup_url, technical_metadata JSON)
- `products` — catalog (name, base_price_cents, images JSON, available_sizes, discount_grid)
- `product_color_variants` — color options per product (material_id, images JSON)
- `materials` — color swatches (name, hex_code)
- `categories` — product categories (name, slug, sort_order)
- `print_zones` — print areas per product side (x, y, width, height, allowed_print_types)
- `print_type_pricing` — pricing tiers by print type and quantity
- `messages` — chat between admin and customers
- `size_charts` — size tables per product

**Auth:** Supabase Auth. Admin users log in via email/password. Client users can optionally create accounts.

---

## Environment Variables

### Admin (`apps/admin/.env`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only, never expose to client
NEXT_PUBLIC_APP_URL=              # https://admin.u-do-craft.store in prod
TELEGRAM_BOT_TOKEN=               # from @BotFather
TELEGRAM_WEBHOOK_SECRET=          # any random string
NEXT_PUBLIC_SENTRY_DSN=           # optional, from sentry.io
```

### Client (`apps/client/.env`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=              # https://u-do-craft.store in prod
NEXT_PUBLIC_SENTRY_DSN=           # optional
```

`.env` files are never committed — blocked by the pre-commit hook in `.husky/pre-commit`. All production/staging values are set in the Vercel dashboard.

---

## Local Development

```bash
# Install all dependencies (run from repo root — never from inside an app)
npm install

# Start both apps simultaneously
npm run dev
# admin → http://localhost:3001
# client → http://localhost:3000

# Start individually
npm run dev:admin
npm run dev:client
```

---

## Builds

```bash
# Build everything (correct order: shared → ui → admin → client)
npm run build

# Build individually
npm run build:shared
npm run build:admin
npm run build:client
```

---

## Git & Branch Strategy

| Branch | Purpose | Auto-deploys to |
|---|---|---|
| `main` | Production | `admin.u-do-craft.store` + `u-do-craft.store` |
| `develop` | Staging / integration | Vercel preview URLs |
| `feature/*` | New features | No auto-deploy (PR only) |
| `fix/*` | Bug fixes | No auto-deploy (PR only) |

**Workflow:**
1. Branch off `develop`: `git checkout -b feature/my-feature develop`
2. Work and commit locally
3. Push and open a PR → `develop`
4. CI runs type-check + lint automatically
5. Merge to `develop` → staging deploy
6. When ready for production: open PR `develop` → `main` and merge

**Never push directly to `main`.**

---

## Deployment

### Automatic (recommended)
```bash
git push origin main    # → production
git push origin develop # → staging preview
```

GitHub Actions (`.github/workflows/deploy.yml`) handles everything.

### Required GitHub Secrets (one-time setup)
Go to GitHub → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Get from [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_XX3rqg5IE2XdK6oxIVibJTt6` |

### Vercel Projects
| App | Project ID | Domain |
|---|---|---|
| Admin | `prj_uNMByvkPtFNKthWbXcbTTdDOvIt2` | `admin.u-do-craft.store` |
| Client | `prj_GTScm9WnDiwD837rrOKHsXiFRsFS` | `u-do-craft.store` |

### Manual CLI Deploy
```bash
vercel deploy --prod --yes --cwd=apps/admin
vercel deploy --prod --yes --cwd=apps/client
```

See [DEPLOYMENT.md](../../DEPLOYMENT.md) for full details.

---

## CI/CD Pipeline

**On every PR to `main` or `develop`** (`.github/workflows/ci.yml`):
- Type check (`npm run type-check`)
- Lint (`npm run lint`)

**On push to `main` or `develop`** (`.github/workflows/deploy.yml`):
- Deploy admin to Vercel (prod on `main`, preview on `develop`)
- Deploy client to Vercel (prod on `main`, preview on `develop`)

---

## Order Flow (End-to-End)

1. Customer visits `u-do-craft.store`, browses products
2. Clicks "Customize" → `/order` page with Fabric.js canvas editor
3. Uploads design, positions it, selects size/color/quantity
4. Submits order form → `POST /api/leads` (validated by `CreateLeadSchema`)
5. Lead + order_items saved to Supabase
6. Admin receives real-time notification (Supabase subscription)
7. Admin sees new order in Kanban at `admin.u-do-craft.store/orders`
8. Admin moves order through statuses: new → in_progress → production → completed
9. Customer can track status in `/cabinet`

---

## Common Issues & Fixes

### Admin shows "loading forever"
**Cause:** API routes return 401. **Fix:** Log in at `/login`, or clear cookies and try again.

### `npm install` fails on Vercel
**Cause:** Missing `vercel.json` in app directory. **Fix:** Ensure both `apps/admin/vercel.json` and `apps/client/vercel.json` exist with `"installCommand": "cd ../.. && npm install"`.

### Build fails: "Cannot find module '@udo-craft/shared'"
**Cause:** Build ran from inside an app directory. **Fix:** Always run builds from repo root.

### Supabase auth not working after deploy
**Cause:** Missing env vars in Vercel. **Fix:** Check Vercel dashboard → Project Settings → Environment Variables.

### Telegram notifications not working
**Cause:** Webhook not registered. **Fix:** Call `GET /api/telegram/setup` once after deploying admin.

### POST /api/leads returns 400 with fieldErrors
This is correct behavior — `CreateLeadSchema` validation is active. Ensure the payload includes `status` and `customer_data.name`.

---

## Useful Commands

```bash
# Type check all packages
npm run type-check

# Lint everything
npm run lint

# Check what's tracked by git (should be empty for .env)
git ls-files "**/.env"

# View Vercel deployments
cd apps/admin && vercel ls

# View Vercel env vars
cd apps/admin && vercel env ls
```
