-- Migration: Add source tracking for Telegram (and future Instagram) integration
-- Run this against your Supabase database

-- 1. Add source column to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tg_chat_id TEXT;

-- Unique index so one Telegram chat = one lead
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_tg_chat_id ON leads(tg_chat_id) WHERE tg_chat_id IS NOT NULL;

-- 2. Add channel column to messages (which channel the message came through)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web';

-- 3. Add attachments column to messages if not already present
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

-- 4. Add read_at column to messages if not already present
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
