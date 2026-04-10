# Implementation Plan: consistent-order-layout

## Overview

Align the order flow shell in both apps to a consistent two-column split-screen layout on desktop, fix the iOS viewport height bug, and remove fixed bottom navigation bars in favour of inline buttons. Changes are purely Tailwind class adjustments and minor conditional-rendering fixes — no new dependencies.

## Tasks

- [x] 1. Fix viewport height in both apps' globals.css
  - In `apps/admin/src/app/globals.css`, add `height: 100vh; height: 100svh;` to the `html` element inside `@layer base`
  - In `apps/client/src/app/globals.css`, add `height: 100vh; height: 100svh;` to the existing `html` rule (currently only has `scroll-behavior: smooth`)
  - _Requirements: 1.3, 1.4_

- [x] 2. Admin app — CartSummary (DesktopCartPanel) width and empty-state
  - [x] 2.1 Update `DesktopCartPanel` in `apps/admin/src/app/(dashboard)/orders/new/_components/CartSummary.tsx`
    - Change `w-72` → `w-80` on the outer container div
    - Add an empty-state block inside the item list: when `cart.length === 0`, render a centred message ("Кошик порожній") with a `ShoppingCart` icon instead of the empty `<div>`
    - _Requirements: 2.4, 2.7, 3.4_

  - [ ]* 2.2 Write unit tests for admin DesktopCartPanel
    - Render with empty cart → assert empty-state message is present and no item rows are rendered
    - Render with one item → assert item name, quantity, size, colour are visible
    - _Requirements: 2.7_

- [x] 3. Admin app — MobileAdminCart safe-area and drawer style
  - [x] 3.1 Update `apps/admin/src/app/(dashboard)/orders/new/_components/MobileAdminCart.tsx`
    - On the trigger bar `div`, replace `pb-5` with an inline style `paddingBottom: "env(safe-area-inset-bottom, 20px)"`
    - Change the drawer container `rounded-t-2xl` → `rounded-t-3xl`
    - _Requirements: 1.6, 3.7, 3.8_

- [x] 4. Admin app — remove fixed bottom nav from CheckoutForm and ReviewStep
  - [x] 4.1 Update `apps/admin/src/app/(dashboard)/orders/new/_components/CheckoutForm.tsx`
    - Remove the `fixed bottom-0 left-0 right-0 z-50` wrapper div around the Back / Next buttons
    - Replace it with a plain `flex gap-2 pt-2` inline row at the bottom of the form content
    - Remove the `<div className="h-4" />` spacer that compensated for the fixed bar
    - _Requirements: 2.5, 2.6_

  - [x] 4.2 Update `apps/admin/src/app/(dashboard)/orders/new/_components/ReviewStep.tsx`
    - Remove the `fixed bottom-0 left-0 right-0 z-50` wrapper div around the Back / Submit buttons
    - Replace it with a plain `flex gap-2 pt-2` inline row
    - Remove the `<div className="h-16" />` spacer
    - _Requirements: 2.5, 2.6_

- [x] 5. Admin app — page.tsx layout wiring
  - [x] 5.1 Update `apps/admin/src/app/(dashboard)/orders/new/page.tsx`
    - Move `lg:pr-80` from the conditional inner content `div` to the scrollable column `div` (`flex-1 overflow-y-auto`), making it unconditional
    - Simplify the inner content `div` to `className="mx-auto px-4 py-6 space-y-6 max-w-full"` (remove the step-conditional `max-w-4xl pb-20` branch)
    - Change `DesktopCartPanel` render condition: remove `step === "catalog" && cart.length > 0` guard — always render it (the `hidden lg:flex` class already hides it on mobile)
    - Change `MobileAdminCart` render condition: remove `step === "catalog"` guard — render on all steps (component already returns `null` when cart is empty)
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2_

- [x] 6. Checkpoint — admin app
  - Ensure all admin app changes compile without TypeScript errors (`npm run type-check` from repo root)
  - Visually verify at 1280×800: both columns visible on all three steps, no content obscured by CartPanel
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Client app — DesktopCartPanel width and empty-state
  - [x] 7.1 Update `apps/client/src/app/order/_components/DesktopCartPanel.tsx`
    - Change `w-72` → `w-80` on the outer container div
    - Add an empty-state block: when `cart.length === 0`, render a centred "Кошик порожній" message with a `ShoppingCart` icon in the item list area
    - _Requirements: 2.4, 2.7, 3.4_

  - [ ]* 7.2 Write unit tests for client DesktopCartPanel
    - Render with empty cart → assert empty-state message is present
    - Render with one item → assert item name, quantity, size, colour are visible
    - _Requirements: 2.7_

- [x] 8. Client app — MobileCartBar safe-area fix
  - [x] 8.1 Update `apps/client/src/app/order/_components/MobileCartBar.tsx`
    - On the trigger bar `div`, replace `pb-5` with an inline style `paddingBottom: "env(safe-area-inset-bottom, 20px)"`
    - _Requirements: 1.5, 3.7_

- [x] 9. Client app — remove fixed bottom nav from ContactForm and OrderReview
  - [x] 9.1 Update `apps/client/src/app/order/_components/ContactForm.tsx`
    - Remove the `fixed bottom-0 left-0 right-0 z-50` wrapper div around the Back / Next buttons
    - Replace it with a plain `flex gap-2 pt-2` inline row at the bottom of the form content
    - Remove the `<div className="h-4" />` spacer
    - _Requirements: 2.5, 2.6_

  - [x] 9.2 Update `apps/client/src/app/order/_components/OrderReview.tsx`
    - Remove the `fixed bottom-0 left-0 right-0 z-50` wrapper div around the Back / Submit buttons
    - Replace it with a plain `flex gap-2 pt-2` inline row
    - _Requirements: 2.5, 2.6_

- [x] 10. Client app — _main.tsx layout wiring
  - [x] 10.1 Update `apps/client/src/app/order/_main.tsx`
    - Move `lg:pr-80` to the scrollable column `div` (`flex-1 overflow-y-auto`), unconditional
    - Simplify the inner content `div` to `className="mx-auto px-4 py-6 space-y-6 max-w-full"` (remove step-conditional `max-w-4xl pb-20` branch)
    - Change `DesktopCartPanel` render condition: remove `step === "select" && cart.length > 0` guard — always render
    - Change `MobileCartBar` render condition: remove `step === "select"` guard — render on all steps
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2_

- [ ] 11. Property-based tests
  - [ ]* 11.1 Write property test for StepHeader — completed steps always show Check icon (Property 1)
    - Use `fast-check` to generate a random `stepIdx` in `[0, 1, 2]`
    - Render `StepHeader` (admin or client) with that `stepIdx`
    - Assert: every bubble at position `j < stepIdx` contains a `<Check>` icon; every bubble at `j >= stepIdx` does not
    - **Property 1: Completed steps always show a Check icon**
    - **Validates: Requirements 4.3**

  - [ ]* 11.2 Write property test for MobileAdminCart / MobileCartBar — non-empty cart renders trigger (Property 2)
    - Use `fast-check` to generate a random array of 1–10 `CartItem` objects with arbitrary fields
    - Render the component and assert the trigger bar element is present
    - Also assert: empty array → trigger bar is absent
    - **Property 2: Non-empty cart always renders the mobile cart trigger**
    - **Validates: Requirements 5.2**

  - [ ]* 11.3 Write property test for mobile drawer — all required fields displayed (Property 3)
    - Use `fast-check` to generate a random `CartItem` with arbitrary `productName` (non-empty string), `quantity` (1–999), `size` (non-empty string), `color` (non-empty string), `unitPriceCents` + `printCostCents` (non-negative integers)
    - Open the drawer and assert rendered output contains `productName`, `quantity`, `size`, `color`, and the computed line total `((unitPriceCents + printCostCents) * quantity / 100).toFixed(0)`
    - **Property 3: Mobile drawer displays all required fields for every cart item**
    - **Validates: Requirements 5.4**

- [x] 12. Final checkpoint — Ensure all tests pass
  - Run `npm run type-check` and `npm run lint` from repo root
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are Tailwind class / conditional-render adjustments — no new packages required
- The `hidden lg:flex` class on `DesktopCartPanel` already handles mobile hiding; no extra guard needed after removing the step/cart conditions
- Property tests require `fast-check` — install it as a dev dependency if not already present before running tasks 11.1–11.3
