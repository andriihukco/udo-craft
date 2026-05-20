-- Editable warehouse types. Replaces fixed UI-only material kind choices.

create table if not exists erp_material_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  kind erp_material_kind not null default 'other',
  unit text not null default 'шт.',
  color text not null default '#64748b',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table erp_materials
  add column if not exists type_id uuid references erp_material_types(id) on delete set null;

create index if not exists idx_erp_materials_type on erp_materials(type_id);
create index if not exists idx_erp_material_types_sort on erp_material_types(sort_order, name);

alter table erp_material_types enable row level security;

do $$
begin
  drop policy if exists "ERP material types admin all" on erp_material_types;
  create policy "ERP material types admin all" on erp_material_types for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
end $$;

do $$
begin
  drop trigger if exists update_erp_material_types_updated_at on erp_material_types;
  create trigger update_erp_material_types_updated_at before update on erp_material_types
    for each row execute function update_updated_at_column();
end $$;

insert into erp_material_types (name, kind, unit, color, sort_order)
values
  ('Тканина', 'fabric', 'м', '#16a34a', 10),
  ('Готова основа', 'garment', 'шт.', '#2563eb', 20),
  ('Матеріали друку', 'print_supply', 'шт.', '#7c3aed', 30),
  ('Фурнітура', 'hardware', 'шт.', '#f59e0b', 40),
  ('Нитки', 'thread', 'м', '#db2777', 50),
  ('Пакування', 'packaging', 'шт.', '#0891b2', 60),
  ('Послуга', 'service', 'посл.', '#64748b', 70),
  ('Робота', 'labor', 'год.', '#dc2626', 80),
  ('Інше', 'other', 'шт.', '#71717a', 90)
on conflict (name) do update set
  kind = excluded.kind,
  unit = excluded.unit,
  color = excluded.color,
  sort_order = excluded.sort_order,
  updated_at = now();

update erp_materials m
set type_id = t.id
from erp_material_types t
where m.type_id is null
  and m.kind = t.kind;

