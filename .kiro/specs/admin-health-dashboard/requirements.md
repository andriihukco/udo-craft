# Requirements Document

## Introduction

The System Health & Status Dashboard is a new tab inside the admin app's Settings page (`/settings`). It gives the admin a single place to verify that all critical services are operational, environment variables are configured, and the latest deployment is known. The dashboard performs live health checks for both the admin app and the client app. Admin checks cover Supabase (DB, Auth, Storage, Realtime), external services (Sentry, Microsoft Clarity, Telegram bot webhook), admin environment variables, and admin deployment metadata. Client checks are delegated to a new public `GET /api/health` endpoint on the client app, which reports client Sentry, client Clarity, client environment variables, and client deployment metadata. Results are grouped by app — "Admin" and "Client" — each with their own sub-sections.

## Glossary

- **Health_Dashboard**: The new "Система" tab rendered inside the existing Settings page at `/settings`.
- **Admin_Health_API**: The Next.js API route `GET /api/health` in the admin app that performs all admin-side service checks server-side, calls the Client_Health_API, and returns a structured result.
- **Client_Health_API**: The Next.js API route `GET /api/health` in the client app that performs all client-side service checks server-side and returns a structured result. This endpoint is public (no authentication required).
- **Health_Check**: A single probe that tests one service or subsystem and returns a status of `ok`, `degraded`, or `error`, plus an optional latency value in milliseconds.
- **Supabase_DB**: The Supabase Postgres database accessed via the service-role client.
- **Supabase_Auth**: The Supabase Auth service, verified by retrieving the current session.
- **Supabase_Storage**: The Supabase Storage service, verified by listing buckets.
- **Supabase_Realtime**: The Supabase Realtime service, verified by opening and closing a channel connection.
- **Telegram_Webhook**: The registered Telegram bot webhook, verified by calling the Telegram Bot API `getWebhookInfo` endpoint.
- **Admin_Env_Inspector**: The server-side component that reads `process.env` in the admin app and reports which required and optional admin variables are set or missing.
- **Client_Env_Inspector**: The server-side component that reads `process.env` in the client app and reports which required and optional client variables are set or missing.
- **Deployment_Info**: Metadata about the last Vercel deployment, sourced from Vercel environment variables (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_MESSAGE`, `VERCEL_ENV`, `VERCEL_URL`).
- **Status_Badge**: A small visual indicator (green/yellow/red) representing `ok`, `degraded`, or `error` state.

---

## Requirements

### Requirement 1: Health Dashboard Tab

**User Story:** As an admin, I want a dedicated "Система" tab in Settings, so that I can access all health information without navigating away from the Settings page.

#### Acceptance Criteria

1. THE Health_Dashboard SHALL render as a new tab labelled "Система" inside the existing Settings page tab bar, alongside the existing "Профіль", "Безпека", and "Сповіщення" tabs.
2. WHEN the "Система" tab is selected, THE Health_Dashboard SHALL display all health check sections within the scrollable content area, consistent with the layout of existing Settings tabs.
3. THE Health_Dashboard SHALL use only Shadcn UI components and Tailwind CSS classes already present in the admin app.

---

### Requirement 2: Server-Side Admin Health API

**User Story:** As an admin, I want health checks to run server-side, so that sensitive credentials are never exposed to the browser.

#### Acceptance Criteria

1. THE Admin_Health_API SHALL expose a `GET /api/health` endpoint in the admin app that requires an authenticated admin session; unauthenticated requests SHALL receive a `401` response.
2. WHEN the Admin_Health_API endpoint is called, THE Admin_Health_API SHALL execute all admin service checks concurrently and call the Client_Health_API, then return a JSON response within 10 seconds.
3. THE Admin_Health_API SHALL return a JSON object containing an `admin` section and a `client` section, each with a `checks` array where every entry includes: `service` (string), `status` (`"ok" | "degraded" | "error"`), `latency_ms` (number or null), and `detail` (string or null).
4. IF a single service check throws an unhandled exception, THEN THE Admin_Health_API SHALL record that check as `"error"` with the exception message in `detail` and continue executing the remaining checks.
5. THE Admin_Health_API SHALL include a top-level `checked_at` ISO timestamp in the response.

---

### Requirement 2b: Client Health API

**User Story:** As an admin, I want the client app to expose its own health endpoint, so that the admin dashboard can verify client-side services without duplicating credentials.

#### Acceptance Criteria

1. THE Client_Health_API SHALL expose a `GET /api/health` endpoint in the client app that requires no authentication, since it returns only presence indicators and no sensitive values.
2. WHEN the Client_Health_API endpoint is called, THE Client_Health_API SHALL execute all client service checks concurrently and return a JSON response within 10 seconds.
3. THE Client_Health_API SHALL return a JSON object containing a `checks` array, an `env` map, and a `deployment` object, using the same field shapes as the admin checks.
4. IF a single client service check throws an unhandled exception, THEN THE Client_Health_API SHALL record that check as `"error"` with the exception message in `detail` and continue executing the remaining checks.
5. THE Client_Health_API SHALL include a top-level `checked_at` ISO timestamp in the response.

---

### Requirement 2c: Client App Reachability

**User Story:** As an admin, I want to know immediately if the client app is unreachable, so that I can act on a full outage without seeing partial results.

#### Acceptance Criteria

1. WHEN the Admin_Health_API calls the Client_Health_API and the request fails or times out, THE Admin_Health_API SHALL set the entire `client` section status to `"error"` with detail `"Client app unreachable"` and populate the `client.checks` array with a single entry reflecting this error.
2. THE Admin_Health_API SHALL use the `NEXT_PUBLIC_CLIENT_URL` environment variable as the base URL when calling the Client_Health_API.
3. IF `NEXT_PUBLIC_CLIENT_URL` is not set, THEN THE Admin_Health_API SHALL mark the entire `client` section as `"error"` with detail `"NEXT_PUBLIC_CLIENT_URL not configured"`.

---

### Requirement 3: Supabase Service Checks

**User Story:** As an admin, I want to see the live status of all four Supabase services, so that I can immediately identify connectivity or configuration problems.

#### Acceptance Criteria

1. WHEN the Admin_Health_API executes the Supabase_DB check, THE Admin_Health_API SHALL run a lightweight query (`SELECT 1`) against the Postgres database using the service-role client and record the round-trip latency in milliseconds.
2. WHEN the Admin_Health_API executes the Supabase_Auth check, THE Admin_Health_API SHALL call `supabase.auth.getUser()` with the service-role client and verify a non-error response.
3. WHEN the Admin_Health_API executes the Supabase_Storage check, THE Admin_Health_API SHALL call `supabase.storage.listBuckets()` and verify a non-error response.
4. WHEN the Admin_Health_API executes the Supabase_Realtime check, THE Admin_Health_API SHALL attempt to connect to a Realtime channel, verify the connection succeeds within 5 seconds, then disconnect.
5. IF `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are not set, THEN THE Admin_Health_API SHALL mark all four Supabase checks as `"error"` with the detail `"Missing Supabase credentials"`.

---

### Requirement 4: Admin External Service Status Checks

**User Story:** As an admin, I want to see whether admin Sentry, Microsoft Clarity, and the Telegram bot webhook are configured and reachable, so that I know monitoring and notifications are working for the admin app.

#### Acceptance Criteria

1. WHEN the Admin_Health_API executes the Sentry check, THE Admin_Health_API SHALL verify that `NEXT_PUBLIC_SENTRY_DSN` is set in the admin app and is a valid URL; IF the variable is absent or malformed, THEN THE Admin_Health_API SHALL return status `"error"` with detail `"DSN not configured"`.
2. WHEN the Admin_Health_API executes the Microsoft Clarity check, THE Admin_Health_API SHALL verify that the admin Clarity script ID is present in the admin app configuration; THE Admin_Health_API SHALL return `"ok"` if the ID is present and `"degraded"` with detail `"Clarity ID not found in config"` otherwise.
3. WHEN the Admin_Health_API executes the Telegram_Webhook check, THE Admin_Health_API SHALL call the Telegram Bot API `getWebhookInfo` endpoint using `TELEGRAM_BOT_TOKEN`; IF the response contains a non-empty `url` field, THEN THE Admin_Health_API SHALL return `"ok"` with the registered webhook URL in `detail`.
4. IF `TELEGRAM_BOT_TOKEN` is not set, THEN THE Admin_Health_API SHALL mark the Telegram_Webhook check as `"error"` with detail `"Bot token not configured"`.
5. IF the Telegram Bot API returns an error response, THEN THE Admin_Health_API SHALL mark the Telegram_Webhook check as `"degraded"` with the Telegram error description in `detail`.

---

### Requirement 5: Admin Environment Variable Inspector

**User Story:** As an admin, I want to see which admin environment variables are set and which are missing, so that I can quickly diagnose misconfiguration in the admin app.

#### Acceptance Criteria

1. THE Admin_Env_Inspector SHALL display a list of all required and optional environment variables defined for the admin app: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLIENT_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `NEXT_PUBLIC_SENTRY_DSN`.
2. FOR EACH environment variable, THE Admin_Env_Inspector SHALL indicate whether the variable is set (Status_Badge `"ok"`) or missing (Status_Badge `"error"`).
3. THE Admin_Env_Inspector SHALL display only a presence indicator — it SHALL NOT display the actual value of any environment variable.
4. THE Admin_Health_API SHALL resolve environment variable presence server-side and include an `env` map in the admin section of the response, where each key is a variable name and each value is `true` (set) or `false` (missing).

---

### Requirement 5b: Client Environment Variable Inspector

**User Story:** As an admin, I want to see which client environment variables are set and which are missing, so that I can quickly diagnose misconfiguration in the client app.

#### Acceptance Criteria

1. THE Client_Env_Inspector SHALL report the following required and optional environment variables defined for the client app: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SENTRY_DSN`.
2. FOR EACH client environment variable, THE Client_Env_Inspector SHALL indicate whether the variable is set (`true`) or missing (`false`).
3. THE Client_Env_Inspector SHALL display only a presence indicator — it SHALL NOT include the actual value of any environment variable in the Client_Health_API response.
4. THE Client_Health_API SHALL resolve environment variable presence server-side and include an `env` map in the response, where each key is a variable name and each value is `true` (set) or `false` (missing).

---

### Requirement 5c: Client External Service Status Checks

**User Story:** As an admin, I want to see whether client Sentry and Microsoft Clarity are configured in the client app, so that I know monitoring is working for customers.

#### Acceptance Criteria

1. WHEN the Client_Health_API executes the Sentry check, THE Client_Health_API SHALL verify that `NEXT_PUBLIC_SENTRY_DSN` is set in the client app and is a valid URL; IF the variable is absent or malformed, THEN THE Client_Health_API SHALL return status `"error"` with detail `"DSN not configured"`.
2. WHEN the Client_Health_API executes the Microsoft Clarity check, THE Client_Health_API SHALL verify that the client Clarity script ID is present in the client app configuration; THE Client_Health_API SHALL return `"ok"` if the ID is present and `"degraded"` with detail `"Clarity ID not found in config"` otherwise.

---

### Requirement 6: Deployment Information

**User Story:** As an admin, I want to see the last deployment details for both apps, so that I know which version of each app is running.

#### Acceptance Criteria

1. THE Admin_Health_API SHALL read the following Vercel-injected environment variables from the admin app and include them in an `admin.deployment` object in the response: `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_GIT_COMMIT_SHA` (truncated to 7 characters for display), `VERCEL_GIT_COMMIT_MESSAGE`.
2. THE Client_Health_API SHALL read the same Vercel-injected environment variables from the client app and include them in a `deployment` object in the Client_Health_API response.
3. WHEN `VERCEL_ENV` is not set in either app, THE Health_Dashboard SHALL display the environment for that app as `"local"`.
4. THE Health_Dashboard SHALL display the deployment environment, short commit SHA, commit message, and deployment URL for each app in a readable card layout within the respective "Admin" or "Client" section.
5. IF `VERCEL_GIT_COMMIT_SHA` is not set for an app, THEN THE Health_Dashboard SHALL display `"—"` in place of the commit SHA for that app.

---

### Requirement 7: Health Dashboard UI

**User Story:** As an admin, I want the health dashboard to be clear and easy to scan, so that I can assess system status at a glance.

#### Acceptance Criteria

1. THE Health_Dashboard SHALL display a Status_Badge for each check using green for `"ok"`, yellow for `"degraded"`, and red for `"error"`.
2. THE Health_Dashboard SHALL display latency in milliseconds next to each Supabase check where latency data is available.
3. WHEN the Health_Dashboard is first rendered, THE Health_Dashboard SHALL automatically trigger a fetch to the Admin_Health_API and display a loading skeleton until the response is received.
4. THE Health_Dashboard SHALL provide a "Оновити" (Refresh) button that re-fetches the Admin_Health_API and updates all displayed statuses.
5. THE Health_Dashboard SHALL display the `checked_at` timestamp from the last successful Admin_Health_API response, formatted as a human-readable local date and time.
6. THE Health_Dashboard SHALL group results into two top-level sections: "Admin" and "Client". The "Admin" section SHALL contain sub-sections "Supabase", "Зовнішні сервіси" (External Services), "Змінні середовища" (Environment Variables), and "Деплой" (Deployment). The "Client" section SHALL contain sub-sections "Зовнішні сервіси" (External Services), "Змінні середовища" (Environment Variables), and "Деплой" (Deployment).
7. IF the Admin_Health_API returns a non-2xx response, THEN THE Health_Dashboard SHALL display an error message and enable the "Оновити" button so the admin can retry.
8. WHEN the client section status is `"error"` with detail `"Client app unreachable"`, THE Health_Dashboard SHALL display the entire "Client" section with a single red error card showing the detail message, instead of individual sub-section results.
