# U:DO Craft

Custom print-on-demand platform. Monorepo with an admin dashboard and a customer-facing storefront.

## Structure

```
udo-craft/
├── apps/
│   ├── admin/          → Next.js 14 dashboard (admin.u-do-craft.store)
│   └── client/         → Next.js 14 storefront (u-do-craft.store)
├── packages/
│   ├── shared/         → Zod schemas + TypeScript types (source of truth)
│   ├── ui/             → Shared React components (MockupViewer, BrandLogo, ClarityInit)
│   ├── config/         → Shared Tailwind config
│   └── styles/         → Global CSS
├── .github/workflows/  → CI (type-check + lint) and CD (Vercel deploy)
└── .husky/             → Pre-commit hooks (blocks .env commits)
```

## Quick Start

```bash
# Install all deps from repo root (never from inside an app)
npm install

# Start both apps
npm run dev
# admin → http://localhost:3001
# client → http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start admin + client in parallel |
| `npm run build` | Build shared → ui → admin → client |
| `npm run type-check` | TypeScript check across all packages |
| `npm run lint` | Lint all packages |

## Shared Packages

**`@udo-craft/shared`** — single source of truth for all data shapes:
- Zod schemas: `LeadSchema`, `ProductSchema`, `OrderItemSchema`, etc.
- Shared constants: `PRINT_TYPES`, `TEXT_FONTS`, `DISCOUNT_TIERS`, `PREDEFINED_TAGS`
- Shared types: `PrintLayer`, `PrintTypeId`, `TextFontId`, `CreateLead`
- Shared hook: `useCustomizer` (canvas layer management, upload, cart logic)

**`@udo-craft/ui`** — shared React components:
- `MockupViewer` — multi-side mockup display with side-toggle
- `BrandLogo` — brand logo component
- `ClarityInit` — Microsoft Clarity analytics init

## Deployment

Push to `main` → auto-deploys both apps to production via GitHub Actions.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full details including how to set up the required GitHub secrets.

## Environment Variables

Each app needs its own `.env` file (never committed — blocked by pre-commit hook):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

Admin also needs `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and optionally `NEXT_PUBLIC_SENTRY_DSN`.

## Branch Strategy

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production | `admin.u-do-craft.store` + `u-do-craft.store` |
| `develop` | Staging / integration | Vercel preview URLs |
| `feature/*` | New features | PR preview (no auto-deploy) |
| `fix/*` | Bug fixes | PR preview (no auto-deploy) |

Workflow: `feature/my-thing` → PR to `develop` → merge → staging → PR to `main` → production.
