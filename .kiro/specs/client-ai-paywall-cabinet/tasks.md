# Implementation Plan: client-ai-paywall-cabinet

## Overview

Implement two features in `apps/client`:

1. **AI Paywall** — gate the three AI tools in the `/order` customizer behind Supabase Auth and a per-user free-usage quota of 3 generations, backed by a new `user_ai_quota` Postgres table and two API routes.
2. **Cabinet Enhancements** — add a "Файли" tab to the order detail panel, move the invoice button into the details tab (scoped per order), and add a "Написати менеджеру" shortcut on each order list entry.

Tasks are ordered by dependency: DB migration → API → hooks/components → customizer wiring → cabinet features.

---

## Tasks

- [x] 1. Database migration — `user_ai_quota` table, RLS policies, and `increment_ai_quota` RPC
  - Create `supabase/migrations/<timestamp>_user_ai_quota.sql`
  - Define the `user_ai_quota` table: `user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`, `attempts_used INTEGER NOT NULL DEFAULT 0`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - Enable RLS on the table and add three policies: `quota_select_own` (SELECT for authenticated where `user_id = auth.uid()`), `quota_insert_own` (INSERT WITH CHECK `user_id = auth.uid()`), `quota_update_own` (UPDATE USING/WITH CHECK `user_id = auth.uid()`)
  - Create the `increment_ai_quota(p_user_id uuid)` Postgres function that performs an atomic upsert: insert `(p_user_id, 1, now())` on conflict update `attempts_used = user_ai_quota.attempts_used + 1, updated_at = now()` and returns the new `attempts_used` value
  - _Requirements: 2.1, 3.5_

- [x] 2. API route — `GET /api/ai/quota`
  - Create `apps/client/src/app/api/ai/quota/route.ts`
  - Use the session-based Supabase client (`createClient()` from `@/lib/supabase/server`) to call `supabase.auth.getUser()`; return 401 if no session
  - Query `user_ai_quota` with `.from("user_ai_quota").select("attempts_used").eq("user_id", user.id).maybeSingle()`
  - If `data` is null (no row yet), return `{ attempts_used: 0, limit: 3 }` with status 200
  - Otherwise return `{ attempts_used: data.attempts_used, limit: 3 }` with status 200
  - On DB error, log server-side and return `{ attempts_used: 0, limit: 3 }` (fail-open)
  - _Requirements: 3.1, 3.2_

  - [ ]* 2.1 Write unit tests for `GET /api/ai/quota`
    - Test 401 response when no session
    - Test `{ attempts_used: 0, limit: 3 }` when no row exists
    - Test correct `attempts_used` value when row exists
    - _Requirements: 3.1, 3.2_

- [x] 3. API route — `POST /api/ai/quota/increment`
  - Create `apps/client/src/app/api/ai/quota/increment/route.ts`
  - Authenticate via `supabase.auth.getUser()`; return 401 if no session
  - Call `supabase.rpc("increment_ai_quota", { p_user_id: user.id })` using the service-role client to bypass RLS for the atomic upsert
  - Return `{ attempts_used: data, limit: 3 }` on success; return 500 on RPC error (log to Sentry)
  - _Requirements: 3.3, 3.4_

  - [ ]* 3.1 Write unit tests for `POST /api/ai/quota/increment`
    - Test 401 response when no session
    - Test that response shape is `{ attempts_used: number, limit: 3 }`
    - Test that a second call returns `attempts_used` incremented by 1 relative to the first
    - _Requirements: 3.3, 3.4_

- [x] 4. `useAiQuota` hook
  - Create `apps/client/src/hooks/useAiQuota.ts`
  - Define and export the `AiQuotaState` interface: `{ attemptsUsed: number; limit: number; isExhausted: boolean; loading: boolean; increment: () => Promise<void> }`
  - Implement `useAiQuota(isAuthenticated: boolean): AiQuotaState`
  - When `isAuthenticated === false`: return `{ attemptsUsed: 0, limit: 3, isExhausted: false, loading: false, increment: async () => {} }` without fetching
  - On mount when `isAuthenticated === true`: fetch `GET /api/ai/quota` and set `attemptsUsed` from the response; handle 404 as `attemptsUsed: 0`
  - `increment()`: call `POST /api/ai/quota/increment`, update local `attemptsUsed` from the response; catch errors silently and log to Sentry (do not update local state on failure)
  - `isExhausted` is derived: `attemptsUsed >= limit`
  - _Requirements: 2.3, 2.4, 2.5, 2.8, 2.9_

  - [ ]* 4.1 Write property test for quota gate — enabled below limit (Property 2)
    - **Property 2: Quota gate — enabled below limit**
    - For any `attemptsUsed` in `[0, 1, 2]`, `isExhausted` SHALL be `false`
    - **Validates: Requirements 2.4**

  - [ ]* 4.2 Write property test for quota gate — exhausted at or above limit (Property 3)
    - **Property 3: Quota gate — exhausted at or above limit**
    - For any `attemptsUsed >= 3`, `isExhausted` SHALL be `true`
    - **Validates: Requirements 2.5**

  - [ ]* 4.3 Write property test for quota increment monotonicity (Property 1)
    - **Property 1: Quota increment is monotonically increasing**
    - For any starting `attemptsUsed` value `n`, after calling `increment()` the returned `attempts_used` SHALL equal `n + 1`
    - **Validates: Requirements 2.2, 3.3**

- [x] 5. `PaywallModal` component
  - Create `apps/client/src/components/PaywallModal.tsx`
  - Accept props `{ open: boolean; onClose: () => void }`
  - Render as a fixed overlay (`z-[10010]`) with a semi-transparent backdrop; the customizer remains mounted behind it
  - Include: heading "Для використання AI потрібна реєстрація", body text explaining the 3 free generations, "Увійти" button (`router.push("/cabinet/login")`), "Зареєструватись" button (`router.push("/cabinet/login?mode=register")`), and a dismiss × button that calls `onClose`
  - Dismiss on backdrop click and Escape key (add `useEffect` keydown listener)
  - Use `next/navigation` `useRouter` for navigation; do NOT redirect — `onClose` only hides the modal
  - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 5.1 Write unit tests for `PaywallModal`
    - Test that it renders the login and register CTAs when `open={true}`
    - Test that `onClose` is called when the × button is clicked
    - Test that `onClose` is called on backdrop click
    - Test that `onClose` is called on Escape key press
    - _Requirements: 1.4, 1.5, 1.6, 1.8_

- [x] 6. Auth state in `order/_main.tsx`
  - In `apps/client/src/app/order/_main.tsx`, add `isAuthenticated: boolean` state (default `false`)
  - Add a `useEffect` that calls `supabase.auth.getUser()` on mount and sets `isAuthenticated(!!data.user)` — same pattern as `cabinet/page.tsx`
  - Instantiate `useAiQuota(isAuthenticated)` in this component
  - Pass `isAuthenticated` and `aiQuota` as new props into `<Customizer />`
  - _Requirements: 1.1, 1.2, 1.3, 2.3_

- [x] 7. Update `Customizer` props and internal wiring
  - Add `isAuthenticated: boolean` and `aiQuota: AiQuotaState` to `CustomizerProps` in `apps/client/src/app/order/_components/Customizer.tsx`
  - Pass `isAuthenticated` and `aiQuota` down to `<PrintsPanel>` (via the `panelContent` helper for the `"prints"` tab)
  - Pass `isAuthenticated` and `aiQuota` down to `<DrawPanel>` (which forwards them to `<DrawingModal>`)
  - Pass `isAuthenticated` and `aiQuota` to `<GenerationDrawer>`
  - Add local `paywallOpen` state; render `<PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />` at the bottom of the component (alongside the existing `<GenerationDrawer>`)
  - Update the "Приміряти на людину" button `onClick`: if `!isAuthenticated`, call `setPaywallOpen(true)` and return; otherwise `setAiDrawerOpen(true)` as before
  - _Requirements: 1.3, 2.3_

- [x] 8. Wire paywall + quota into `AIIllustrationSection` (PrintsPanel)
  - Update `AIIllustrationSection` props in `apps/client/src/app/order/_components/editor/PrintsPanel.tsx` to accept `isAuthenticated: boolean`, `aiQuota: AiQuotaState`, and `onPaywall: () => void`
  - Update `PrintsPanelProps` to include the same three props and thread them into `<AIIllustrationSection>`
  - In `AIIllustrationSection`, update the "Згенерувати" button `onClick` handler:
    - If `!isAuthenticated`: call `onPaywall()` and return
    - If `aiQuota.isExhausted`: return early (button is disabled)
    - Otherwise run existing generation logic; on successful generation (2xx response with `dataUrl`) call `await aiQuota.increment()`
  - When `aiQuota.isExhausted` is `true`: disable the "Згенерувати" button and render an inline quota-exhausted message below the textarea (e.g. "Ви використали 3 безкоштовні генерації")
  - _Requirements: 1.1, 2.4, 2.5, 2.6, 2.7, 2.9_

  - [ ]* 8.1 Write property test for quota increment only on success (Property 5)
    - **Property 5: Quota increment only on success**
    - For any AI generation attempt that results in a non-OK response, `increment()` SHALL NOT be called
    - **Validates: Requirements 2.9**

- [x] 9. Wire paywall + quota into `DrawingModal`
  - Update `DrawingModalProps` in `apps/client/src/app/order/_components/editor/DrawingModal.tsx` to accept `isAuthenticated: boolean`, `aiQuota: AiQuotaState`, and `onPaywall: () => void`
  - Update `DrawPanel` to accept and forward these props to `<DrawingModal>`
  - In `DrawingModal`, update the "Покращити з AI" button handler (`handleEnhanceAndPaste`):
    - If `!isAuthenticated`: call `onPaywall()` and return
    - If `aiQuota.isExhausted`: show inline quota-exhausted message and return
    - Otherwise run existing enhance logic; on success call `await aiQuota.increment()`
  - _Requirements: 1.2, 2.4, 2.5, 2.6, 2.7, 2.9_

- [x] 10. Wire paywall + quota into `GenerationDrawer` (try-on)
  - Update `GenerationDrawerProps` in `apps/client/src/app/order/_components/GenerationDrawer.tsx` to accept `aiQuota: AiQuotaState`
  - Inside `GenerationDrawer`, after a successful generation (when the result image is received and added as a layer), call `await aiQuota.increment()`
  - When `aiQuota.isExhausted` is `true` inside the drawer, show an inline quota-exhausted message and disable the generate action
  - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.9_

  - [ ]* 10.1 Write property test for quota shared across all AI features (Property 4)
    - **Property 4: Quota is shared across all AI features**
    - For any of the three AI features, a successful generation SHALL increment the same `user_ai_quota.attempts_used` counter
    - **Validates: Requirements 2.7**

- [x] 11. Checkpoint — AI paywall and quota complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. `aggregateOrderFiles` utility
  - Create `apps/client/src/lib/aggregateOrderFiles.ts`
  - Export `aggregateOrderFiles(lead: Lead, messages: Message[]): string[]`
  - Source 1: iterate `lead.order_items ?? []`; add each non-null `custom_print_url` to a `Set<string>`
  - Source 2: iterate `messages`; for each message where `sender === "client"` and `attachments` is a non-empty array, add each URL to the set
  - Return `Array.from(urls)`
  - Handle null/undefined `order_items` and null/non-array `attachments` gracefully (skip, no crash)
  - Import `Lead` and `Message` types from `apps/client/src/app/cabinet/page.tsx` (or extract them to a shared types file if needed)
  - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 12.1 Write property test for file aggregation deduplication (Property 6)
    - **Property 6: File aggregation deduplication**
    - For any lead and messages, `aggregateOrderFiles` SHALL return each URL at most once
    - Use `fc.array(fc.webUrl(), { maxLength: 10 })` for both print URLs and attachment URLs
    - **Validates: Requirements 4.4**

  - [ ]* 12.2 Write property test for file aggregation completeness — order items (Property 7)
    - **Property 7: File aggregation completeness — order items**
    - For any lead with non-null `custom_print_url` values in `order_items`, every such URL SHALL appear in the result
    - **Validates: Requirements 4.2**

  - [ ]* 12.3 Write property test for file aggregation completeness — client messages (Property 8)
    - **Property 8: File aggregation completeness — client messages**
    - For any messages where `sender === "client"` and `attachments` is non-empty, every attachment URL SHALL appear in the result
    - **Validates: Requirements 4.3**

- [x] 13. "Файли" tab in cabinet order detail panel
  - In `apps/client/src/app/cabinet/page.tsx`, add a `useMemo` that derives `orderFiles: string[]` via `aggregateOrderFiles(selectedLead, messages)` (depends on `[selectedLead, messages]`)
  - Refactor the detail area to use a proper tab bar with three tabs: "Деталі", "Чат", "Файли" — replacing the current `showInfo` toggle for the details/files content (keep `activeTab` state which is already typed as `"details" | "chat" | "files"`)
  - When `activeTab === "files"`: render the files grid inside the detail panel
    - If `orderFiles.length === 0`: render a centered "Файли відсутні" placeholder with a `FolderOpen` icon
    - Otherwise: render a responsive grid; image URLs (`isImage(url)`) as `<img>` thumbnails that call `setViewerUrl(url)` on click; non-image URLs as labelled file links (filename from `url.split("/").pop()`) that call `setViewerUrl(url)` on click
  - _Requirements: 4.1, 4.5, 4.6, 4.7, 4.8_

- [x] 14. Invoice button moved to "Деталі" tab
  - In `apps/client/src/app/cabinet/page.tsx`, move the "Завантажити рахунок (PDF)" button out of the `showInfo` side panel and into the `activeTab === "details"` content area
  - The button should be visible whenever a lead is selected and `activeTab === "details"`, regardless of `showInfo` state
  - Ensure `handleDownloadInvoice` reads `selectedLead` from the current closure (it already does — no logic change needed)
  - Keep the `generatingPdf` loading state and disabled behavior as-is
  - Remove the invoice button from the `showInfo` panel to avoid duplication
  - _Requirements: 5.1, 5.2, 5.4, 5.6_

  - [ ]* 14.1 Write property test for invoice scoped to selected lead (Property 9)
    - **Property 9: Invoice is scoped to selected lead**
    - For any two distinct leads A and B, if lead A is selected and the invoice button is clicked, `generateInvoicePDF` SHALL be called with data from lead A
    - **Validates: Requirements 5.2, 5.6**

  - [ ]* 14.2 Write property test for invoice data completeness (Property 10)
    - **Property 10: Invoice data completeness**
    - For any selected lead with at least one `order_item`, the `InvoiceData` passed to `generateInvoicePDF` SHALL contain a non-empty `items` array, a `contact` object with `name`/`email`/`phone`, and a `createdAt` date
    - **Validates: Requirements 5.3**

- [x] 15. "Написати менеджеру" shortcut on order list items
  - In `apps/client/src/app/cabinet/page.tsx`, add a `handleChatShortcut` function:
    ```ts
    const handleChatShortcut = (lead: Lead) => {
      setSelectedLead(lead);
      setActiveTab("chat");
      setMobileView("detail");
      setUnreadByLead((prev) => ({ ...prev, [lead.id]: 0 }));
    };
    ```
  - In the lead list `leads.map(...)` render, add a `MessageCircle` icon button to each list item that calls `handleChatShortcut(lead)` on click; stop propagation so it doesn't also trigger `handleSelectLead`
  - When `unreadByLead[lead.id] > 0`, show the unread count badge on the shortcut button (reuse the existing badge style already used for the unread count in the list item)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 15.1 Write property test for chat shortcut selects lead and opens chat tab (Property 11)
    - **Property 11: Chat shortcut selects lead and opens chat tab**
    - For any lead in the list, clicking its shortcut SHALL result in `selectedLead === that lead` AND `activeTab === "chat"`
    - **Validates: Requirements 6.2**

  - [ ]* 15.2 Write property test for chat shortcut resets unread count (Property 12)
    - **Property 12: Chat shortcut resets unread count**
    - For any lead with `unreadByLead[lead.id] > 0`, clicking its shortcut SHALL result in `unreadByLead[lead.id] === 0`
    - **Validates: Requirements 6.4**

  - [ ]* 15.3 Write property test for unread badge visibility (Property 13)
    - **Property 13: Unread badge visibility**
    - For any lead with `unreadByLead[lead.id] > 0`, the shortcut button SHALL render a badge; for any lead with count 0, no badge SHALL be shown
    - **Validates: Requirements 6.5**

- [x] 16. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** (`fc`) — place them in `apps/client/src/__tests__/ai-paywall-cabinet.property.test.ts`
- Unit tests can use the existing test setup in `apps/client`
- Each task references specific requirements for traceability
- The `increment_ai_quota` RPC is the authoritative increment path — never increment client-side
- The paywall is fail-safe: if auth check fails, `isAuthenticated` defaults to `false` (paywall shown)
- Quota API is fail-open: if the DB read fails, `attempts_used` defaults to 0 (user is not blocked)
