# Design Document — consistent-order-layout

## Overview

Both the admin (`/orders/new`) and client (`/order`) order flows need a unified two-column split-screen shell on desktop. Today the cart panel only appears on the catalog step when the cart is non-empty, and the contact/review steps fall back to a full-width layout with a fixed bottom nav bar. The goal is a single, consistent `Order_Shell` pattern applied identically in both apps:

- `StepHeader` spans the full viewport width at the top (sticky, `h-12`)
- Left column (`flex-1`, independently scrollable) holds the active step content
- Right column (`fixed top-0 right-0 bottom-0 w-80`) holds the cart panel — always visible on `lg+`, even when empty
- Mobile collapses the cart to a bottom bar + bottom-sheet drawer
- iPhone 15/16 viewport height bug fixed via `100svh` + `env(safe-area-inset-bottom)`

No new dependencies are introduced. All changes are Tailwind class adjustments and minor conditional-rendering fixes.

---

## Architecture

The shell is not extracted into a shared package component — both apps already have their own `StepHeader`, `DesktopCartPanel`/`CartSummary`, and `MobileCartBar`/`MobileAdminCart`. The design aligns their classes and conditional logic rather than creating a new abstraction. This keeps the diff minimal and avoids cross-app coupling.

```
Order_Shell (page.tsx / _main.tsx)
├── <Customizer />          ← full-screen overlay, unchanged
├── <StepHeader />          ← full-width sticky bar, h-12
└── <body div>              ← flex-1 min-h-0 flex overflow-hidden
    ├── <left column>       ← flex-1 overflow-y-auto lg:pr-80
    │   └── step content    ← catalog / contact / review
    └── <CartPanel />       ← hidden lg:flex fixed top-0 right-0 bottom-0 w-80
        ├── header row      ← h-12 px-4 border-b ...
        ├── item list       ← flex-1 overflow-y-auto
        └── footer row      ← p-3 border-t ...
<MobileCartBar />           ← lg:hidden fixed bottom-0 (only when cart non-empty)
```

### Key layout invariants

| Element | Classes |
|---|---|
| Outer shell wrapper | `flex flex-col flex-1 min-h-0` |
| Body row | `flex-1 min-h-0 flex overflow-hidden` |
| Left column | `flex-1 overflow-y-auto lg:pr-80` |
| CartPanel container | `hidden lg:flex fixed top-0 right-0 bottom-0 z-40 w-80 border-l border-border bg-card flex-col shadow-xl` |
| CartPanel header | `h-12 px-4 border-b border-border flex items-center justify-between shrink-0` |
| CartPanel footer | `p-3 border-t border-border shrink-0 space-y-2` |
| MobileCartBar trigger | `lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]` + `paddingBottom: env(safe-area-inset-bottom, 20px)` |
| MobileCartBar drawer | `bg-card rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl` |

---

## Components and Interfaces

### Admin app — changes

#### `apps/admin/src/app/(dashboard)/orders/new/page.tsx`

The outer wrapper already uses `flex flex-col flex-1 min-h-0` — no change needed there.

**Body section** — currently:
```tsx
<div className="flex-1 min-h-0 flex overflow-hidden">
  <div className="flex-1 overflow-y-auto">
    <div className={`mx-auto px-4 py-6 space-y-6 ${step === "catalog" ? `max-w-full ${cart.length > 0 ? "lg:pr-80" : ""}` : "max-w-4xl pb-20"}`}>
```

**After** — `lg:pr-80` is always applied on the catalog step (not gated on `cart.length`), and the `CartPanel` is always rendered on `lg+` regardless of step or cart state:
```tsx
<div className="flex-1 min-h-0 flex overflow-hidden">
  <div className="flex-1 overflow-y-auto lg:pr-80">
    <div className="mx-auto px-4 py-6 space-y-6 max-w-full">
```

The `max-w-4xl pb-20` on checkout/review steps is removed — the fixed bottom nav bar (`pb-20` spacer) is no longer needed because navigation actions move into the `CartPanel` footer or inline within the step content.

**CartPanel visibility** — currently only rendered when `step === "catalog" && cart.length > 0`. Change to always render on `lg+`:
```tsx
// Always render — hidden class handles mobile
<DesktopCartPanel ... />
```

**MobileAdminCart** — currently only rendered when `step === "catalog"`. Change to render on all steps (it already returns `null` when cart is empty, so no visual change when cart is empty):
```tsx
// Render on all steps
<MobileAdminCart ... />
```

#### `apps/admin/src/app/(dashboard)/orders/new/_components/CartSummary.tsx` (`DesktopCartPanel`)

- Change `w-72` → `w-80` to match the `lg:pr-80` offset
- Add empty-state UI when `cart.length === 0`
- The `hidden lg:flex` class is already present — no change needed

#### `apps/admin/src/app/(dashboard)/orders/new/_components/MobileAdminCart.tsx`

- Change the trigger bar's `pb-5` to an inline style `paddingBottom: "env(safe-area-inset-bottom, 20px)"` for iPhone safe area
- Change drawer `rounded-t-2xl` → `rounded-t-3xl` to match client
- The `lg:hidden` class is already present — no change needed

#### `apps/admin/src/app/(dashboard)/orders/new/_components/CheckoutForm.tsx`

- Remove the `fixed bottom-0 left-0 right-0 z-50` sticky bottom nav bar. Navigation buttons (Back / Next) move to inline position at the bottom of the form content, or into the CartPanel footer area. This eliminates the `pb-20` spacer requirement.

#### `apps/admin/src/app/(dashboard)/orders/new/_components/ReviewStep.tsx`

- Same as CheckoutForm — remove fixed bottom nav, use inline buttons.

### Client app — changes

#### `apps/client/src/app/order/_main.tsx`

**Body section** — same pattern as admin. `lg:pr-80` moves from the inner content `div` to the scrollable column `div`, and is always applied (not gated on `cart.length`):
```tsx
<div className="flex-1 overflow-y-auto lg:pr-80">
  <div className="mx-auto px-4 py-6 space-y-6 max-w-full">
```

**CartPanel visibility** — currently only rendered when `step === "select" && cart.length > 0`. Change to always render.

**MobileCartBar** — currently only rendered when `step === "select"`. Change to render on all steps.

#### `apps/client/src/app/order/_components/DesktopCartPanel.tsx`

- Change `w-72` → `w-80`
- Add empty-state UI when `cart.length === 0`

#### `apps/client/src/app/order/_components/MobileCartBar.tsx`

- Change trigger bar `pb-5` → inline style `paddingBottom: "env(safe-area-inset-bottom, 20px)"`

#### `apps/client/src/app/order/_components/CartSummary.tsx`

- The `fixed bottom-0` sticky nav bar inside `CartSummary` (contact/review steps) is removed. Navigation buttons become inline.

### Viewport fix — `globals.css`

Both apps need the following added to their `globals.css`:

```css
/* Admin: apps/admin/src/app/globals.css */
/* Client: apps/client/src/app/globals.css */

html {
  height: 100vh;          /* fallback for browsers without svh support */
  height: 100svh;         /* iOS Safari 15.4+ — excludes browser chrome */
}
```

This allows the `SidebarInset` (admin) and the root `<body>` (client) to use `flex-1 min-h-0` and fill the viewport correctly without overflow.

---

## Data Models

No new data models are introduced. The layout change is purely structural/presentational. Existing types (`CartItem`, `ContactData`, `CartItem`) are unchanged.

The only state change is that `DesktopCartPanel` and `MobileCartBar`/`MobileAdminCart` are now rendered unconditionally (with respect to step), so their props must always be available — which they already are since `cart`, `totalCents`, `onEdit`, `onRemove`, and `onCheckout` are all defined at the top level of the page component.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Completed steps always show a Check icon

*For any* step index `i` in `[0, 1, 2]`, when the `StepHeader` is rendered with `stepIdx = i`, every step bubble at position `j < i` SHALL contain a `<Check>` icon, and every bubble at position `j >= i` SHALL NOT contain a `<Check>` icon.

**Validates: Requirements 4.3**

### Property 2: Non-empty cart always renders the mobile cart trigger

*For any* non-empty cart (varying number of items, product names, quantities, prices), the `MobileCartBar` / `MobileAdminCart` component SHALL render the trigger bar element. When the cart is empty, the trigger bar SHALL NOT be rendered.

**Validates: Requirements 5.2**

### Property 3: Mobile drawer displays all required fields for every cart item

*For any* cart item with arbitrary `productName`, `quantity`, `size`, `color`, and line total, when the mobile bottom-sheet drawer is open, the rendered output SHALL contain the item's name, quantity, size, colour, and computed line total.

**Validates: Requirements 5.4**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Cart is empty when CartPanel is always-visible | CartPanel renders an empty-state message ("Кошик порожній") instead of hiding |
| `env(safe-area-inset-bottom)` not supported | Falls back to `20px` via the CSS `env()` fallback argument |
| `100svh` not supported (older browsers) | `height: 100vh` fallback rule declared first in globals.css |
| Admin sidebar is open when entering `/orders/new` | Existing `setSidebarOpen(false)` call in `useEffect` already handles this |
| Fixed CartPanel overlaps content on exactly `lg` breakpoint | `lg:pr-80` on the scrollable column prevents any overlap |

---

## Testing Strategy

This feature is a layout/CSS alignment change. The acceptance criteria are predominantly static configuration checks (CSS classes, element presence) rather than algorithmic logic. Property-based testing applies to a small subset of criteria where behavior varies meaningfully with input.

### Unit / Example Tests

- Render `StepHeader` at each step index and assert correct bubble states (Check icon vs number)
- Render `DesktopCartPanel` with empty cart and assert empty-state message is present
- Render `DesktopCartPanel` with non-empty cart and assert items are listed
- Render `MobileCartBar` / `MobileAdminCart` with empty cart and assert trigger bar is not rendered
- Render `MobileCartBar` / `MobileAdminCart` with non-empty cart and assert trigger bar is rendered
- Simulate tap on `MobileCartBar` trigger and assert drawer opens
- Simulate tap on checkout button in drawer and assert `onCheckout` is called

### Property-Based Tests

Use a property-based testing library (e.g., `fast-check` for TypeScript/Jest).

**Property 1 — Completed steps show Check icon**
- Generator: random `stepIdx` in `[0, 1, 2]`
- Assertion: for all `j < stepIdx`, bubble `j` contains `<Check>`; for all `j >= stepIdx`, bubble `j` does not
- Tag: `Feature: consistent-order-layout, Property 1: completed steps always show a Check icon`
- Minimum iterations: 100

**Property 2 — Non-empty cart renders mobile trigger**
- Generator: random array of 1–10 `CartItem` objects with arbitrary fields
- Assertion: trigger bar element is present in rendered output
- Also test: empty array → trigger bar is absent
- Tag: `Feature: consistent-order-layout, Property 2: non-empty cart always renders the mobile cart trigger`
- Minimum iterations: 100

**Property 3 — Drawer displays all required fields**
- Generator: random `CartItem` with arbitrary `productName` (non-empty string), `quantity` (1–999), `size` (non-empty string), `color` (non-empty string), `unitPriceCents` + `printCostCents` (non-negative integers)
- Assertion: rendered drawer string contains `productName`, `quantity`, `size`, `color`, and the computed line total `((unitPriceCents + printCostCents) * quantity / 100).toFixed(0)`
- Tag: `Feature: consistent-order-layout, Property 3: mobile drawer displays all required fields for every cart item`
- Minimum iterations: 100

### Smoke / Visual Checks

- Manually verify layout at 1280×800 (desktop) — both columns visible, no overlap
- Manually verify on iPhone 15 Safari — header and bottom bar fully visible, no chrome overlap
- Verify `globals.css` contains `height: 100svh` rule in both apps
