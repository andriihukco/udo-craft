# Requirements Document

## Introduction

This spec covers two related enhancements to `apps/client` (u-do-craft.store):

**Feature 1 — AI Features Paywall:** Three AI-powered tools in the `/order` product customizer (AI illustration generation, drawing improvement with AI, and "Приміряти на людину" / try-on mockup) are currently accessible to all visitors. This feature gates them behind authentication and introduces a per-user free-usage quota of 3 AI generations, persisted in the database.

**Feature 2 — Cabinet Order History Enhancements:** The `/cabinet` page shows a list of orders (leads). Each order entry needs three additions: a list of files the user uploaded for that order, a working invoice download button scoped per order, and a "Chat with manager" shortcut that navigates directly to the chat tab for that order.

The stack is Next.js 14, Supabase Auth + Postgres, and Tailwind CSS. All changes are confined to `apps/client`.

---

## Glossary

- **Paywall_Modal**: The registration/login prompt modal shown to guest users when they attempt to use an AI feature.
- **AI_Feature**: Any of the three gated capabilities: AI Illustration Generation, Drawing Improvement (AI), or Try-On Mockup.
- **AI_Quota**: The count of AI generation attempts consumed by a logged-in user, persisted in the `user_ai_quota` table.
- **Guest_User**: A visitor who has not authenticated via Supabase Auth (no active session).
- **Authenticated_User**: A visitor with a valid Supabase Auth session.
- **Free_Tier_Limit**: The maximum number of AI generation attempts available at no cost — currently 3.
- **Quota_Exhausted_State**: The condition where an Authenticated_User's AI_Quota equals or exceeds the Free_Tier_Limit.
- **Order_Entry**: A single lead record displayed in the `/cabinet` order history list.
- **Order_Files**: Files associated with an order — sourced from `order_items.custom_print_url` and from `messages.attachments` where `sender = 'client'`.
- **Invoice**: A PDF document generated client-side by `generateInvoicePDF` for a specific order.
- **Chat_View**: The "chat" tab within the `/cabinet` detail panel for a selected order.
- **Customizer**: The `/order` page interactive product editor built on Fabric.js.
- **PrintsPanel**: The sidebar panel in the Customizer that contains the AI Illustration Generation section (`AIIllustrationSection`).
- **DrawingModal**: The full-screen drawing studio opened from the Draw tab, which contains the "Покращити з AI" (Drawing Improvement) button.
- **GenerationDrawer**: The bottom-sheet drawer in the Customizer triggered by the "Приміряти на людину" button.

---

## Requirements

### Requirement 1: Guest Paywall for AI Features

**User Story:** As a guest user, when I try to use any AI feature in the Customizer, I want to be prompted to register or log in, so that AI capabilities are reserved for registered users.

#### Acceptance Criteria

1. WHEN a Guest_User clicks the "Згенерувати" button in the AI Illustration Generation section of PrintsPanel, THE Paywall_Modal SHALL be displayed instead of initiating generation.
2. WHEN a Guest_User clicks the "Покращити з AI" button in DrawingModal, THE Paywall_Modal SHALL be displayed instead of initiating enhancement.
3. WHEN a Guest_User clicks the "Приміряти на людину" button that opens GenerationDrawer, THE Paywall_Modal SHALL be displayed instead of opening the drawer.
4. THE Paywall_Modal SHALL contain a call-to-action button that navigates the user to `/cabinet/login`.
5. THE Paywall_Modal SHALL contain a call-to-action button that navigates the user to `/cabinet/login?mode=register` (or equivalent registration route).
6. THE Paywall_Modal SHALL display a message explaining that registration is required to use AI features.
7. WHEN the Paywall_Modal is open, THE Customizer SHALL remain visible and interactive in the background (modal overlay, not full redirect).
8. THE Paywall_Modal SHALL be dismissible so the user can return to the Customizer without navigating away.

---

### Requirement 2: Per-User AI Generation Quota

**User Story:** As an authenticated user, I want to receive 3 free AI generation attempts that are tracked across sessions, so that I can try AI features without being charged immediately.

#### Acceptance Criteria

1. THE System SHALL persist AI generation attempt counts in a `user_ai_quota` Supabase table with columns: `user_id` (references `auth.users`), `attempts_used` (integer, default 0), `updated_at` (timestamp).
2. WHEN an Authenticated_User successfully completes any AI_Feature generation, THE System SHALL increment `attempts_used` by 1 in the `user_ai_quota` table for that user.
3. WHEN an Authenticated_User opens any AI_Feature UI, THE Customizer SHALL fetch the current `attempts_used` value for that user from the `user_ai_quota` table.
4. WHILE an Authenticated_User's `attempts_used` is less than the Free_Tier_Limit (3), THE Customizer SHALL allow AI generation to proceed normally.
5. WHEN an Authenticated_User's `attempts_used` reaches the Free_Tier_Limit (3), THE System SHALL display a quota-exhausted message within the relevant AI feature UI.
6. THE quota-exhausted message SHALL inform the user that their 3 free AI generations have been used and SHALL NOT hard-block the Customizer or prevent order submission.
7. THE AI_Quota SHALL be shared across all three AI_Features — a generation in any one feature increments the same counter.
8. IF a `user_ai_quota` row does not exist for an Authenticated_User, THEN THE System SHALL treat `attempts_used` as 0 and create the row on first successful generation.
9. THE System SHALL increment the quota counter only after a successful API response from `/api/ai/generate`, not on attempt initiation.

---

### Requirement 3: Quota API Endpoint

**User Story:** As the client application, I need a server-side API to read and increment the AI quota for the current user, so that quota state is authoritative and cannot be manipulated client-side.

#### Acceptance Criteria

1. THE System SHALL expose a `GET /api/ai/quota` endpoint that returns `{ attempts_used: number, limit: number }` for the currently authenticated user.
2. IF a request to `GET /api/ai/quota` is made without a valid session, THEN THE System SHALL return HTTP 401.
3. THE System SHALL expose a `POST /api/ai/quota/increment` endpoint that increments `attempts_used` by 1 for the currently authenticated user and returns the updated `{ attempts_used: number, limit: number }`.
4. IF a request to `POST /api/ai/quota/increment` is made without a valid session, THEN THE System SHALL return HTTP 401.
5. THE `user_ai_quota` table SHALL have a Row Level Security policy that allows users to read and update only their own row.

---

### Requirement 4: Cabinet — Order Files Display

**User Story:** As an authenticated user viewing my order history in `/cabinet`, I want to see the files I uploaded for each order, so that I can review what was submitted.

#### Acceptance Criteria

1. WHEN an Authenticated_User selects an Order_Entry in the cabinet, THE Cabinet SHALL display Order_Files associated with that order in the order detail view.
2. THE Cabinet SHALL source Order_Files from `order_items.custom_print_url` for each item in the selected order where `custom_print_url` is not null.
3. THE Cabinet SHALL also source Order_Files from `messages.attachments` arrays for messages where `sender = 'client'` and `lead_id` matches the selected order.
4. THE Cabinet SHALL deduplicate Order_Files so that the same URL is not shown more than once.
5. WHEN Order_Files are image URLs, THE Cabinet SHALL render them as thumbnail previews that open in the existing FileViewer on click.
6. WHEN Order_Files are non-image file URLs (e.g. PDF, SVG, AI), THE Cabinet SHALL render them as labelled file links that open in the existing FileViewer on click.
7. IF an Order_Entry has no Order_Files, THEN THE Cabinet SHALL display a "Файли відсутні" placeholder in the files section.
8. THE Cabinet SHALL display Order_Files in a dedicated "Файли" tab within the order detail panel, consistent with the existing tab structure (`details` | `chat` | `files`).

---

### Requirement 5: Cabinet — Invoice Download per Order

**User Story:** As an authenticated user, I want to download an invoice for a specific order directly from the order detail view, so that I can obtain billing documentation without contacting the manager.

#### Acceptance Criteria

1. WHEN an Authenticated_User selects an Order_Entry, THE Cabinet SHALL display a "Завантажити рахунок" (Download Invoice) button in the order detail view.
2. WHEN the Authenticated_User clicks the "Завантажити рахунок" button, THE Cabinet SHALL call `generateInvoicePDF` with the data from the selected order and trigger a PDF download.
3. THE Invoice SHALL include: order items (product name, color, size, quantity, unit price), customer contact data (name, email, phone, company), and order creation date.
4. WHEN `generateInvoicePDF` is in progress, THE "Завантажити рахунок" button SHALL display a loading indicator and be disabled to prevent duplicate downloads.
5. IF `total_amount_cents` is 0 or `order_items` is empty for an Order_Entry, THEN THE "Завантажити рахунок" button SHALL still be rendered but MAY produce an invoice with zero-value line items.
6. THE Invoice download button SHALL be scoped to the currently selected order — clicking it SHALL always generate the invoice for that specific order, not a previously selected one.

---

### Requirement 6: Cabinet — Chat with Manager Shortcut

**User Story:** As an authenticated user viewing my order history, I want a "Chat with manager" button on each order entry, so that I can quickly navigate to the conversation for that order without manually switching tabs.

#### Acceptance Criteria

1. WHEN an Authenticated_User views the order list in the cabinet, THE Cabinet SHALL display a "Написати менеджеру" (Chat with manager) button or icon on each Order_Entry in the list.
2. WHEN the Authenticated_User clicks the "Написати менеджеру" button for an Order_Entry, THE Cabinet SHALL select that order and navigate to the Chat_View (set `activeTab` to `"chat"`) in a single action.
3. WHEN the Authenticated_User is on mobile and clicks the "Написати менеджеру" button, THE Cabinet SHALL also switch `mobileView` to `"detail"` so the chat panel is visible.
4. WHEN the Chat_View is opened via the shortcut, THE Cabinet SHALL mark unread messages for that order as read (reset `unreadByLead` count to 0 for that lead).
5. IF an Order_Entry has unread messages, THE "Написати менеджеру" button SHALL display the unread count badge alongside it.
