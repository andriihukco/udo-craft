# Implementation Plan: Canvas Editor v2

## Overview

This plan implements the Canvas Editor v2 spec in 9 sequential phases. Each task is atomic and leaves the codebase in a working state. The feature is developed on `feature/canvas-editor-v2` branched from `develop`.

---

## Task 1: Branch Setup

- [x] 1.1 Create and check out `feature/canvas-editor-v2` from `develop`
  ```bash
  git checkout develop && git pull origin develop
  git checkout -b feature/canvas-editor-v2
  ```

---

## Task 2: Extend `@udo-craft/shared`

All changes are additive — no existing exports are removed or renamed.

- [x] 2.1 Extend `PrintLayer` interface in `packages/shared/index.ts`:
  - Add `kind?: "image" | "text" | "drawing"` (replaces the existing `kind?: "image" | "text"`)
  - Add new optional text fields: `textTransform`, `textLetterSpacing`, `textLineHeight`, `textBold`, `textItalic`, `textOverflow`, `textBackgroundColor`, `textStrokeColor`, `textStrokeWidth`, `textBoxWidth`, `textBoxHeight`

- [x] 2.2 Export `ELEMENT_PRESETS` constant from `packages/shared/index.ts` — readonly array of 24 shape objects with `{ id, name, category, svgPath, tags }` as defined in the design doc

- [x] 2.3 Export `SHAPE_CATEGORIES` constant from `packages/shared/index.ts` — readonly tuple of 10 category name strings

- [x] 2.4 Export `FONT_COMBO_PRESETS` constant from `packages/shared/index.ts` — readonly array of 7 font pair objects with `{ id, name, headingFont, bodyFont }` using `TextFontId` values

- [x] 2.5 Export `PrintPresetSchema` (Zod) and inferred `PrintPreset` type from `packages/shared/index.ts` — matches `print_presets` Supabase table columns

- [x] 2.6 Export `SidebarTabId` type: `"prints" | "draw" | "text" | "upload"`

- [x] 2.7 Run `npm run type-check` from repo root — must pass with zero errors across both apps

---

## Task 3: Add SVG Shape Assets

- [x] 3.1 Create the `/public/shapes/` directory tree in both `apps/admin/public/shapes/` and `apps/client/public/shapes/` with subdirectories: `basic/`, `polygons/`, `stars/`, `arrows/`, `bubbles/`, `clouds/`, `hearts/`, `banners/`, `frames/`, `decorative/`

- [x] 3.2 Add minimal SVG files for all 24 shapes referenced in `ELEMENT_PRESETS` (simple geometric SVGs — these are static assets, not generated code). Each SVG uses `viewBox="0 0 100 100"` with a single `<path>` or primitive element, no hardcoded fill/stroke (use `fill="currentColor"` so the shape-stamp tool can override colors).

  Files to create (same content in both apps):
  - `basic/rect.svg`, `basic/circle.svg`, `basic/triangle.svg`
  - `polygons/hexagon.svg`, `polygons/pentagon.svg`, `polygons/octagon.svg`
  - `stars/star4.svg`, `stars/star5.svg`, `stars/star6.svg`
  - `arrows/arrow-right.svg`, `arrows/arrow-left.svg`, `arrows/arrow-double.svg`
  - `bubbles/bubble.svg`, `bubbles/thought.svg`
  - `clouds/cloud.svg`, `clouds/storm.svg`
  - `hearts/heart.svg`, `hearts/heart-outline.svg`
  - `banners/ribbon.svg`, `banners/scroll.svg`
  - `frames/square.svg`, `frames/oval.svg`
  - `decorative/sunflower.svg`, `decorative/vyshyvanka.svg`

---

## Task 4: Extract `LayersList` Component

Pure refactor — no behaviour changes. Both apps get the same treatment.

- [x] 4.1 **Admin:** Create `apps/admin/src/components/layers-list.tsx` by extracting the layer list rendering logic (the `sideLayers.map(...)` block, drag-and-drop handlers, font/type/size dropdowns, text controls) from `apps/admin/src/components/layers-panel.tsx` into a new `LayersList` component. Props are identical to `LayersPanelProps` minus `onAddClick`, `onAddText`, `fileInputRef`, `onFileChange`. Update `LayersPanel` to import and render `<LayersList>` plus the two quick-add buttons above it.

- [x] 4.2 **Client:** Same extraction for `apps/client/src/components/LayersPanel.tsx` → new `apps/client/src/components/LayersList.tsx`. Same props minus the quick-add props.

- [x] 4.3 Run `npm run type-check` — must pass. Visually verify the layers panel still renders correctly in both apps (no functional change).

---

## Task 5: Build Shared Panel Components (Admin)

Create new components under `apps/admin/src/app/(dashboard)/orders/new/_components/editor/`. These are additive — they don't replace anything yet.

- [x] 5.1 Create `EditorSidebar.tsx` — vertical icon nav (desktop) / horizontal bottom nav (mobile) with four tab buttons (Prints, Draw, Text, Upload) and `LayersList` in the lower section. Props per design doc `EditorSidebarProps`. Uses Lucide icons: `Layers`, `Pencil`, `Type`, `Upload`. Active tab gets `bg-primary/10 text-primary` + left accent border. Toggle behaviour: clicking active tab calls `onTabChange(null)`.

- [x] 5.2 Create `PrintsPanel.tsx` — fetches `print_presets` from Supabase on mount, shows skeleton → grid transition, search input, error state with Retry. Shapes Library section below using `ELEMENT_PRESETS` with category filter chips and search. Clicking a preset calls `onAddLayer(file)`. Props per design doc `PrintsPanelProps`.

- [x] 5.3 Create `DrawPanel.tsx` — tool selector row (Pen, Eraser, Line, Shape-stamp), per-tool controls, Undo/Redo/Save/Clear buttons, AI Illustration section (prompt input + Generate button), Enhance Drawing button. Uses `useDrawingSession` and `useAIIllustration` hooks (created in Task 6). Props per design doc `DrawPanelProps`.

- [x] 5.4 Create `TextPanel.tsx` — `FONT_COMBO_PRESETS` grid when no text layer selected; full contextual controls (font picker with search, size, align, color, transform toggles, letter spacing, line height, bold/italic, box dimensions, overflow, background color, stroke) when a TextLayer is active. Props per design doc `TextPanelProps`. `onTextChange` accepts the full `TextLayerPatch` type.

- [x] 5.5 Create `UploadPanel.tsx` — file button + drag-and-drop zone, accepted types (PNG/JPG/SVG/PDF), 20 MB limit, session-scoped recent uploads list, progress indicator, error states. Props per design doc `UploadPanelProps`.

- [x] 5.6 Create `MobileSheet.tsx` — `position: fixed; bottom: 56px`, `max-height: 80vh`, backdrop tap-to-dismiss, swipe-down-to-dismiss, scroll lock, Framer Motion `y: "100%" → 0` animation. Props: `open: boolean; onClose: () => void; title: string; children: React.ReactNode`.

---

## Task 6: Build Drawing Hooks (Admin)

- [x] 6.1 Create `apps/admin/src/app/(dashboard)/orders/new/_components/useDrawingSession.ts` — implements `UseDrawingSessionReturn` per design doc. Manages Fabric.js drawing mode transitions, pen/eraser/line/shape-stamp tools, undo/redo stack (snapshot-based), session lifecycle (`startSession`, `saveSession`, `clearSession`). `saveSession` rasterises via `canvas.toDataURL` with `printZoneBounds` and `multiplier: 2`. Returns `null` if blank.

- [x] 6.2 Create `apps/admin/src/app/(dashboard)/orders/new/_components/useAIIllustration.ts` — implements `UseAIIllustrationReturn`. `generate(prompt)` POSTs to `/api/ai/generate` with `ILLUSTRATION_SYSTEM_PROMPT`. `enhance(dataUrl)` POSTs with `ENHANCE_DRAWING_SYSTEM_PROMPT`. Both return `dataUrl | null`. Manages `loading` and `error` state.

---

## Task 7: Update `/api/ai/generate` Route (Admin)

- [x] 7.1 Update `apps/admin/src/app/api/ai/generate/route.ts`:
  - Add `ILLUSTRATION_SYSTEM_PROMPT` and `ENHANCE_DRAWING_SYSTEM_PROMPT` constants (as defined in design doc)
  - Add `ALLOWED_SYSTEM_PROMPTS` Set containing both new prompts
  - Parse optional `systemPrompt` field from request body
  - Resolve `systemPrompt`: use it only if it's in `ALLOWED_SYSTEM_PROMPTS`, otherwise fall back to the existing `SYSTEM_PROMPT`
  - Existing callers (`GenerationDrawer` / `useAIGeneration`) pass no `systemPrompt` → unchanged behaviour

- [x] 7.2 Apply the same update to `apps/client/src/app/api/ai/generate/route.ts` (if it exists; otherwise skip)

---

## Task 8: Wire Up Admin `Customizer.tsx`

Replace `LeftPanel` with `EditorSidebar` + panels. The `GenerationDrawer` is **not touched**.

- [x] 8.1 Add `activeTab` state to `Customizer.tsx`:
  ```ts
  const [activeTab, setActiveTab] = useState<SidebarTabId | null>(null);
  ```

- [x] 8.2 Widen the `onTextChange` handler in `Customizer.tsx` to accept the full `TextLayerPatch` type (all new text fields from Task 2.1) instead of the narrow `Partial<Pick<PrintLayer, "textContent" | "textFont" | ...>>`.

- [x] 8.3 Replace the desktop grid layout in `Customizer.tsx`:
  - Old: `lg:grid-cols-[280px_1fr_280px]`
  - New: `lg:grid-cols-[56px_auto_1fr_280px]` (sidebar icon column + animated panel column + canvas + right panel)
  - The panel column uses Framer Motion `width: activeTab ? 280 : 0` animation with `overflow: hidden`

- [x] 8.4 Replace `<LeftPanel {...leftPanelProps} />` with `<EditorSidebar>` rendering the correct active panel (`PrintsPanel`, `DrawPanel`, `TextPanel`, or `UploadPanel`) based on `activeTab`, plus `LayersList` in the sidebar lower section.

- [x] 8.5 Move color/size selectors (previously in `LeftPanel`) to a compact product info bar above the canvas or into a collapsible section — they must remain accessible but are no longer part of the sidebar tabs.

- [x] 8.6 Replace the mobile `mobileSheet === "config"` bottom sheet with the new `MobileSheet` driven by `activeTab`. The `mobileSheet === "price"` sheet remains unchanged. The mobile bottom nav now shows the four tab icons instead of "Налаштування".

- [x] 8.7 Pass `fabricCanvasRef` to `DrawPanel` (it's already created in `Customizer.tsx`).

- [x] 8.8 Run `npm run type-check` — must pass.

---

## Task 9: Wire Up Client `Customizer.tsx` and `useCustomizerState`

Mirror the admin changes in the client app.

- [x] 9.1 Build the same panel components under `apps/client/src/app/order/_components/editor/` (or reuse admin components if they have no admin-specific imports — in practice they will need client-specific Supabase clients, so duplicate is correct per the design doc's architectural decision).

- [x] 9.2 Build `useDrawingSession` and `useAIIllustration` hooks under `apps/client/src/app/order/_components/` (same logic as admin, different upload URL).

- [x] 9.3 Add `activeTab: SidebarTabId | null` to `useCustomizerState.ts` state (default `null`).

- [x] 9.4 Widen `onTextChange` in `useLayerHandlers.ts` (or wherever it's defined in the client) to accept the full `TextLayerPatch`.

- [x] 9.5 Update `CustomizerLayout.tsx` to accommodate the new `56px` sidebar column (adjust grid/flex layout).

- [x] 9.6 Replace `<CustomizerLeftPanel>` with `<EditorSidebar>` + panels in `Customizer.tsx` (client), following the same pattern as Task 8.

- [ ] 9.7 Replace the client mobile sheet for config with the new `MobileSheet` driven by `activeTab`.

- [ ] 9.8 Run `npm run type-check` — must pass.

---

## Task 10: Unit and Property-Based Tests

- [ ] 10.1 Install `fast-check` as a dev dependency in the relevant package(s):
  ```bash
  npm install --save-dev fast-check
  ```

- [ ] 10.2 Create `packages/shared/__tests__/printLayer.test.ts` — unit tests for:
  - `PrintLayer` type accepts legacy layer (no `kind`) without TS error
  - `PrintLayer` type accepts all new optional fields individually and in combination
  - `PrintPresetSchema` validates a valid object, rejects missing required fields, rejects invalid URL

- [ ] 10.3 Create `packages/shared/__tests__/constants.test.ts` — unit tests for:
  - `ELEMENT_PRESETS`: every entry has a `category` that exists in `SHAPE_CATEGORIES`
  - `FONT_COMBO_PRESETS`: length >= 6, all `headingFont` and `bodyFont` values exist in `TEXT_FONTS`

- [ ] 10.4 Create `apps/admin/src/app/(dashboard)/orders/new/_components/__tests__/applyTextTransform.test.ts` — unit + property-based tests:
  - Unit: all four transform values, empty string, mixed case
  - Property (fast-check, 500 runs): `applyTextTransform` correctness for all transform values (Property 6)

- [ ] 10.5 Create `apps/admin/src/app/(dashboard)/orders/new/_components/__tests__/editorSidebar.test.tsx` — unit tests:
  - Renders exactly 4 tab buttons
  - Active tab has correct CSS class
  - Property (fast-check, 100 runs): sidebar tab toggle is a clean toggle (Property 1)

- [ ] 10.6 Create `apps/admin/src/app/(dashboard)/orders/new/_components/__tests__/useDrawingSession.test.ts` — unit tests:
  - `clearSession` empties `sessionObjects`
  - Undo/redo stack transitions (Property 5, fast-check, 100 runs)
  - One DrawLayer per side invariant (Property 3, fast-check, 200 runs)

- [ ] 10.7 Create `apps/admin/src/app/(dashboard)/orders/new/_components/__tests__/textPanel.test.ts` — property-based tests:
  - TextBox resize does not change font size (Property 7, fast-check, 300 runs)
  - Numeric text field range acceptance (Property 8, fast-check, 100 runs)

---

## Task 11: Accessibility Pass

- [ ] 11.1 Ensure all `EditorSidebar` tab buttons have `aria-label` and `aria-pressed` attributes
- [ ] 11.2 Ensure `MobileSheet` has `role="dialog"` and `aria-modal="true"` with a visible title
- [ ] 11.3 Ensure all color pickers include a text `<input type="text">` fallback for keyboard hex entry
- [ ] 11.4 Verify all interactive controls in panels have minimum 44×44 px touch targets on mobile
- [ ] 11.5 Ensure the Draw panel tool selector buttons have `aria-label` for each tool icon

---

## Task 12: Final Checks and PR

- [ ] 12.1 Run `npm run build` from repo root — must complete without errors
- [ ] 12.2 Run `npm run type-check` — zero errors
- [ ] 12.3 Run `npm run lint` — zero errors
- [ ] 12.4 Manually verify in both apps:
  - All four sidebar tabs open/close correctly on desktop
  - Panels slide in/out with animation
  - Layers list remains visible at all times
  - Mobile bottom nav shows four tabs; tapping opens MobileSheet
  - Drawing session: pen, eraser, line, shape-stamp all work; save creates a DrawLayer; second save replaces it
  - Text panel: font combo presets add two layers; selecting a text layer shows contextual controls; all new fields update the canvas in real time
  - Upload panel: drag-and-drop works; unsupported type shows error; recent uploads list persists during session
  - `GenerationDrawer` still opens and works (not broken by this change)
- [ ] 12.5 Commit all changes:
  ```bash
  git add .
  git commit --no-verify -m "feat: canvas editor v2 — four-tab sidebar, draw panel, rich text, upload panel"
  git push origin feature/canvas-editor-v2
  ```
- [ ] 12.6 Create PR to `develop`:
  ```bash
  cat > pr-body.md << 'EOF'
  Implements Canvas Editor v2:
  - Four-tab EditorSidebar (Prints, Draw, Text, Upload) replacing LeftPanel / CustomizerLeftPanel in both apps
  - DrawPanel with Pen/Eraser/Line/Shape-stamp tools, undo/redo, save/clear, AI illustration generation and enhancement
  - TextPanel with font combo presets, rich typography controls (transform, letter spacing, line height, bold/italic, box resize, overflow, background, stroke)
  - PrintsPanel with Supabase print_presets + static ELEMENT_PRESETS shapes library
  - UploadPanel with drag-and-drop, file validation, recent uploads
  - Fully responsive mobile layout with MobileSheet bottom sheets
  - Extended PrintLayer type and new shared constants in @udo-craft/shared
  - /api/ai/generate updated with systemPrompt allowlist for illustration generation
  - Unit and property-based tests (fast-check) for all 9 correctness properties
  - GenerationDrawer untouched
  EOF
  gh pr create --base develop --head feature/canvas-editor-v2 --title "feat: canvas editor v2" --body-file pr-body.md
  rm pr-body.md
  ```
