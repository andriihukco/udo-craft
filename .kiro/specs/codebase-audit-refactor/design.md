# Codebase Audit & Refactor — Bugfix Design

## Overview

The U:DO Craft monorepo has accumulated four categories of technical debt: duplicated logic across apps, oversized monolithic page files, UI inconsistencies, and infrastructure gaps. This design formalizes the bug condition for each category, defines the expected correct state, hypothesizes root causes, and outlines a targeted fix plan with a testing strategy that verifies both the fix and regression prevention.

The fix approach is additive-then-delete: extend `@udo-craft/shared` and `@udo-craft/ui` with the shared artifacts, update import sites in both apps, then remove the now-redundant copies. No user-facing behavior changes.

---

## Glossary

- **Bug_Condition (C)**: Any state in the codebase where the same logic, component, or constant exists in more than one canonical location, or where a known defect (stub, missing validation, hardcoded value) is present.
- **Property (P)**: The desired post-fix state — a single source of truth for each artifact, consistent UI primitives, and no unimplemented stubs.
- **Preservation**: All runtime behaviors observable by end users (canvas editing, cart flow, Kanban board, API responses) that must remain identical after the refactor.
- **`@udo-craft/shared`**: The `packages/shared/index.ts` package — source of truth for Zod schemas and TypeScript types.
- **`@udo-craft/ui`**: The `packages/ui/` package — source of truth for shared React components.
- **`useCustomizer`**: The proposed shared hook encapsulating `addLayer`, `addTextLayer`, `resolveLayerPrice`, and `handleAddToCart` logic currently duplicated in both page files.
- **`PrintLayer`**: The interface describing a canvas layer (image or text) with print type, size, transform, and pricing metadata.
- **`PRINT_TYPES`**: The array of print type descriptors (`dtf`, `embroidery`, `screen`, `sublimation`, `patch`) with label, color, bg, and desc fields.
- **`DISCOUNT_TIERS`**: The array of quantity-based discount brackets (`{ min, max, pct }`).
- **`PREDEFINED_TAGS`**: The array of order tag descriptors used in the admin order form.
- **`LeadSchema`**: The Zod schema in `@udo-craft/shared` used to validate lead POST request bodies.
- **`verifyPermission` stub**: The function in `apps/admin/src/lib/api/errors.ts` that always returns `true` due to an unimplemented TODO.

---

## Bug Details

### Bug Condition

The bug manifests across four distinct sub-conditions, each independently triggerable:

**C1 — Duplicate Artifacts**: A developer modifies a shared artifact (component, constant, type) in one app but not the other, causing behavioral divergence.

**C2 — Oversized Files**: A developer needs to modify `orders/new/page.tsx` or `order/page.tsx` and must navigate a 2000+ line monolithic file containing multiple interleaved concerns.

**C3 — UI Inconsistency**: `LayersPanel` renders native `<select>` elements and hardcoded hex colors instead of Shadcn primitives and Tailwind theme tokens.

**C4 — Infrastructure Gaps**: The permission stub always grants access; lead POST handlers lack Zod validation; `.env` files with real credentials are present in the working tree.

**Formal Specification:**

```
FUNCTION isBugCondition(artifact)
  INPUT: artifact — a file, function, component, constant, or config
  OUTPUT: boolean

  IF artifact.existsInBothApps AND artifact.hasNoDedicatedSharedPackageHome
    RETURN true  // C1: duplicate without shared source

  IF artifact.isPageFile AND artifact.lineCount > 300
    RETURN true  // C2: oversized monolith

  IF artifact.isLayersPanelDropdown AND artifact.usesNativeSelect
    RETURN true  // C3a: native select instead of Shadcn

  IF artifact.containsHardcodedHex(['#1B3BFF', '#1B18AC'])
    AND artifact.tailwindThemeHasEquivalentToken
    RETURN true  // C3b: hardcoded color bypassing theme

  IF artifact.isPermissionCheck AND artifact.alwaysReturnsTrue
    RETURN true  // C4a: unimplemented auth stub

  IF artifact.isLeadPostHandler AND NOT artifact.usesZodValidation
    RETURN true  // C4b: missing schema validation

  IF artifact.isEnvFile AND artifact.isTrackedByGit
    RETURN true  // C4c: secrets in version control

  RETURN false
END FUNCTION
```

### Examples

- `PRINT_TYPES` array defined identically in `apps/client/src/components/ProductCanvas.tsx` (line 10) and `apps/admin/src/components/print-types.ts` — C1 hit.
- `MockupViewer` component is byte-for-byte identical in `apps/client/src/components/MockupViewer.tsx` and `apps/admin/src/components/mockup-viewer.tsx` — C1 hit.
- `apps/admin/src/app/(dashboard)/orders/new/page.tsx` is 2006 lines containing `Customizer`, `Section`, `QtyPriceContent`, cart state, canvas state, and order submission — C2 hit.
- `LayersPanel.tsx` line ~220: `<select value={layer.type} ...>` — C3a hit.
- `LayersPanel.tsx` touch ghost: `border:2px solid #1B3BFF` — C3b hit.
- `verifyPermission` in `errors.ts`: `const hasPermission = true; // TODO` — C4a hit.
- `apps/client/src/app/api/leads/route.ts` POST: destructures body with no Zod parse — C4b hit.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Customer adding a print layer on `/order`: file upload, min-size pre-selection, real-time price breakdown must continue to work identically.
- Admin creating an order via `orders/new`: full Customizer flow (color/size selection, canvas editing, layer management, mockup capture, cart submission) must continue to work.
- Kanban board on `orders/page.tsx`: drag-and-drop status changes (mouse and touch), real-time Supabase subscription updates, and resizable detail drawer must continue to work.
- `MockupViewer` with multi-side `mockupsMap`: side-toggle buttons and `lg` layout showing all sides side-by-side must continue to work.
- `LayersPanel` drag-and-drop reordering (mouse and touch): must continue to call `onReorder` with the correct updated layer array.
- `@udo-craft/shared` build: must continue to export all existing Zod schemas and TypeScript types without breaking changes.
- Turborepo builds: both apps must continue to resolve `@udo-craft/shared` and `@udo-craft/ui` workspace packages correctly.
- `.gitignore`: must continue to exclude all `.env` variants from version control.
- All existing API routes not touched by this refactor must continue to respond identically.

**Scope:**

All behaviors not directly related to the artifacts being moved, replaced, or deleted are out of scope for change. The refactor is purely structural — no logic changes, only relocation and deduplication.

---

## Hypothesized Root Cause

### C1 — Duplicate Artifacts

The monorepo was bootstrapped with `packages/shared` for data types and `packages/ui` for components, but the shared packages were not populated as the apps grew. Components and constants were created directly inside each app for speed, with the intent to extract later. That extraction never happened, leading to copy-paste divergence.

Specific divergence already present:
- `addLayer` upload response key: admin uses `data?.results?.[0]?.url`, client uses `data?.urls?.[0]` — the APIs differ slightly.
- `handleRemoveBg` re-upload: admin appends `tags: "print"` to FormData, client does not.

### C2 — Oversized Files

The `Customizer` component was built incrementally inside the page file. Sub-components (`QtyPriceContent`, `Section`) were added inline rather than extracted, and the cart/order submission logic grew alongside the UI. No file-size lint rule enforced extraction.

### C3 — UI Inconsistency

`LayersPanel` was written before the Shadcn `Select` primitive was added to the client app's `components/ui/`. The hardcoded hex colors predate the Tailwind theme token setup and were never updated when the theme was formalized.

### C4 — Infrastructure Gaps

The `verifyPermission` stub was scaffolded as a placeholder during initial API layer setup and never implemented — the admin app relies on Supabase middleware auth instead, making the function dead code. The lead POST handlers were written independently in each app without referencing the shared `LeadSchema`. The `.env` files were likely created locally and either committed accidentally or are untracked but at risk given the absence of a pre-commit hook.

---

## Correctness Properties

Property 1: Bug Condition — Single Source of Truth for Shared Artifacts

_For any_ artifact that satisfies `isBugCondition` (duplicate component, oversized file, native select, hardcoded hex, unimplemented stub, missing validation, or tracked env file), the fixed codebase SHALL have exactly one canonical location for that artifact, with all consumers importing from that location, and no redundant copies remaining.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12**

Property 2: Preservation — Runtime Behavior Unchanged

_For any_ user-observable action where the bug condition does NOT hold (canvas editing, cart submission, Kanban drag-and-drop, API responses, mockup capture, layer reordering), the fixed codebase SHALL produce exactly the same runtime behavior as the original codebase, with no regressions in functionality, data flow, or visual output.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

---

## Fix Implementation

### Changes Required

#### 1. Extend `packages/shared/index.ts`

**File:** `packages/shared/index.ts`

Add the following exports:

```ts
// Print types
export const PRINT_TYPES = [...] as const;
export type PrintTypeId = typeof PRINT_TYPES[number]["id"];

// Text fonts
export const TEXT_FONTS = [...] as const;
export type TextFontId = typeof TEXT_FONTS[number]["id"];

// PrintLayer interface
export interface PrintLayer { ... }

// Constants
export const PREDEFINED_TAGS = [...] as const;
export const DISCOUNT_TIERS = [...] as const;

// CreateLeadSchema (subset of LeadSchema for POST validation)
export const CreateLeadSchema = z.object({
  status: LeadStatusEnum,
  customer_data: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    social_channel: z.string().optional(),
    phone: z.string().optional(),
  }),
  total_amount_cents: z.number().int().optional(),
});
export type CreateLead = z.infer<typeof CreateLeadSchema>;
```

Source values copied verbatim from `apps/admin/src/components/print-types.ts` (authoritative copy — it has the `PrintLayer` interface with full JSDoc).

#### 2. Move `MockupViewer`, `BrandLogo`, `ClarityInit` to `packages/ui/`

**Files to create:**
- `packages/ui/src/MockupViewer.tsx` — copy from `apps/admin/src/components/mockup-viewer.tsx` (both are identical; admin version has slightly better inline comments)
- `packages/ui/src/BrandLogo.tsx` — copy from either app
- `packages/ui/src/ClarityInit.tsx` — copy from either app
- Update `packages/ui/src/index.ts` to export all three

**Files to update (import sites):**
- `apps/admin/src/components/mockup-viewer.tsx` → re-export from `@udo-craft/ui` or delete and update all import sites
- `apps/client/src/components/MockupViewer.tsx` → update import to `@udo-craft/ui`

#### 3. Update `ProductCanvas.tsx` and `LayersPanel.tsx` to import from `@udo-craft/shared`

**File:** `apps/client/src/components/ProductCanvas.tsx`

Remove local `PRINT_TYPES`, `TEXT_FONTS`, `PrintLayer`, `PrintTypeId`, `TextFontId` declarations. Replace with:
```ts
import { PRINT_TYPES, TEXT_FONTS, type PrintLayer, type PrintTypeId, type TextFontId } from "@udo-craft/shared";
```

**File:** `apps/admin/src/components/print-types.ts`

This file becomes a re-export shim or is deleted. All admin consumers (`layers-panel.tsx`, `product-canvas.tsx`, `orders/new/page.tsx`) update their imports to `@udo-craft/shared`.

#### 4. Create `useCustomizer` hook in `packages/shared/` or `packages/hooks/`

**File:** `packages/shared/src/useCustomizer.ts` (or new `packages/hooks/`)

Extract the following logic into a single hook with a config parameter for app-specific differences:

```ts
interface UseCustomizerConfig {
  uploadUrl: string;           // "/api/upload"
  uploadResponseKey: string;   // "urls[0]" (client) vs "results[0].url" (admin)
  uploadTags?: string;         // undefined (client) vs "print" (admin)
}

export function useCustomizer(config: UseCustomizerConfig) {
  // addLayer(file: File): void
  // addTextLayer(): void
  // resolveLayerPrice(layer: PrintLayer, quantity: number, pricing: PrintTypePricingRow[]): number
  // handleAddToCart(...): Promise<CartItem>
  // layers, setLayers, activeLayerId, setActiveLayerId, mockups, ...
}
```

Both page files replace their inline implementations with `const { addLayer, addTextLayer, ... } = useCustomizer(config)`.

#### 5. Replace native `<select>` in `LayersPanel.tsx` with Shadcn `<Select>`

**File:** `apps/client/src/components/LayersPanel.tsx`

Replace both `<select>` elements (print type selector ~line 220, size selector ~line 240) with:

```tsx
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

<Select value={layer.type} onValueChange={(val) => onTypeChange(layer.id, val as PrintTypeId)}>
  <SelectTrigger className="h-8 text-xs">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {PRINT_TYPES.map((t) => (
      <SelectItem key={t.id} value={t.id}>{t.label} — {t.desc}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

Same pattern for the size label selector.

#### 6. Replace hardcoded hex colors with Tailwind theme tokens

**Files:** `apps/client/src/components/LayersPanel.tsx`, `apps/client/src/components/ContactForm.tsx`, `apps/admin/src/app/(dashboard)/orders/page.tsx`, cabinet pages

- Touch ghost border `border:2px solid #1B3BFF` → `border:2px solid var(--color-primary)` (or extract to a Tailwind class `border-primary`)
- Fabric.js `cornerStrokeColor: "#1B3BFF"` and `borderColor: "#1B3BFF"` in `ProductCanvas.tsx` → read from CSS variable at runtime: `getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()` or keep as-is with a comment noting it's intentionally hardcoded for Fabric (which doesn't read CSS variables)
- `#1B18AC` in cabinet pages → `text-primary-dark` token or `color: var(--color-primary-dark)` if defined in theme
- `from-[#f8f8ff] to-[#eef0ff]` gradient in `page.tsx` → define as `from-surface-subtle to-surface-accent` tokens in Tailwind config, or use existing `muted` tokens

#### 7. Split `orders/new/page.tsx` and `order/page.tsx` into sub-components

**Target structure for `apps/admin/src/app/(dashboard)/orders/new/`:**
```
page.tsx                  (~150 lines — page shell, data fetching, cart state)
_components/
  Customizer.tsx          (~250 lines — overlay, canvas, left/right panels)
  QtyPricePanel.tsx       (~150 lines — quantity, discount grid, price breakdown)
  CartSummary.tsx         (~200 lines — cart items list, order form, submission)
  Section.tsx             (~20 lines — card wrapper)
```

**Target structure for `apps/client/src/app/order/`:**
```
page.tsx                  (~100 lines — Suspense wrapper, data fetching)
_main.tsx                 (already exists — keep, reduce to ~250 lines)
_components/
  Customizer.tsx          (~250 lines)
  QtyPriceContent.tsx     (~150 lines)
  CartSummary.tsx         (~200 lines)
```

#### 8. Delete empty route folders and stale markdown files

**Folders to delete:**
- `apps/admin/src/app/api/fix-audit/`
- `apps/admin/src/app/api/remove-bg/`
- `apps/admin/src/app/(dashboard)/products/[id]/edit/`
- `apps/admin/src/app/(dashboard)/products/new/`

**Root markdown files to delete:**
- `DEPLOYMENT_CHECKLIST.md`
- `DEPLOYMENT_READY.md`
- `GITHUB_DEPLOYMENT_SETUP.md`
- `GITHUB_SETUP_COMPLETE.md`
- `BUSINESS_SETUP.md`

Keep `DEPLOYMENT.md` and `README.md` as living documentation.

#### 9. Add shared `CreateLeadSchema` validation to both POST `/api/leads` handlers

**File:** `apps/client/src/app/api/leads/route.ts`

```ts
import { CreateLeadSchema } from "@udo-craft/shared";

const parsed = CreateLeadSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
const { status, customer_data, total_amount_cents } = parsed.data;
```

**File:** `apps/admin/src/app/api/leads/route.ts`

Same pattern. The admin handler also accepts `order_items` and `tags` — those remain as loose fields after the shared schema validates the core lead shape.

#### 10. Resolve `verifyPermission` stub in `errors.ts`

**File:** `apps/admin/src/lib/api/errors.ts`

Option A (recommended): Delete `verifyPermission` entirely. The admin app already enforces auth at the middleware level (`src/middleware.ts`). No API route currently calls `verifyPermission`, making it dead code.

Option B: Implement actual Supabase role check if granular per-route permissions are needed in the future. Document this as a future requirement.

#### 11. Audit `.gitignore` and env file exposure

**Root `.gitignore`:** Already correctly excludes `.env`, `.env.local`, and variants. No change needed.

**Action items:**
- Run `git ls-files apps/admin/.env apps/client/.env` — if output is non-empty, the files are tracked. Run `git rm --cached apps/admin/.env apps/client/.env` to untrack without deleting.
- Add per-app `.gitignore` entries as a belt-and-suspenders measure: each `apps/admin/.gitignore` and `apps/client/.gitignore` should explicitly list `.env` and `.env.*`.
- Rotate any credentials that may have been committed. Check `git log --all --full-history -- "**/.env"` to confirm history.
- Add a pre-commit hook (via `husky` + `lint-staged`) that rejects commits containing `.env` files.

---

## Testing Strategy

### Validation Approach

Testing follows a two-phase approach: first, write tests against the unfixed codebase to confirm the bug condition is observable (exploration); then verify the fix satisfies Property 1 and Property 2.

For structural refactors (moves, splits, deletes), the primary test signal is TypeScript compilation — if the build passes after the refactor, imports are correct. For behavioral fixes (Zod validation, permission stub, Shadcn select), unit and integration tests provide the signal.

### Exploratory Bug Condition Checking

**Goal:** Confirm each bug condition is observable before fixing. Surface counterexamples.

**Test Plan:** Static analysis and targeted unit tests on the unfixed codebase.

**Test Cases:**

1. **Duplicate PRINT_TYPES**: Import `PRINT_TYPES` from both `apps/client/src/components/ProductCanvas.tsx` and `apps/admin/src/components/print-types.ts` in a test and assert deep equality — confirms they are currently duplicated and identical (will pass on unfixed code, demonstrating the duplication exists).

2. **Missing Zod validation — client leads**: Send a POST to `/api/leads` with `{ status: "new" }` (missing `customer_data`) — on unfixed code, the handler returns 400 with a plain string error, not a structured Zod error. After fix, it returns a structured `{ error: { fieldErrors: { customer_data: [...] } } }`.

3. **Missing Zod validation — admin leads**: Same request to admin `/api/leads` POST — on unfixed code, passes the `!customer_data` check and attempts DB insert, potentially causing a DB error instead of a clean 400.

4. **Permission stub always true**: Call `verifyPermission("any-user-id", "admin:write")` — on unfixed code, returns `undefined` (void, no throw) regardless of input. After fix (Option A), the function no longer exists.

5. **Native select in LayersPanel**: Render `LayersPanel` in a test environment and query for `select` elements — on unfixed code, finds 2 native selects. After fix, finds 0 native selects and 2 Shadcn `SelectTrigger` elements.

6. **Hardcoded hex in touch ghost**: Search `LayersPanel.tsx` source for `#1B3BFF` — on unfixed code, found in `ghost.style.cssText`. After fix, not found (replaced with CSS variable).

**Expected Counterexamples:**
- Zod validation: client handler accepts `{ status: "new" }` without error on the schema level, only failing at the loose `!customer_data` check.
- Permission stub: `verifyPermission` never throws, meaning any caller that depends on it for access control is silently unprotected.

### Fix Checking

**Goal:** Verify that for all inputs where the bug condition holds, the fixed codebase produces the expected behavior.

**Pseudocode:**
```
FOR ALL artifact WHERE isBugCondition(artifact) DO
  result := inspect_fixed_codebase(artifact)
  ASSERT result.hasExactlyOneCanonicalLocation
  ASSERT result.allConsumersImportFromCanonicalLocation
  ASSERT result.noDuplicateCopiesExist
END FOR

FOR ALL leadPostRequest WHERE isBugCondition(leadPostRequest) DO
  result := POST_fixed("/api/leads", leadPostRequest)
  ASSERT result.status == 400
  ASSERT result.body.error.fieldErrors != undefined  // structured Zod error
END FOR
```

### Preservation Checking

**Goal:** Verify that for all inputs where the bug condition does NOT hold, the fixed codebase produces the same result as the original.

**Pseudocode:**
```
FOR ALL userAction WHERE NOT isBugCondition(userAction) DO
  ASSERT behavior_fixed(userAction) == behavior_original(userAction)
END FOR
```

**Testing Approach:** Property-based testing is recommended for the `useCustomizer` hook and `resolveLayerPrice` function because:
- They operate over a large input space (arbitrary layer arrays, quantity values, pricing tier configurations).
- Manual unit tests would only cover a handful of cases; PBT generates hundreds automatically.
- The preservation property (`resolveLayerPrice_fixed(layer, qty, pricing) === resolveLayerPrice_original(layer, qty, pricing)`) is a natural equality property.

**Test Cases:**

1. **Customizer flow preservation**: Integration test that simulates adding a layer, changing its type, selecting a size, and calling `handleAddToCart` — assert the returned `CartItem` has the same shape and values as before the refactor.

2. **MockupViewer rendering preservation**: Render `MockupViewer` from `@udo-craft/ui` with a multi-side `mockupsMap` — assert side-toggle buttons render and clicking them switches the displayed image.

3. **LayersPanel reorder preservation**: Simulate drag-and-drop reorder in `LayersPanel` — assert `onReorder` is called with the correct updated array after the Shadcn select replacement.

4. **Lead POST valid payload**: Send a valid lead payload to both `/api/leads` handlers after adding Zod validation — assert 201 response and correct DB insert behavior is unchanged.

5. **resolveLayerPrice PBT**: Generate random `(layer, quantity, pricingRows)` triples where `layer.sizeLabel` is defined — assert `resolveLayerPrice_fixed` returns the same value as the extracted-but-unmodified original logic.

### Unit Tests

- Test `CreateLeadSchema.safeParse` with valid and invalid payloads (missing fields, wrong types, extra fields).
- Test `PRINT_TYPES` export from `@udo-craft/shared` matches the original array shape.
- Test `DISCOUNT_TIERS` export from `@udo-craft/shared` matches the original array shape.
- Test `verifyPermission` is no longer exported from `errors.ts` (Option A) or throws `ForbiddenError` for a non-admin user (Option B).
- Test each extracted sub-component (`QtyPriceContent`, `Section`, `CartSummary`) renders without errors given minimal props.

### Property-Based Tests

- Generate random arrays of `PrintLayer` objects and verify `resolveLayerPrice` returns the same result from the shared hook as from the original inline implementation.
- Generate random `quantity` values (1–500) and verify `DISCOUNT_TIERS` lookup returns the correct discount percentage from the shared constant.
- Generate random `mockupsMap` objects (1–4 sides) and verify `MockupViewer` from `@udo-craft/ui` renders the correct number of toggle buttons.

### Integration Tests

- Full Customizer flow in both apps: add image layer → select size → add to cart → verify `CartItem` shape.
- Lead submission end-to-end: valid payload → 201 + DB row; invalid payload → 400 + structured error.
- Turborepo build: `npm run build` from repo root passes with zero TypeScript errors after all import sites are updated.
- `git ls-files "**/.env"` returns empty output after `.gitignore` audit.
