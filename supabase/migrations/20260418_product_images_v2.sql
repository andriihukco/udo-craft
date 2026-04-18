-- Product Images V2
-- Adds product_images and variant_images JSONB arrays as the new single source of truth.
-- Each entry: { key, url, label, is_customizable, sort_order }
-- Old `images` column is kept for backward compatibility but no longer written to by admin.

alter table public.products
  add column if not exists product_images jsonb not null default '[]';

alter table public.product_color_variants
  add column if not exists variant_images jsonb not null default '[]';

-- Seed existing products.images → product_images (all marked is_customizable: true)
-- Uses a subquery to assign row numbers before aggregating (window fn can't nest in agg)
update public.products
set product_images = (
  select coalesce(jsonb_agg(entry order by entry->>'key'), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'key',             kv.key,
      'url',             kv.value,
      'label',           kv.key,
      'is_customizable', true,
      'sort_order',      row_number() over (order by kv.key) - 1
    ) as entry
    from jsonb_each_text(images) as kv
  ) sub
)
where images != '{}'::jsonb
  and product_images = '[]'::jsonb;

-- Seed existing product_color_variants.images → variant_images
update public.product_color_variants
set variant_images = (
  select coalesce(jsonb_agg(entry order by entry->>'key'), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'key',             kv.key,
      'url',             kv.value,
      'label',           kv.key,
      'is_customizable', true,
      'sort_order',      row_number() over (order by kv.key) - 1
    ) as entry
    from jsonb_each_text(images) as kv
  ) sub
)
where images != '{}'::jsonb
  and variant_images = '[]'::jsonb;
