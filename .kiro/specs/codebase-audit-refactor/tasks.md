# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Codebase Audit: Duplicate Artifacts, Missing Validation, and Stubs
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug conditions exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected post-fix state — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate each bug condition is observable
  - **Scoped PBT Approach**: For deterministic structural bugs, scope each assertion to the concrete failing artifact
  - Test C1 — Duplicate PRINT_TYPES: import PRINT_TYPES from both `apps/client/src/components/ProductCanvas.tsx` and `apps/admin/src/components/print-types.ts` and assert deep equality — confirms duplication exists (test passes on unfixed code, proving the duplicate is present and identical)
  - Test C1 — Duplicate MockupViewer: assert `apps/client/src/components/MockupViewer.tsx` and `apps/admin/src/components/mockup-viewer.tsx` have identical exports — confirms no shared package home
  - Test C3a — Native select in LayersPanel: render `LayersPanel` and query for `<select>` elements — on unfixed code, finds 2 native selects (assert count > 0 to confirm bug)
  - Test C3b — Hardcoded hex in LayersPanel: grep `apps/client/src/components/LayersPanel.tsx` source for `#1B3BFF` — on unfixed code, found in `ghost.style.cssText` (assert match exists)
  - Test C4a — Permission stub always true: call `verifyPermission("any-id", "admin:write")` — on unfixed code, resolves without throwing (assert no throw, confirming stub is live)
  - Test C4b — Missing Zod validation (client): POST `{ status: "new" }` (no `customer_data`) to client `/api/leads` — on unfixed code, returns 400 with plain string error, NOT a structured Zod `fieldErrors` object (assert `body.error.fieldErrors === undefined`)
  - Test C4b — Missing Zod validation (admin): POST `{ status: "new" }` (no `customer_data`) to admin `/api/leads` — on unfixed code, passes the loose `!customer_data` check and attempts DB insert (assert no structured Zod error in response)
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: C1/C3/C4 structural tests confirm bugs are observable; document each counterexample found
  - Mark task complete when tests are written, run, and counterexamples are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.9, 1.10, 1.11_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Runtime Behavior Unchanged Across All Non-Buggy Inputs
  - **IMPORTANT**: Follow observation-first methodology — run unfixed code with non-buggy inputs, observe outputs, then write tests
  - Observe: `resolveLayerPrice(layer, qty, pricingRows)` returns correct cents for non-zero qty with a valid sizeLabel on unfixed code
  - Observe: `MockupViewer` with `mockupsMap = { front: url1, back: url2 }` renders 2 toggle buttons on unfixed code
  - Observe: `LayersPanel` drag-and-drop reorder calls `onReorder` with the correct updated array on unfixed code
  - Observe: valid POST to client `/api/leads` with `{ status: "new", customer_data: { name: "Test" } }` returns 201 on unfixed code
  - Observe: valid POST to admin `/api/leads` with same payload returns 201 on unfixed code
  - Write property-based test: for all `(layer, quantity, pricingRows)` where `layer.sizeLabel` is defined and `quantity >= 1`, `resolveLayerPrice` returns the same value as the original inline implementation (from Preservation Requirements in design §3.1, §3.2)
  - Write property-based test: for all `mockupsMap` with 1–4 sides, `MockupViewer` renders exactly `keys.length` toggle buttons when `size !== "lg"` and `keys.length > 1` (§3.4)
  - Write property-based test: for all `quantity` values 1–500, `DISCOUNT_TIERS` lookup returns the correct discount percentage (§3.7)
  - Verify all tests PASS on UNFIXED code before implementing any fix
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.7_


- [x] 3. Extend `packages/shared/index.ts` with shared artifacts

  - [x] 3.1 Add PRINT_TYPES, TEXT_FONTS, PrintLayer, PrintTypeId, TextFontId exports
    - Copy `PRINT_TYPES` array verbatim from `apps/admin/src/components/print-types.ts` (authoritative copy with full JSDoc)
    - Copy `TEXT_FONTS` array verbatim from same file
    - Copy `PrintLayer` interface with all fields (id, file, url, uploadedUrl, type, side, sizeLabel, sizeMinCm, sizeMaxCm, priceCents, transform, kind, textContent, textFont, textColor, textFontSize, textAlign, textCurve)
    - Export `PrintTypeId` and `TextFontId` derived types
    - _Bug_Condition: isBugCondition(artifact) where artifact.existsInBothApps AND artifact.hasNoDedicatedSharedPackageHome_
    - _Expected_Behavior: PRINT_TYPES, TEXT_FONTS, PrintLayer exported from @udo-craft/shared with single canonical location_
    - _Preservation: @udo-craft/shared build continues to export all existing schemas without breaking changes_
    - _Requirements: 2.2, 3.7_

  - [x] 3.2 Add PREDEFINED_TAGS and DISCOUNT_TIERS exports
    - Copy `PREDEFINED_TAGS` array from `apps/admin/src/app/(dashboard)/orders/new/page.tsx` (5 tag objects with id, label, color, bg)
    - Copy `DISCOUNT_TIERS` array (identical in both page files: tiers at 10/50/100 units)
    - Export both as `as const`
    - _Bug_Condition: isBugCondition(artifact) where artifact.existsInBothApps AND artifact.hasNoDedicatedSharedPackageHome_
    - _Expected_Behavior: PREDEFINED_TAGS and DISCOUNT_TIERS exported from @udo-craft/shared_
    - _Requirements: 2.6, 3.7_

  - [x] 3.3 Add CreateLeadSchema Zod validation schema
    - Add `CreateLeadSchema` as a subset of `LeadSchema` for POST body validation
    - Fields: `status` (LeadStatusEnum), `customer_data` (name: string min 1, email optional, social_channel optional, phone optional), `total_amount_cents` (int, optional)
    - Export `CreateLead` TypeScript type inferred from schema
    - _Bug_Condition: isBugCondition(artifact) where artifact.isLeadPostHandler AND NOT artifact.usesZodValidation_
    - _Expected_Behavior: CreateLeadSchema exported from @udo-craft/shared for use in both POST handlers_
    - _Requirements: 2.10, 3.7_

- [x] 4. Move MockupViewer, BrandLogo, ClarityInit to `packages/ui/`

  - [x] 4.1 Create packages/ui/src/MockupViewer.tsx
    - Copy from `apps/admin/src/components/mockup-viewer.tsx` (admin version has better inline comments)
    - Verify it is byte-for-byte equivalent to `apps/client/src/components/MockupViewer.tsx`
    - Export as named export `MockupViewer`
    - _Bug_Condition: isBugCondition(artifact) where artifact.existsInBothApps AND artifact.hasNoDedicatedSharedPackageHome_
    - _Expected_Behavior: MockupViewer exported from @udo-craft/ui_
    - _Requirements: 2.3, 3.4_

  - [x] 4.2 Move BrandLogo and ClarityInit to packages/ui/
    - Locate BrandLogo and ClarityInit in both apps, copy to `packages/ui/src/`
    - Export both from `packages/ui/src/index.ts`
    - _Requirements: 2.4_

  - [x] 4.3 Update packages/ui/src/index.ts to export all three components
    - Add `export { MockupViewer } from "./MockupViewer"`
    - Add exports for BrandLogo and ClarityInit
    - _Requirements: 2.3, 2.4_

  - [x] 4.4 Update all import sites in both apps
    - `apps/client/src/components/MockupViewer.tsx` → replace with re-export from `@udo-craft/ui` or delete and update all import sites to `@udo-craft/ui`
    - `apps/admin/src/components/mockup-viewer.tsx` → same treatment
    - Search for all `import.*MockupViewer` across both apps and update to `@udo-craft/ui`
    - Search for all `import.*BrandLogo` and `import.*ClarityInit` and update to `@udo-craft/ui`
    - _Preservation: MockupViewer with multi-side mockupsMap continues to render side-toggle buttons and lg layout_
    - _Requirements: 2.3, 2.4, 3.4_

- [x] 5. Update ProductCanvas.tsx and admin print-types.ts consumers to import from @udo-craft/shared

  - [x] 5.1 Remove local declarations from apps/client/src/components/ProductCanvas.tsx
    - Delete local `PRINT_TYPES`, `TEXT_FONTS`, `PrintLayer`, `PrintTypeId`, `TextFontId` declarations (lines ~10–55)
    - Add import: `import { PRINT_TYPES, TEXT_FONTS, type PrintLayer, type PrintTypeId, type TextFontId } from "@udo-craft/shared"`
    - _Bug_Condition: isBugCondition(artifact) where artifact.existsInBothApps AND artifact.hasNoDedicatedSharedPackageHome_
    - _Expected_Behavior: ProductCanvas imports PRINT_TYPES and PrintLayer from @udo-craft/shared_
    - _Preservation: Canvas editing, layer management, and mockup capture continue to work identically_
    - _Requirements: 2.2, 3.1, 3.2_

  - [x] 5.2 Convert apps/admin/src/components/print-types.ts to a re-export shim
    - Replace file contents with re-exports from `@udo-craft/shared`
    - `export { PRINT_TYPES, TEXT_FONTS, type PrintLayer, type PrintTypeId, type TextFontId } from "@udo-craft/shared"`
    - All existing admin consumers (layers-panel.tsx, product-canvas.tsx, orders/new/page.tsx) continue to work without import changes
    - _Requirements: 2.2, 3.2_

  - [x] 5.3 Update LayersPanel.tsx import
    - `apps/client/src/components/LayersPanel.tsx` imports `PRINT_TYPES`, `TEXT_FONTS`, `PrintLayer`, `PrintTypeId`, `TextFontId` from `./ProductCanvas` — update to import from `@udo-craft/shared` directly
    - _Requirements: 2.2_

- [x] 6. Create useCustomizer hook in packages/shared (or packages/hooks)

  - [x] 6.1 Create the hook file with UseCustomizerConfig interface
    - Create `packages/shared/src/useCustomizer.ts` (or `packages/hooks/useCustomizer.ts`)
    - Define `UseCustomizerConfig` interface: `uploadUrl: string`, `uploadResponseKey: string` ("urls[0]" for client, "results[0].url" for admin), `uploadTags?: string` (undefined for client, "print" for admin)
    - _Bug_Condition: isBugCondition(artifact) where artifact.existsInBothApps AND artifact.hasNoDedicatedSharedPackageHome_
    - _Expected_Behavior: useCustomizer hook exported from shared package with config for upload differences_
    - _Requirements: 2.5_

  - [x] 6.2 Extract addLayer, addTextLayer, resolveLayerPrice, handleAddToCart into the hook
    - Extract `addLayer(file: File)` — handles min-size pre-selection, FormData upload, setLayersWithRef; uses `config.uploadResponseKey` to parse response URL and `config.uploadTags` for FormData
    - Extract `addTextLayer()` — identical logic in both apps
    - Extract `resolveLayerPrice(layer, quantity, pricing)` — identical logic in both apps
    - Extract `handleAddToCart(...)` — upload wait loop, mockup capture, mockup upload, filteredMockups logic; uses `config.uploadResponseKey` for mockup upload response parsing
    - Return: `{ layers, setLayers, activeLayerId, setActiveLayerId, mockups, addLayer, addTextLayer, resolveLayerPrice, handleAddToCart, layersRef, captureRef }`
    - _Preservation: addLayer upload, min-size pre-selection, and real-time price breakdown continue to work identically in both apps_
    - _Requirements: 2.5, 3.1, 3.2_

  - [x] 6.3 Replace inline implementations in both page files with useCustomizer
    - `apps/client/src/app/order/page.tsx` (or `_main.tsx`): replace `addLayer`, `addTextLayer`, `resolveLayerPrice`, `handleAddToCart` with `const { ... } = useCustomizer({ uploadUrl: "/api/upload", uploadResponseKey: "urls[0]" })`
    - `apps/admin/src/app/(dashboard)/orders/new/page.tsx`: replace with `useCustomizer({ uploadUrl: "/api/upload", uploadResponseKey: "results[0].url", uploadTags: "print" })`
    - _Requirements: 2.5, 3.1, 3.2_

- [x] 7. Replace native `<select>` elements in LayersPanel.tsx with Shadcn Select primitives

  - [x] 7.1 Add Shadcn Select import to LayersPanel.tsx
    - Add: `import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"`
    - _Bug_Condition: isBugCondition(artifact) where artifact.isLayersPanelDropdown AND artifact.usesNativeSelect_
    - _Expected_Behavior: LayersPanel uses Shadcn Select primitives for print type and size dropdowns_
    - _Requirements: 2.1_

  - [x] 7.2 Replace print type native select (~line 220)
    - Replace `<select value={layer.type} onChange={...}>` with Shadcn `<Select value={layer.type} onValueChange={(val) => onTypeChange(layer.id, val as PrintTypeId)}>`
    - Use `<SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>` and `<SelectContent>` with `<SelectItem>` for each PRINT_TYPE
    - Preserve `e.stopPropagation()` behavior via `onPointerDown` on the wrapper
    - _Requirements: 2.1_

  - [x] 7.3 Replace size label native select (~line 240)
    - Replace `<select value={autoSelectedSize ?? ""} onChange={...}>` with Shadcn `<Select>`
    - Preserve the auto-selected size logic and the disabled placeholder option behavior
    - _Preservation: LayersPanel drag-and-drop reordering continues to call onReorder with correct updated array_
    - _Requirements: 2.1, 3.6_

- [x] 8. Replace hardcoded hex colors with Tailwind theme tokens / CSS variables

  - [x] 8.1 Fix touch ghost border in LayersPanel.tsx
    - Line in `onTouchStart`: `ghost.style.cssText = \`...border:2px solid #1B3BFF...\``
    - Replace `#1B3BFF` with `var(--color-primary)` or read from `getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()` at runtime
    - _Bug_Condition: isBugCondition(artifact) where artifact.containsHardcodedHex(['#1B3BFF']) AND artifact.tailwindThemeHasEquivalentToken_
    - _Expected_Behavior: Touch ghost border uses CSS variable instead of hardcoded hex_
    - _Requirements: 2.8_

  - [x] 8.2 Fix Fabric.js cornerStrokeColor and borderColor in ProductCanvas.tsx
    - `cornerStrokeColor: "#1B3BFF"` and `borderColor: "#1B3BFF"` in `fabric.Object.prototype.set({...})`
    - Replace with runtime CSS variable read: `const primary = typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() || "#1B3BFF" : "#1B3BFF"`
    - Add comment noting Fabric.js does not read CSS variables natively
    - _Requirements: 2.8_

  - [x] 8.3 Fix hardcoded hex in ContactForm.tsx and orders/page.tsx touch ghost
    - Search for `#1B3BFF` in `apps/client/src/components/ContactForm.tsx` and replace with `var(--color-primary)` or Tailwind `primary` class
    - Search for `#1B3BFF` in `apps/admin/src/app/(dashboard)/orders/page.tsx` touch ghost and replace with CSS variable
    - Search for `#1B18AC` in cabinet pages and replace with `var(--color-primary-dark)` or equivalent token
    - _Requirements: 2.8_

- [x] 9. Split orders/new/page.tsx (2006 lines) into sub-components under 300 lines each

  - [x] 9.1 Extract Section component
    - Create `apps/admin/src/app/(dashboard)/orders/new/_components/Section.tsx`
    - Move the `Section` function (~20 lines) from page.tsx into this file
    - Export as default or named export
    - _Bug_Condition: isBugCondition(artifact) where artifact.isPageFile AND artifact.lineCount > 300_
    - _Expected_Behavior: Each extracted file is under 300 lines_
    - _Requirements: 2.11_

  - [x] 9.2 Extract QtyPricePanel component
    - Create `apps/admin/src/app/(dashboard)/orders/new/_components/QtyPricePanel.tsx`
    - Move the right panel content (quantity stepper, discount grid, price breakdown, note textarea, add-to-cart button) into this component (~150 lines)
    - Accept props: product, quantity, setQuantity, discountPct, unitPrice, discounted, printCostPerUnit, total, layers, pricing, itemNote, setItemNote, onAddToCart, loading, addDisabledReason
    - _Requirements: 2.11_

  - [x] 9.3 Extract Customizer component
    - Create `apps/admin/src/app/(dashboard)/orders/new/_components/Customizer.tsx`
    - Move the `Customizer` function and its overlay layout (fixed inset-0, left/canvas/right panels, mobile sheet) into this file (~250 lines)
    - Import QtyPricePanel and Section from sibling files
    - _Preservation: Full Customizer flow (color/size selection, canvas editing, layer management, mockup capture, cart submission) continues to work_
    - _Requirements: 2.11, 3.2_

  - [x] 9.4 Extract CartSummary component
    - Create `apps/admin/src/app/(dashboard)/orders/new/_components/CartSummary.tsx`
    - Move cart items list, order form (customer data, delivery, tags, notes), and order submission logic into this component (~200 lines)
    - _Requirements: 2.11_

  - [x] 9.5 Reduce page.tsx to shell (~150 lines)
    - Keep only: data fetching (products, print zones, materials, variants), cart state (`useState<CartItem[]>`), and the top-level render that composes Customizer + CartSummary
    - Import all extracted sub-components
    - _Requirements: 2.11_

- [x] 10. Split order/page.tsx (1899 lines) and _main.tsx into sub-components under 300 lines each

  - [x] 10.1 Extract QtyPriceContent component
    - Create `apps/client/src/app/order/_components/QtyPriceContent.tsx`
    - Move the `QtyPriceContent` function from page.tsx (~150 lines) into this file
    - _Bug_Condition: isBugCondition(artifact) where artifact.isPageFile AND artifact.lineCount > 300_
    - _Expected_Behavior: Each extracted file is under 300 lines_
    - _Requirements: 2.11_

  - [x] 10.2 Extract Customizer component
    - Create `apps/client/src/app/order/_components/Customizer.tsx`
    - Move the `Customizer` function and its overlay layout into this file (~250 lines)
    - Import QtyPriceContent from sibling file
    - _Preservation: Customer adding a print layer continues to upload file, pre-select minimum print size, and update price breakdown in real time_
    - _Requirements: 2.11, 3.1_

  - [x] 10.3 Extract CartSummary component
    - Create `apps/client/src/app/order/_components/CartSummary.tsx`
    - Move cart items list, order submission form (customer data, delivery options, discount display), and submit handler into this component (~200 lines)
    - _Requirements: 2.11_

  - [x] 10.4 Reduce page.tsx and _main.tsx to under 300 lines each
    - `page.tsx`: keep Suspense wrapper and data fetching only (~100 lines)
    - `_main.tsx`: keep top-level state orchestration and composition of Customizer + CartSummary (~250 lines)
    - _Requirements: 2.11_

- [x] 11. Delete empty route folders and stale root markdown files

  - [x] 11.1 Delete empty admin route folders
    - Delete `apps/admin/src/app/api/fix-audit/` (empty, no route.ts)
    - Delete `apps/admin/src/app/api/remove-bg/` (empty, no route.ts)
    - Delete `apps/admin/src/app/(dashboard)/products/[id]/edit/` (empty)
    - Delete `apps/admin/src/app/(dashboard)/products/new/` (empty)
    - _Bug_Condition: isBugCondition(artifact) where artifact is empty route folder_
    - _Expected_Behavior: No empty scaffolding folders remain_
    - _Requirements: 2.12_

  - [x] 11.2 Delete stale root markdown files
    - Delete `DEPLOYMENT_CHECKLIST.md`
    - Delete `DEPLOYMENT_READY.md`
    - Delete `GITHUB_DEPLOYMENT_SETUP.md`
    - Delete `GITHUB_SETUP_COMPLETE.md`
    - Delete `BUSINESS_SETUP.md`
    - Keep `DEPLOYMENT.md` and `README.md`
    - _Requirements: 2.12_

- [x] 12. Add CreateLeadSchema Zod validation to both /api/leads POST handlers

  - [x] 12.1 Add Zod validation to apps/client/src/app/api/leads/route.ts
    - Import `CreateLeadSchema` from `@udo-craft/shared`
    - After `const body = await request.json()`, add: `const parsed = CreateLeadSchema.safeParse(body); if (!parsed.success) { return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }); }`
    - Replace loose destructuring with `const { status, customer_data, total_amount_cents } = parsed.data`
    - Keep `order_items` and `initial_message` as loose fields after schema validation (not part of CreateLeadSchema)
    - _Bug_Condition: isBugCondition(artifact) where artifact.isLeadPostHandler AND NOT artifact.usesZodValidation_
    - _Expected_Behavior: POST /api/leads returns structured { error: { fieldErrors: {...} } } with status 400 for invalid payloads_
    - _Preservation: Valid lead payload continues to return 201 with correct DB insert behavior_
    - _Requirements: 2.10, 3.1_

  - [x] 12.2 Add Zod validation to apps/admin/src/app/api/leads/route.ts
    - Same pattern as client handler
    - Import `CreateLeadSchema` from `@udo-craft/shared`
    - Add `safeParse` check before the existing `!status || !customer_data` check (replace the loose check)
    - Keep `order_items` and `tags` as loose fields after schema validation
    - _Requirements: 2.10_

- [x] 13. Delete verifyPermission stub and audit .gitignore / env file exposure

  - [x] 13.1 Delete verifyPermission from apps/admin/src/lib/api/errors.ts
    - Remove the `verifyPermission` function entirely (Option A from design)
    - The admin app enforces auth at middleware level (`src/middleware.ts`); no API route calls `verifyPermission`
    - Add a comment near `verifyAuth` noting that per-route permission checks are enforced at middleware level
    - _Bug_Condition: isBugCondition(artifact) where artifact.isPermissionCheck AND artifact.alwaysReturnsTrue_
    - _Expected_Behavior: verifyPermission no longer exported from errors.ts_
    - _Requirements: 2.9_

  - [x] 13.2 Audit .gitignore and untrack any committed .env files
    - Run `git ls-files apps/admin/.env apps/client/.env` — if output is non-empty, run `git rm --cached apps/admin/.env apps/client/.env`
    - Verify root `.gitignore` already excludes `.env`, `.env.local`, and variants (it does — no change needed)
    - Add explicit `.env` and `.env.*` entries to `apps/admin/.gitignore` and `apps/client/.gitignore` as belt-and-suspenders
    - Check `git log --all --full-history -- "**/.env"` to confirm whether credentials were ever committed; if so, rotate them
    - _Bug_Condition: isBugCondition(artifact) where artifact.isEnvFile AND artifact.isTrackedByGit_
    - _Expected_Behavior: git ls-files "**/.env" returns empty output_
    - _Requirements: 2.9, 3.9_

  - [x] 13.3 Add pre-commit hook to prevent future .env commits
    - Install `husky` and `lint-staged` at repo root if not already present
    - Configure a pre-commit hook that rejects commits containing `.env` files
    - _Requirements: 3.9_

- [x] 14. Checkpoint — Ensure all tests pass
  - Re-run the bug condition exploration test from task 1 — **Property 1: Expected Behavior** — all assertions should now PASS (confirms all 11 fix items are resolved)
  - Re-run the preservation property tests from task 2 — **Property 2: Preservation** — all assertions should still PASS (confirms no regressions)
  - Run `npm run type-check` from repo root — zero TypeScript errors across all packages
  - Run `npm run build` from repo root — both apps build successfully with Turborepo
  - Run `git ls-files "**/.env"` — returns empty output
  - Ensure all tests pass; ask the user if questions arise
