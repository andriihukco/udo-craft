# U:DO Craft — Client Storefront

Customer-facing B2B merch platform. Customers browse products, design custom prints, and submit orders.

**URL:** [u-do-craft.store](https://u-do-craft.store)
**Port (local):** 3000

---

## What it does

The client app is the customer-facing side. It handles product discovery, the interactive canvas customizer, order submission, and the customer account area.

### Routes

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, collections, services, contact form |
| `/order` | Interactive product customizer (Fabric.js canvas editor) |
| `/cabinet` | Customer account — order history, messages |
| `/cabinet/login` | Customer login |
| `/cabinet/settings` | Account settings |

---

## Key Features

### Landing Page (`/`)

- Hero section with CTA
- Product collections grid
- Services overview
- Contact form → `POST /api/leads` with `initial_message`

### Product Customizer (`/order`)

The core feature. Full canvas-based design tool:

1. **Product selection** — browse catalog, pick color variant
2. **Canvas editor** — upload design file, position/resize/rotate on product mockup
3. **Layer management** — multiple print layers, drag-to-reorder, per-layer print type + size
4. **Text layers** — add text with 15 Cyrillic fonts, color picker, curve control
5. **Background removal** — AI-powered via `@imgly/background-removal`
6. **Size selection** — auto-selects minimum viable print size based on zone constraints
7. **Quantity + pricing** — live price breakdown with discount tiers
8. **Cart** — multiple items, mockup preview per item
9. **Order form** — customer data (name, contact), delivery info
10. **Submit** → `POST /api/leads` with all order items and mockup URLs

#### Canvas Architecture

```
/order/page.tsx              ← Suspense wrapper + data fetching
/order/_main.tsx             ← State orchestration
/order/_components/
  Customizer.tsx             ← Canvas overlay (full-screen editor)
  CustomizerCanvas.tsx       ← Fabric.js canvas wrapper
  CustomizerLeftPanel.tsx    ← Product/color/size selectors
  CustomizerLayout.tsx       ← Layout shell
  CustomizerMobileSheet.tsx  ← Mobile bottom sheet
  QtyPriceContent.tsx        ← Quantity stepper + price breakdown
  CartSummary.tsx            ← Cart items + order form
  DesktopCartPanel.tsx       ← Desktop cart sidebar
  MobileCartBar.tsx          ← Mobile cart bar
  LayersPanel.tsx            ← Layer list with drag-to-reorder
  useCustomizerState.ts      ← Canvas state management
  useLayerHandlers.ts        ← Layer add/remove/update handlers
```

The `useCustomizer` hook from `@udo-craft/shared` handles upload logic, price resolution, and cart submission.

### Customer Cabinet (`/cabinet`)

- Order history with status tracking
- Bidirectional messaging with admin
- File attachments in messages

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + Shadcn/ui |
| Canvas | Fabric.js 5 |
| Backend | Supabase (Postgres + Auth + Storage) |
| Validation | Zod via `@udo-craft/shared` |
| PDF generation | jsPDF |
| Confetti | canvas-confetti (order success) |
| Monitoring | Sentry 8 |
| Analytics | Microsoft Clarity |

### Key dependencies

```json
"fabric": "^5.5.2"              — canvas editor
"@imgly/background-removal"     — AI background removal
"jspdf": "^4.2.1"               — invoice PDF generation
"canvas-confetti": "^1.9.4"     — order success animation
"@supabase/ssr"                 — Supabase SSR client
"@udo-craft/shared"             — shared schemas, constants, useCustomizer hook
"@udo-craft/ui"                 — MockupViewer, BrandLogo, ClarityInit
```

---

## Local Development

```bash
# From repo root
npm install
npm run dev:client
# → http://localhost:3000
```

Requires `apps/client/.env` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/products` | List active products with variants |
| GET | `/api/product-color-variants` | Color variants |
| GET | `/api/print-zones` | Print zones per product |
| GET | `/api/print-type-pricing` | Pricing tiers |
| GET | `/api/materials` | Material swatches |
| POST | `/api/leads` | Submit order (validated by `CreateLeadSchema`) |
| POST | `/api/upload` | Upload design file to Supabase Storage |
| GET | `/api/cabinet/leads` | Customer's own orders |
| GET/POST | `/api/cabinet/messages` | Customer messages |
| POST | `/api/cabinet/upload` | Upload message attachment |
| GET | `/api/proxy-image` | Proxy external images for canvas |

---

## Customer Journey Map

```
Awareness → Landing page (hero, collections)
     ↓
Interest → Browse products, see pricing
     ↓
Consideration → Open customizer, upload design
     ↓
Intent → Configure layers, select size/qty, see price
     ↓
Purchase → Fill order form, submit
     ↓
Retention → Cabinet — track status, message admin
```

---

## Deployment

Part of the monorepo — deploys automatically when you push to `main`.

```bash
git push origin main   # deploys to u-do-craft.store
```

See the root [README.md](../../README.md) and [DEPLOYMENT.md](../../DEPLOYMENT.md) for full details.
