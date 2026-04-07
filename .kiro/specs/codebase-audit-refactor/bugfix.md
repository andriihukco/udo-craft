# Bugfix Requirements Document

## Introduction

The U:DO Craft monorepo has accumulated significant technical debt across four problem areas:

1. **Duplicate Logic** — Core components (`LayersPanel`, `MockupViewer`, `ProductCanvas`, `PRINT_TYPES`, `PrintLayer`, `BrandLogo`, `ClarityInit`) are copy-pasted between `apps/admin` and `apps/client` with minor divergences. The `Customizer` component and its `handleAddToCart` / `addLayer` / `addTextLayer` / `resolveLayerPrice` logic are nearly identical in both `apps/admin/src/app/(dashboard)/orders/new/page.tsx` (2006 lines) and `apps/client/src/app/order/page.tsx` (1899 lines). The `PREDEFINED_TAGS` and `DISCOUNT_TIERS` constants are also duplicated. Both apps maintain separate `components/ui/` folders with identical Shadcn primitives.

2. **Oversized Files & Dead Code** — `orders/new/page.tsx` (2006 lines) and `order/page.tsx` (1899 lines) each contain multiple embedded sub-components, constants, and business logic that should be extracted. Empty route folders exist (`apps/admin/src/app/api/fix-audit/`, `apps/admin/src/app/api/remove-bg/`, `apps/admin/src/app/(dashboard)/products/[id]/edit/`, `apps/admin/src/app/(dashboard)/products/new/`). Multiple root-level markdown files (`DEPLOYMENT.md`, `DEPLOYMENT_CHECKLIST.md`, `DEPLOYMENT_READY.md`, `GITHUB_DEPLOYMENT_SETUP.md`, `GITHUB_SETUP_COMPLETE.md`, `BUSINESS_SETUP.md`) are stale operational notes, not living documentation.

3. **UI Inconsistencies** — `apps/client/src/components/LayersPanel.tsx` uses native `<select>` elements for print type and size selection instead of the Shadcn `<Select>` primitive that already exists in `apps/client/src/components/ui/select.tsx`. Hardcoded hex colors appear in multiple files: `#1B3BFF` in `ContactForm.tsx`, `LayersPanel.tsx` (touch ghost border), `orders/page.tsx` (touch ghost border); `#1B18AC` in cabinet pages; `from-[#f8f8ff] to-[#eef0ff]` in `page.tsx`. The `PRINT_TYPES` array in `apps/client/src/components/ProductCanvas.tsx` duplicates the identical array in `apps/admin/src/components/print-types.ts` instead of importing from `@udo-craft/shared`.

4. **Infrastructure Gaps** — The `apps/admin/src/lib/api/errors.ts` contains a `// TODO: Implement actual permission check` stub that always returns `true`. The client `apps/client/src/app/api/leads/route.ts` POST handler and the admin `apps/admin/src/app/api/leads/route.ts` POST handler share the same insert logic but diverge in validation and message handling, with no shared Zod validation layer. The `.gitignore` at root level correctly excludes `.env` files, but `apps/admin/.env` and `apps/client/.env` are present in the working tree with real credentials, indicating they were committed at some point or are untracked but at risk.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `LayersPanel` is rendered in the client app THEN the system uses native `<select>` HTML elements for print type and size dropdowns instead of the Shadcn `<Select>` primitive, causing visual inconsistency with the rest of the UI.

1.2 WHEN a developer changes `PRINT_TYPES` data (labels, colors, IDs) THEN the system requires the change to be made in two separate files (`apps/admin/src/components/print-types.ts` AND `apps/client/src/components/ProductCanvas.tsx`), making divergence inevitable.

1.3 WHEN a developer changes `MockupViewer` behavior THEN the system requires the change to be made in two separate files (`apps/admin/src/components/mockup-viewer.tsx` AND `apps/client/src/components/MockupViewer.tsx`) which are byte-for-byte identical.

1.4 WHEN a developer changes `BrandLogo` or `ClarityInit` THEN the system requires the change to be made in two separate files per component, one in each app.

1.5 WHEN `handleAddToCart` logic needs updating (upload wait, mockup capture, layer price resolution) THEN the system requires the same change in both `orders/new/page.tsx` and `order/page.tsx`, which contain near-identical implementations.

1.6 WHEN `addLayer` or `addTextLayer` is called THEN both apps execute identical logic (min-size pre-selection, FormData upload, `setLayersWithRef`) from separate copies with minor API response key differences (`results[0].url` vs `urls[0]`).

1.7 WHEN `PREDEFINED_TAGS` or `DISCOUNT_TIERS` constants need updating THEN the system requires changes in both `orders/new/page.tsx` and `order/page.tsx` where they are duplicated.

1.8 WHEN a new Shadcn UI component is added THEN the system requires it to be added to both `apps/admin/src/components/ui/` and `apps/client/src/components/ui/` separately, since the existing `packages/ui/` shared package is underutilized for primitives.

1.9 WHEN hardcoded color `#1B3BFF` is used in `ContactForm.tsx`, `LayersPanel.tsx` touch ghost, and `orders/page.tsx` touch ghost THEN the system bypasses the Tailwind theme token `primary`, making theme changes require manual grep-and-replace across files.

1.10 WHEN `apps/admin/src/lib/api/errors.ts` permission check is called THEN the system always returns `true` due to an unimplemented stub, meaning no actual authorization enforcement exists at that layer.

1.11 WHEN a lead is submitted via the client `POST /api/leads` THEN the system performs no Zod schema validation on the request body, relying only on loose destructuring checks.

1.12 WHEN `orders/new/page.tsx` (2006 lines) or `order/page.tsx` (1899 lines) need to be modified THEN the system presents a single monolithic file containing the `Customizer` component, `Section` wrapper, `QtyPriceContent`, cart state, canvas state, and order submission logic all interleaved, making targeted changes error-prone.

1.13 WHEN empty route folders (`api/fix-audit/`, `api/remove-bg/`, `products/[id]/edit/`, `products/new/`) exist THEN the system contains dead scaffolding that misleads developers into thinking those routes are implemented.

### Expected Behavior (Correct)

2.1 WHEN `LayersPanel` renders print type and size dropdowns THEN the system SHALL use the Shadcn `<Select>` / `<SelectTrigger>` / `<SelectContent>` / `<SelectItem>` primitives from `components/ui/select.tsx` for visual consistency.

2.2 WHEN `PRINT_TYPES`, `TEXT_FONTS`, and the `PrintLayer` interface are needed THEN the system SHALL import them from `@udo-craft/shared` (added to `packages/shared/index.ts`), ensuring a single source of truth.

2.3 WHEN `MockupViewer` is needed in either app THEN the system SHALL import it from `@udo-craft/ui` (moved to `packages/ui/`), with both apps using the same component.

2.4 WHEN `BrandLogo` and `ClarityInit` are needed THEN the system SHALL import them from `@udo-craft/ui`, eliminating per-app copies.

2.5 WHEN `handleAddToCart`, `addLayer`, `addTextLayer`, and `resolveLayerPrice` logic is needed THEN the system SHALL provide a shared `useCustomizer` hook (in `packages/shared/` or a new `packages/hooks/`) that both apps consume, with app-specific upload URL differences passed as configuration.

2.6 WHEN `PREDEFINED_TAGS` and `DISCOUNT_TIERS` are needed THEN the system SHALL define them once in `@udo-craft/shared` and import them in both apps.

2.7 WHEN a new Shadcn UI primitive is needed THEN the system SHALL add it once to `packages/ui/` and both apps SHALL import from `@udo-craft/ui`, eliminating the dual `components/ui/` maintenance burden.

2.8 WHEN a color matching the brand primary (`#1B3BFF`) is needed in inline styles or dynamic CSS THEN the system SHALL use `var(--color-primary)` or the Tailwind `primary` token, with the hex value defined only in the Tailwind theme config.

2.9 WHEN the permission check in `apps/admin/src/lib/api/errors.ts` is called THEN the system SHALL either implement actual Supabase role verification or remove the stub entirely and enforce auth at the middleware level only.

2.10 WHEN a lead is submitted via `POST /api/leads` on either app THEN the system SHALL validate the request body against the shared `LeadSchema` (or a `CreateLeadSchema`) from `@udo-craft/shared` before inserting into Supabase.

2.11 WHEN `orders/new/page.tsx` and `order/page.tsx` are refactored THEN the system SHALL extract `Customizer`, `QtyPriceContent`, `CartSummary`, and canvas-related state into dedicated files, keeping each file under 300 lines.

2.12 WHEN empty route folders are encountered THEN the system SHALL have them deleted, with any planned-but-unimplemented routes tracked in a backlog instead.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer adds a print layer on the client order page THEN the system SHALL CONTINUE TO upload the file, pre-select the minimum print size, and update the price breakdown in real time.

3.2 WHEN an admin creates a new order via `orders/new` THEN the system SHALL CONTINUE TO support the full Customizer flow: color/size selection, canvas editing, layer management, mockup capture, and cart submission.

3.3 WHEN the Kanban board on `orders/page.tsx` is used THEN the system SHALL CONTINUE TO support drag-and-drop (mouse and touch) status changes, real-time Supabase subscription updates, and the resizable detail drawer.

3.4 WHEN `MockupViewer` is rendered with a `mockupsMap` containing multiple sides THEN the system SHALL CONTINUE TO display side-toggle buttons and the `lg` layout showing all sides side-by-side.

3.5 WHEN `MaterialsManager` is used THEN the system SHALL CONTINUE TO fetch, create, update, and delete materials via `/api/materials`, using Shadcn `Button`, `Input`, and `Label` primitives as currently implemented.

3.6 WHEN `LayersPanel` drag-and-drop reordering is used (mouse and touch) THEN the system SHALL CONTINUE TO reorder layers correctly and call `onReorder` with the updated layer array.

3.7 WHEN the shared `@udo-craft/shared` package is built THEN the system SHALL CONTINUE TO export all existing Zod schemas and TypeScript types (`Product`, `Lead`, `OrderItem`, `Material`, `Category`, `ProductColorVariant`, `PrintZone`, `LeadStatus`) without breaking changes.

3.8 WHEN `apps/admin` or `apps/client` are built via Turborepo THEN the system SHALL CONTINUE TO resolve `@udo-craft/shared` and `@udo-craft/ui` workspace packages correctly without manual path changes.

3.9 WHEN the `.gitignore` is audited THEN the system SHALL CONTINUE TO exclude `.env`, `.env.local`, and all variant env files from version control, with no secrets committed to the repository.

3.10 WHEN the Git branch strategy (`feature/*` → `develop` → `main`) is followed THEN the system SHALL CONTINUE TO trigger Vercel preview deployments on PRs and production deployments only on pushes to `main`.
