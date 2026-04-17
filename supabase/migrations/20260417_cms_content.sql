-- CMS content table for dynamic page content management
create table if not exists public.cms_content (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null default '',
  body         jsonb not null default '{}',
  meta         jsonb default '{}',
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Index for fast slug lookups
create index if not exists cms_content_slug_idx on public.cms_content (slug);

-- RLS: public read, authenticated write
alter table public.cms_content enable row level security;

create policy "Public can read cms_content"
  on public.cms_content for select
  using (true);

create policy "Authenticated users can upsert cms_content"
  on public.cms_content for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update cms_content"
  on public.cms_content for update
  to authenticated
  using (true);

-- Seed default slugs so editors see them immediately
insert into public.cms_content (slug, title, body) values
  ('home_hero',     'Головна — Hero',        '{}'),
  ('home_about',    'Головна — Про нас',     '{}'),
  ('home_services', 'Головна — Послуги',     '{}'),
  ('home_contact',  'Головна — Контакти',    '{}'),
  ('seo_home',      'SEO — Головна',         '{}'),
  ('page_terms',    'Умови та правила',       '{"title":"Умови та правила","content":""}'),
  ('page_privacy',  'Політика конфіденційності', '{"title":"Політика конфіденційності","content":""}')
on conflict (slug) do nothing;
