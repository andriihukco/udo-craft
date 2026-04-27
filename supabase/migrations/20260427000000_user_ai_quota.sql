-- ============================================================
-- AI Quota Migration
-- U:DO Craft — per-user AI generation quota tracking
--
-- Apply with:  supabase db push  (or  supabase migration up)
-- Idempotent:  safe to run multiple times
-- ============================================================

-- ─────────────────────────────────────────────
-- USER AI QUOTA
-- One row per authenticated user; tracks free-tier AI generation usage.
-- ─────────────────────────────────────────────
create table if not exists public.user_ai_quota (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  attempts_used integer     not null default 0,
  updated_at    timestamptz not null default now()
);

alter table public.user_ai_quota enable row level security;

-- Users can read their own quota row
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_ai_quota' AND policyname = 'quota_select_own') THEN
    CREATE POLICY "quota_select_own"
      ON public.user_ai_quota FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Users can insert their own quota row (created on first generation via upsert)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_ai_quota' AND policyname = 'quota_insert_own') THEN
    CREATE POLICY "quota_insert_own"
      ON public.user_ai_quota FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Users can update their own quota row
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_ai_quota' AND policyname = 'quota_update_own') THEN
    CREATE POLICY "quota_update_own"
      ON public.user_ai_quota FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- increment_ai_quota RPC
-- Atomically upserts the quota row and returns the new attempts_used value.
-- Called by POST /api/ai/quota/increment via the service-role client.
-- ─────────────────────────────────────────────
create or replace function public.increment_ai_quota(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_attempts_used integer;
begin
  insert into public.user_ai_quota (user_id, attempts_used, updated_at)
  values (p_user_id, 1, now())
  on conflict (user_id) do update
    set attempts_used = user_ai_quota.attempts_used + 1,
        updated_at    = now()
  returning attempts_used into v_attempts_used;

  return v_attempts_used;
end;
$$;
