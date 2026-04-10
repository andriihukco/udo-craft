# Requirements Document

## Introduction

The order flow pages in both the admin app (`/orders/new`) and the client app (`/order`) need a consistent two-column split-screen layout on desktop. Currently the cart panel only appears when items are in the cart on the product-selection step, and the contact/review steps use a full-width layout with a fixed bottom navigation bar. The goal is a unified shell where the step content occupies the left column and the cart panel is always visible in a fixed right column on `lg+` screens — identical in both apps. A secondary concern is fixing the mobile viewport height bug on modern iPhones (15/16) where `100vh` causes UI elements to be obscured by browser chrome.

---

## Glossary

- **Admin_App**: The Next.js 14 application at `apps/admin`, served on port 3001, used by internal staff. Order flow at `/orders/new`.
- **Client_App**: The Next.js 14 application at `apps/client`, served on port 3000, used by customers. Order flow at `/order`.
- **Order_Shell**: The full-page wrapper for the order flow, containing the `StepHeader`, `StepContent`, `CartPanel`, and `MobileCartBar`.
- **StepHeader**: The sticky top bar (height `h-12`) spanning the full width, showing the back button, page title, and step-progress bubbles.
- **StepContent**: The left column (`flex-1`) containing the active step's UI — product picker, contact form, or review step.
- **CartPanel**: The fixed right column (`w-80`, 320 px) always visible on `lg+` screens, showing cart items, totals, and the checkout/submit action.
- **MobileCartBar**: The fixed bottom bar on mobile (`lg:hidden`) that opens a bottom-sheet drawer to show the cart.
- **SVH**: `100svh` — the CSS small viewport height unit, equal to the viewport height with browser chrome fully visible. Prevents content from being hidden behind iOS Safari's address bar or bottom indicator.
- **Safe_Area_Inset**: CSS environment variable `env(safe-area-inset-bottom)` used to pad content above the iOS home indicator.

---

## Requirements

### Requirement 1: Mobile Viewport Height Fix

**User Story:** As a customer or admin user on an iPhone 15/16, I want the page header and footer to always be fully visible within the browser window, so that I can navigate and interact without UI elements being hidden behind the browser chrome.

#### Acceptance Criteria

1. THE Client_App SHALL use `min-h-[100svh]` on the root page wrapper instead of `min-h-screen` alone, so the full UI is visible within the small viewport height on iOS Safari.
2. THE Admin_App SHALL use `min-h-[100svh]` on the root page wrapper instead of `min-h-screen` alone.
3. THE Client_App `globals.css` SHALL set `height: 100svh` on the `html` element (with a `height: 100vh` fallback) so that flex children can use `flex-1 min-h-0` to fill the viewport correctly.
4. THE Admin_App `globals.css` SHALL set `height: 100svh` on the `html` element (with a `height: 100vh` fallback) so that flex children can use `flex-1 min-h-0` to fill the viewport correctly.
5. WHEN the `MobileCartBar` bottom bar is rendered, THE `MobileCartBar` SHALL apply `padding-bottom: env(safe-area-inset-bottom, 20px)` so its content clears the iOS home indicator.
6. WHEN the `MobileAdminCart` bottom bar is rendered in the Admin_App, THE `MobileAdminCart` SHALL apply `padding-bottom: env(safe-area-inset-bottom, 20px)` so its content clears the iOS home indicator.

---

### Requirement 2: Two-Column Split-Screen Layout on Desktop

**User Story:** As a user on desktop, I want the order step content and cart to be visible side-by-side without scrolling, so I can see my cart at all times while filling in each step.

#### Acceptance Criteria

1. THE Order_Shell SHALL render a two-column layout on `lg+` screens: a `flex-1` left column for `StepContent` and a fixed `w-80` (320 px) right column for `CartPanel`.
2. THE `StepHeader` SHALL span the full width of the viewport at the top of the page, above both columns.
3. THE `CartPanel` SHALL be visible on `lg+` screens at all times during all steps (product selection, contact form, and review), regardless of whether the cart is empty.
4. THE `CartPanel` SHALL be fixed to the right side of the viewport (`fixed top-0 right-0 bottom-0 w-80`) so it remains in place as the step content scrolls.
5. THE `StepContent` left column SHALL apply `lg:pr-80` right padding to prevent its content from being obscured by the fixed `CartPanel`.
6. THE `StepContent` left column SHALL be independently scrollable (`overflow-y-auto`) so long forms or product grids scroll without affecting the `CartPanel`.
7. WHEN the `CartPanel` is empty (no items in cart), THE `CartPanel` SHALL display an empty-state message rather than being hidden.
8. THE `StepContent` area SHALL be designed so that typical step content (product grid, contact form, review) fits within the viewport height on a 1280×800 desktop screen without requiring vertical scrolling.

---

### Requirement 3: Consistent Layout in Both Apps

**User Story:** As a developer, I want the Order Shell layout to be structurally identical in both the admin and client apps, so that the user experience is the same and future changes only need to be made once.

#### Acceptance Criteria

1. THE Admin_App Order_Shell SHALL use the same outer wrapper classes as the Client_App: `flex flex-col flex-1 min-h-0`.
2. THE Admin_App Order_Shell body SHALL use the same classes as the Client_App: `flex-1 min-h-0 flex overflow-hidden` with an inner `flex-1 overflow-y-auto` scrollable left column.
3. THE Admin_App `StepHeader` SHALL use the same height, padding, and sticky positioning as the Client_App `StepHeader`: `h-12 px-4 border-b border-border shrink-0 flex items-center overflow-hidden relative sticky top-0 z-30 bg-background`.
4. THE Admin_App `CartPanel` SHALL use the same container classes as the Client_App `DesktopCartPanel`: `fixed top-0 right-0 bottom-0 z-40 w-80 border-l border-border bg-card flex-col shadow-xl`, visible on `lg+` screens.
5. THE Admin_App `CartPanel` header row SHALL use the same classes as the Client_App: `h-12 px-4 border-b border-border flex items-center justify-between shrink-0`.
6. THE Admin_App `CartPanel` footer row SHALL use the same classes as the Client_App: `p-3 border-t border-border shrink-0 space-y-2`.
7. THE Admin_App `MobileAdminCart` trigger bar SHALL use the same classes as the Client_App `MobileCartBar` trigger: `lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]` with `padding-bottom: env(safe-area-inset-bottom, 20px)`.
8. THE Admin_App `MobileAdminCart` bottom drawer SHALL use the same structural classes as the Client_App `MobileCartBar` drawer: `bg-card rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl`.

---

### Requirement 4: Step Progress Indicator Consistency

**User Story:** As a user, I want the step progress indicator to look and behave identically in both the admin and client order flows, so that the UI feels unified.

#### Acceptance Criteria

1. THE Admin_App `StepHeader` step bubbles SHALL use the same classes as the Client_App: `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0`, with `bg-emerald-500 text-white` for completed steps, `bg-primary text-primary-foreground` for the current step, and `bg-muted text-muted-foreground` for future steps.
2. THE Admin_App `StepHeader` step connector SHALL use the same class as the Client_App: `w-4 h-px bg-border`.
3. WHEN a step is completed, THE `StepHeader` SHALL render a `<Check>` icon (`size-3`) inside the step bubble in both apps.
4. THE Admin_App `StepHeader` back button SHALL use the same classes as the Client_App: `size-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 z-10`.

---

### Requirement 5: Mobile Cart Behaviour

**User Story:** As a user on mobile, I want the cart to be accessible via a bottom bar and drawer, so that I can review my cart without leaving the current step.

#### Acceptance Criteria

1. THE `CartPanel` SHALL be hidden on screens narrower than `lg` (`hidden lg:flex`) in both apps.
2. WHEN the cart contains at least one item, THE `MobileCartBar` SHALL be visible at the bottom of the screen on mobile in both apps.
3. WHEN the user taps the `MobileCartBar`, THE Order_Shell SHALL open a bottom-sheet drawer showing the full cart contents.
4. THE mobile bottom-sheet drawer SHALL display each cart item with its name, quantity, size, colour, and line total.
5. WHEN the user taps the checkout button in the mobile bottom-sheet drawer, THE Order_Shell SHALL close the drawer and advance to the contact step.
