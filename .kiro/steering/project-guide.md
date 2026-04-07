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
│   ├── shared/    → Zod schemas + TypeScript types (source of truth for all data shapes)
│   ├── ui/        → Shared React components
│   ├── config/    → Shared Tailwind config
│   └── styles/    → Global CSS
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

All pages require Supabase auth. Middleware (`src/middleware.ts`) redirects unauthenticated users to `/login`.

### Client (`apps/client`) — port 3000
Customer-facing B2B merch platform.

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, collections, services, contact form |
| `/order` | Interactive product customizer (Fabric.js canvas) |
| `/cabinet` | Customer account — order history, messages |

---

## Database (Supabase)

Single Supabase project shared by both apps.

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

---

## Local Development

```bash
# Install all dependencies (run from repo root)
npm install

# Start both apps simultaneously
npm run dev
# admin → http://localhost:3001
# client → http://localhost:3000

# Start individually
npm run dev:admin
npm run dev:client
```

**Important:** Always run `npm install` from the repo root, never from inside `apps/admin` or `apps/client`. The workspace packages (`@udo-craft/shared`, `@udo-craft/ui`) are resolved from the root `node_modules`.

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

## Deployment

### Vercel Projects
| App | Project | Domain | Project ID |
|---|---|---|---|
| Admin | `udo-craft-admin` | `admin.u-do-craft.store` | `prj_uNMByvkPtFNKthWbXcbTTdDOvIt2` |
| Client | `udo-craft-client` | `u-do-craft.store` | `prj_GTScm9WnDiwD837rrOKHsXiFRsFS` |
| Org ID | `team_XX3rqg5IE2XdK6oxIVibJTt6` | | |

### Recommended: Deploy via Git (Automatic)
The easiest and most reliable way to deploy:

```bash
# Deploy to production (both apps)
git push origin main

# Deploy to staging (both apps)
git push origin develop
```

GitHub Actions (`.github/workflows/deploy.yml`) automatically:
- Builds both apps
- Runs type-check and lint
- Deploys admin to `admin.u-do-craft.store`
- Deploys client to `www.u-do-craft.store`

**This is the recommended approach** — no manual steps, no workarounds.

### Deploy via CLI (Manual)
If you need to deploy manually without pushing to git:

```bash
# Set your Vercel token
export VERCEL_TOKEN=your_token_here

# Deploy both apps
./scripts/deploy.sh

# Deploy only admin
./scripts/deploy.sh admin

# Deploy only client
./scripts/deploy.sh client
```

The script handles all project ID and org ID configuration automatically.

### How Vercel Builds Work (Monorepo)
Each app has its own `vercel.json` config in its directory:
- `apps/admin/vercel.json` — builds admin from root, outputs to `.next`
- `apps/client/vercel.json` — builds client from root, outputs to `.next`

This allows Vercel to resolve workspace packages (`@udo-craft/shared`, `@udo-craft/ui`) correctly.

### Vercel Environment Variables
Set these in the Vercel dashboard for each project:
```bash
# Example: add a var to admin production
cd apps/admin
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

**All env vars must be set in Vercel dashboard** — `.env` files are local only and not deployed.

---

## Git & Branch Strategy

| Branch | Purpose | Auto-deploys to |
|---|---|---|
| `main` | Production | `admin.u-do-craft.store` + `u-do-craft.store` |
| `develop` | Staging / integration | Vercel preview URLs |
| `feature/*` | New features | PR preview URLs |
| `fix/*` | Bug fixes | PR preview URLs |

**Workflow:**
1. Create `feature/my-feature` from `develop`
2. Open PR → `develop` (CI runs: type-check, lint, build)
3. Merge to `develop` → staging deploy
4. When ready: merge `develop` → `main` → production deploy

**Never push directly to `main`.**

---

## Shared Packages

### `@udo-craft/shared`
Source of truth for all data types. Uses Zod schemas — both for runtime validation and TypeScript types.

```ts
import { Product, Lead, OrderItem, LeadStatus } from "@udo-craft/shared";
```

When adding new DB columns or changing data shapes, update `packages/shared/index.ts` first.

### `@udo-craft/ui`
Shared React components. Add new components here if they're used in both apps.

```ts
import { Button } from "@udo-craft/ui";
```

---

## Common Issues & Fixes

### Admin shows "loading forever" for orders/products/etc.
**Cause:** API routes return 401 (not authenticated) but the UI doesn't handle it gracefully.
**Fix:** Make sure you're logged in at `admin.u-do-craft.store/login`. If already logged in, check browser DevTools → Network tab for 401 responses. Clear cookies and log in again.

### `npm install` fails on Vercel
**Cause:** Missing `vercel.json` in the app directory, so Vercel installs from `apps/admin` instead of repo root and can't resolve workspace packages.
**Fix:** Ensure `apps/admin/vercel.json` and `apps/client/vercel.json` both exist with `"installCommand": "cd ../.. && npm install"`.

### Build fails with "Cannot find module '@udo-craft/shared'"
**Cause:** Running build from inside an app directory instead of repo root.
**Fix:** Always run `npm run build:admin` (or `:client`) from the repo root.

### Supabase auth not working after deploy
**Cause:** Missing or wrong env vars in Vercel project settings.
**Fix:** Check Vercel dashboard → Project Settings → Environment Variables. All 3 Supabase vars must be set for Production environment.

### Telegram notifications not working
**Cause:** Webhook not registered, or `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_SECRET` missing.
**Fix:** After deploying admin, call `GET /api/telegram/setup` once to register the webhook.

---

## CI/CD Pipeline (GitHub Actions)

**On every PR to `main` or `develop`** (`.github/workflows/ci.yml`):
- Type check (`npm run type-check`)
- Lint (`npm run lint`)
- Unit tests
- Build both apps

**On push to `develop`** (`.github/workflows/deploy.yml`):
- Deploy to Vercel staging

**On push to `main`** (`.github/workflows/deploy.yml`):
- Deploy admin to production
- Deploy client to production

Required GitHub secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID` = `team_XX3rqg5IE2XdK6oxIVibJTt6`
- `VERCEL_ADMIN_PROJECT_ID` = `prj_uNMByvkPtFNKthWbXcbTTdDOvIt2`
- `VERCEL_CLIENT_PROJECT_ID` = `prj_GTScm9WnDiwD837rrOKHsXiFRsFS`
- `SENTRY_AUTH_TOKEN`

---

## Order Flow (End-to-End)

1. Customer visits `u-do-craft.store`, browses products
2. Clicks "Customize" → `/order` page with Fabric.js canvas editor
3. Uploads design, positions it, selects size/color/quantity
4. Submits order form → `POST /api/leads` (client app)
5. Lead + order_items saved to Supabase
6. Admin receives real-time notification (Supabase subscription)
7. Admin sees new order in Kanban at `admin.u-do-craft.store/orders`
8. Admin moves order through statuses: new → in_progress → production → completed
9. Customer can track status in `/cabinet`

---

## Useful Commands

```bash
# Check TypeScript errors across all packages
npm run type-check

# Lint everything
npm run lint

# Check Vercel deployment status (from app dir)
cd apps/admin && vercel ls

# View Vercel env vars for admin
cd apps/admin && vercel env ls

# Add env var to Vercel
cd apps/admin && vercel env add VAR_NAME production

# Promote a specific deployment to production alias
vercel alias set <deployment-url> admin.u-do-craft.store
```
