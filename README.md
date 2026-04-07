# U:DO Craft

Custom print-on-demand B2B platform. Customers design and order branded merch; admins manage the full production pipeline.

**Live:**
- Store → [u-do-craft.store](https://u-do-craft.store)
- Admin → [admin.u-do-craft.store](https://admin.u-do-craft.store)

---

## Architecture

```
udo-craft/                          ← monorepo root (npm workspaces + Turborepo)
├── apps/
│   ├── admin/                      → Next.js 14 internal dashboard (port 3001)
│   └── client/                     → Next.js 14 customer storefront (port 3000)
├── packages/
│   ├── shared/                     → Zod schemas, TS types, constants, useCustomizer hook
│   ├── ui/                         → Shared React components (MockupViewer, BrandLogo, ClarityInit)
│   ├── config/                     → Shared Tailwind config
│   └── styles/                     → Global CSS
├── .github/workflows/              → CI (type-check + lint) + CD (Vercel deploy on push)
└── .husky/                         → pre-commit hook (blocks .env commits)
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + Shadcn/ui primitives |
| Canvas editor | Fabric.js 5 |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Validation | Zod (shared schemas in `@udo-craft/shared`) |
| Monitoring | Sentry |
| Analytics | Microsoft Clarity |
| Deployment | Vercel (GitHub integration, auto-deploy on push) |
| Build system | Turborepo |

---

## Quick Start

```bash
# Install all deps from repo root (never from inside an app)
npm install

# Start both apps
npm run dev
# admin → http://localhost:3001
# client → http://localhost:3000
```

---

## Business Logic

### Order Flow (end-to-end)

```
Customer                    System                          Admin
   │                           │                              │
   ├─ Browse products ─────────► /                            │
   ├─ Click "Customize" ───────► /order                       │
   │                           │                              │
   │  Canvas editor opens      │                              │
   ├─ Upload design ───────────► POST /api/upload             │
   ├─ Position, resize ────────► Fabric.js canvas             │
   ├─ Select size/color/qty ───► useCustomizer hook           │
   ├─ Submit order ────────────► POST /api/leads              │
   │                           │  CreateLeadSchema validates  │
   │                           │  lead + order_items → DB     │
   │                           │                              │
   │                           ├─ Supabase Realtime ─────────► Kanban updates
   │                           │                              ├─ new → in_progress
   │                           │                              ├─ in_progress → production
   │                           │                              ├─ production → completed
   │                           │                              │
   ├─ Track in /cabinet ───────► GET /api/cabinet/leads       │
```

### Lead Statuses

```
draft → new → in_progress → production → completed → archived
```

- `draft` — started but not submitted
- `new` — submitted by customer, awaiting admin action
- `in_progress` — admin is working on it
- `production` — sent to print
- `completed` — delivered
- `archived` — closed/cancelled

### Pricing Model

Base price per product + print cost per layer, with quantity discounts:

| Quantity | Discount |
|---|---|
| 10–49 units | 5% |
| 50–99 units | 12% |
| 100+ units | 15% |

Print cost is looked up from `print_type_pricing` table by print type + size label.

### Print Types

| ID | Label | Description |
|---|---|---|
| `dtf` | DTF | Direct-to-film transfer |
| `embroidery` | Вишивка | Machine embroidery |
| `screen` | Шовкодрук | Screen printing |
| `sublimation` | Сублімація | Dye sublimation |
| `patch` | Нашивка | Woven patch |

---

## Shared Packages

### `@udo-craft/shared`

Single source of truth for all data shapes. Update here first when changing DB schema.

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

### `@udo-craft/ui`

```ts
import { MockupViewer, BrandLogo, ClarityInit } from "@udo-craft/ui";
```

---

## Database Schema (Supabase)

| Table | Purpose |
|---|---|
| `leads` | Orders — status, customer_data JSON, total_amount_cents, tags, notes |
| `order_items` | Line items — product_id, size, color, custom_print_url, mockup_url, technical_metadata |
| `products` | Catalog — name, base_price_cents, images JSON, available_sizes |
| `product_color_variants` | Color options per product — material_id, images JSON |
| `materials` | Color swatches — name, hex_code |
| `categories` | Product categories — name, slug, sort_order |
| `print_zones` | Print areas per product side — x, y, width, height, allowed_print_types |
| `print_type_pricing` | Pricing tiers by print type + quantity |
| `messages` | Chat between admin and customers |
| `size_charts` | Size tables per product |

Two Supabase projects:
- **Production** — `main` branch
- **`udocraft-dev`** — `develop` branch / staging

---

## Deployment

### Standard workflow — just push

```bash
git push origin main     # → production (both apps)
git push origin develop  # → staging preview (both apps)
```

Vercel's GitHub integration picks it up automatically. No CLI needed.

### Branch strategy

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production | `admin.u-do-craft.store` + `u-do-craft.store` |
| `develop` | Staging | Vercel preview URLs |
| `feature/*` | New features | PR preview only |
| `fix/*` | Bug fixes | PR preview only |

**Workflow:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# ... work ...

git push origin feature/my-feature
# Open PR → develop on GitHub
# CI runs type-check + lint
# Merge → staging deploy
# PR develop → main → production deploy
```

Never push directly to `main`.

### Vercel project settings (one-time, already configured)

Both projects use the same pattern:
- Root Directory: `apps/admin` or `apps/client`
- Include files outside root: ON
- Install command: `cd ../.. && npm install --legacy-peer-deps`
- Build command: `cd ../.. && npm run build:admin` (or `:client`)

### Environment variables

Set in Vercel dashboard → Project Settings → Environment Variables.

**Admin:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://admin.u-do-craft.store
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
NEXT_PUBLIC_SENTRY_DSN   (optional)
```

**Client:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://u-do-craft.store
NEXT_PUBLIC_SENTRY_DSN   (optional)
```

For staging (Preview env), use `udocraft-dev` Supabase credentials.

---

## Scripts

```bash
npm run dev              # start admin + client in parallel
npm run build            # build shared → ui → admin → client
npm run type-check       # TypeScript check across all packages
npm run lint             # lint all packages
```

---

## Common Issues

**Build fails: "Cannot find module '@udo-craft/shared'"**
Always run builds from repo root, never from inside an app directory.

**Admin shows "loading forever"**
Log in at `/login`. If already logged in, clear cookies and try again.

**Supabase auth not working after deploy**
Check Vercel dashboard → Project Settings → Environment Variables. All 3 Supabase vars must be set.

**Telegram notifications not working**
Call `GET /api/telegram/setup` once after deploying admin to register the webhook.

**POST /api/leads returns 400 with fieldErrors**
Expected — `CreateLeadSchema` validation is active. Payload must include `status` and `customer_data.name`.
