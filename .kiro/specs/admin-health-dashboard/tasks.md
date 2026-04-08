# Implementation Plan: Admin Health Dashboard

## Overview

Add a "Система" tab to the admin Settings page that shows live health checks for both the admin and client apps. Implementation proceeds in four phases: shared types and pure utilities → Client Health API → Admin Health API → Settings UI integration.

## Tasks

- [x] 1. Create shared health check types and pure utility functions
  - Create `apps/admin/src/app/api/health/types.ts` with `CheckStatus`, `HealthCheck`, `DeploymentInfo`, `AdminHealthResponse`, `ClientHealthResponse` interfaces
  - Implement `runCheck(service, fn)` helper that wraps any check function and catches exceptions into `{ status: "error", ... }`
  - Implement `checkSentryDsn(dsn)` — returns `"ok"` for valid URL, `"error"` otherwise
  - Implement `checkClarityId(id)` — returns `"ok"` if non-empty string, `"degraded"` otherwise
  - Implement `buildDeploymentInfo()` — reads `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_GIT_COMMIT_SHA` (first 7 chars), `VERCEL_GIT_COMMIT_MESSAGE`; defaults `env` to `"local"` when unset
  - _Requirements: 2.3, 2.5, 4.1, 4.2, 6.1_

  - [ ]* 1.1 Write property test for `checkSentryDsn` (Property 5)
    - **Property 5: Sentry DSN validation is a total function over all strings**
    - Generate arbitrary strings (empty, whitespace, random chars, valid URLs) using fast-check
    - Assert `checkSentryDsn` returns `"ok"` iff `new URL(input)` succeeds, `"error"` otherwise
    - **Validates: Requirements 4.1, 5c.1**

  - [ ]* 1.2 Write property test for `runCheck` fault isolation (Property 2)
    - **Property 2: Fault isolation — any failing check does not affect others**
    - Generate a random subset of check functions that throw; run all via `runCheck`
    - Assert throwing checks → `status: "error"`, non-throwing checks → their correct status
    - **Validates: Requirements 2.4, 2b.4**

- [x] 2. Implement Client Health API
  - Create `apps/client/src/app/api/health/route.ts`
  - Define `CLIENT_ENV_VARS` constant (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`)
  - Define `CLIENT_CLARITY_ID = "w7kk9avzfh"` constant
  - Run all client checks concurrently with `Promise.allSettled`: Sentry DSN, Clarity ID
  - Build `env` map: each key → `true` if `process.env[key]` is non-empty, `false` otherwise
  - Build `deployment` object via `buildDeploymentInfo()`
  - Return `{ checked_at, checks, env, deployment }` — no auth required
  - _Requirements: 2b.1, 2b.2, 2b.3, 2b.4, 2b.5, 5b.1, 5b.2, 5b.3, 5b.4, 5c.1, 5c.2, 6.2_

  - [ ]* 2.1 Write property test for env map completeness — client (Property 4)
    - **Property 4: Env map completeness and boolean values**
    - Generate arbitrary subsets of set/unset env vars for the 5 client keys
    - Assert the returned `env` map always has exactly 5 keys and all values are booleans
    - **Validates: Requirements 5b.1, 5b.2, 5b.3**

- [x] 3. Implement Admin Health API
  - Create `apps/admin/src/app/api/health/route.ts`
  - Define `ADMIN_ENV_VARS` constant (8 keys per design)
  - Define `ADMIN_CLARITY_ID = "w6t8md9b3l"` constant
  - Verify auth via `createClient()` from `@/lib/supabase/server`; return 401 if no session
  - Implement Supabase DB check: `from('leads').select('id').limit(1)` with `Date.now()` latency measurement
  - Implement Supabase Auth check: `supabase.auth.admin.listUsers({ perPage: 1 })`
  - Implement Supabase Storage check: `supabase.storage.listBuckets()`
  - Implement Supabase Realtime check: open channel, await `SUBSCRIBED` within 5s, then unsubscribe; return `"error"` with `"Connection timeout"` on timeout
  - If `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing, mark all 4 Supabase checks as `"error"` with `"Missing Supabase credentials"`
  - Implement Telegram check: call `getWebhookInfo`; non-empty `url` → `"ok"`; empty `url` → `"degraded"`; API error → `"degraded"`; missing token → `"error"`
  - Implement Sentry and Clarity checks using the shared utilities from task 1
  - Build `env` map for admin (8 keys)
  - Fetch Client Health API using `NEXT_PUBLIC_CLIENT_URL + "/api/health"` with 9s timeout; on failure set `client` section to `{ status: "error", detail: "...", checks: [single error entry] }`
  - If `NEXT_PUBLIC_CLIENT_URL` not set, set client section to `"error"` with `"NEXT_PUBLIC_CLIENT_URL not configured"`
  - Run all admin checks and client fetch concurrently with `Promise.allSettled`
  - Return `{ checked_at, admin: { checks, env, deployment }, client: { checks, env, deployment } }`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2c.1, 2c.2, 2c.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1_

  - [ ]* 3.1 Write property test for response shape invariant (Property 1)
    - **Property 1: Response shape invariant**
    - Generate arbitrary combinations of check outcomes (ok/degraded/error, with/without latency_ms)
    - Assert response always has `admin.checks[]` and `client.checks[]` with correct field shapes
    - **Validates: Requirements 2.3, 2b.3**

  - [ ]* 3.2 Write property test for client unreachability (Property 3)
    - **Property 3: Client unreachability propagates to entire client section**
    - Generate various failure modes (thrown errors, non-2xx status codes)
    - Assert `client` section always has `status: "error"` with exactly one entry in `checks`
    - **Validates: Requirements 2c.1**

  - [ ]* 3.3 Write property test for admin env map completeness (Property 4)
    - **Property 4: Env map completeness and boolean values — admin**
    - Generate arbitrary subsets of set/unset env vars for the 8 admin keys
    - Assert the returned `env` map always has exactly 8 keys and all values are booleans
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Health Dashboard UI
  - In `apps/admin/src/app/(dashboard)/settings/page.tsx`, add `{ key: "system", icon: Activity, label: "Система" }` to the `TABS` array (import `Activity` from `lucide-react`)
  - Create `SystemTab` as a client sub-component in the same file (or a co-located `_components/SystemTab.tsx`)
  - On mount, fetch `GET /api/health` and store result in state; set loading state during fetch
  - Render `<Skeleton>` cards while loading (matching the card layout of other tabs)
  - Implement `StatusBadge` component: green dot/badge for `"ok"`, yellow for `"degraded"`, red for `"error"` using Tailwind classes
  - Render "Admin" section with sub-sections: "Supabase" (4 checks with latency), "Зовнішні сервіси" (Sentry, Clarity, Telegram), "Змінні середовища" (env map grid), "Деплой" (deployment card)
  - Render "Client" section with sub-sections: "Зовнішні сервіси" (Sentry, Clarity), "Змінні середовища" (env map grid), "Деплой" (deployment card)
  - When `client` section has `status: "error"`, render a single red error card instead of sub-sections
  - Display `checked_at` formatted as human-readable local date/time (not raw ISO string)
  - Display `"—"` when `deployment.sha` is null; display `"local"` when `deployment.env` is `"local"`
  - Render "Оновити" button that re-triggers the fetch; keep it enabled even on error state
  - Display an error message when the API returns non-2xx
  - _Requirements: 1.1, 1.2, 1.3, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ]* 5.1 Write property test for StatusBadge color mapping (Property 6)
    - **Property 6: Status badge color mapping is total and correct**
    - Generate arbitrary `HealthCheck` objects with status `"ok"`, `"degraded"`, or `"error"`
    - Assert rendered `StatusBadge` applies green/yellow/red class respectively; no status left unmapped
    - **Validates: Requirements 7.1**

  - [ ]* 5.2 Write property test for latency display (Property 7)
    - **Property 7: Latency display for Supabase checks**
    - Generate Supabase check results with arbitrary `latency_ms` values (null and non-null numbers)
    - Assert latency text is present when `latency_ms` is non-null, absent when null
    - **Validates: Requirements 7.2**

  - [ ]* 5.3 Write property test for checked_at timestamp formatting (Property 8)
    - **Property 8: checked_at timestamp formatting**
    - Generate arbitrary valid ISO 8601 timestamp strings
    - Assert the formatted output is a non-empty string different from the raw ISO input
    - **Validates: Requirements 7.5**

- [ ] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Use fast-check for all property-based tests (compatible with the existing TypeScript stack)
- Types are defined locally in each app — not in `@udo-craft/shared` — since they are internal API contracts
- All sensitive checks run server-side; the browser only receives boolean presence indicators and status values
- The `runCheck` helper and pure utility functions (`checkSentryDsn`, `checkClarityId`, `buildDeploymentInfo`) should be extracted to a shared module within the admin app so they can be unit-tested independently
