-- Add published status to cms_content
alter table public.cms_content
  add column if not exists published boolean not null default false;
