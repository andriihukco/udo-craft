Implements Resend inbound email receiving.

- `POST /api/email/inbound` webhook in admin app
- Routes by lead ID in To address (`lead-<id>@poudtio.resend.app`) or falls back to sender email lookup
- Creates a new lead if no match found
- Inserts message into `messages` table with `channel: "email"` — shows up in admin chat instantly via Supabase Realtime
- All outgoing emails now use `Reply-To: lead-<id>@poudtio.resend.app` so customer replies route back to the correct thread
- Optional `RESEND_WEBHOOK_SECRET` env var for signature verification
