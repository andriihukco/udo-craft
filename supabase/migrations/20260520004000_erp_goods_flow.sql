-- ERP goods movement: suppliers, receipts, variant SKUs, production docs,
-- processing acts, transfers, delivery/fiscal metadata.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'erp_document_status') then
    create type erp_document_status as enum ('draft', 'posted', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'erp_payment_status') then
    create type erp_payment_status as enum ('unpaid', 'partial', 'paid', 'refunded');
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_type where typname = 'erp_stock_movement_type') then
    alter type erp_stock_movement_type add value if not exists 'transfer_out';
    alter type erp_stock_movement_type add value if not exists 'transfer_in';
  end if;
end $$;

create table if not exists erp_suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  email text,
  tax_id text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists erp_warehouses (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  code text unique,
  address text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into erp_warehouses (name, code, sort_order)
values ('Основний склад', 'MAIN', 10), ('Виробництво', 'PROD', 20), ('Готова продукція', 'READY', 30)
on conflict (name) do nothing;

create table if not exists erp_goods_receipts (
  id uuid primary key default uuid_generate_v4(),
  document_no text not null default ('REC-' || to_char(now(), 'YYYYMMDD-HH24MISS')),
  supplier_id uuid references erp_suppliers(id) on delete set null,
  warehouse_id uuid references erp_warehouses(id) on delete set null,
  status erp_document_status not null default 'draft',
  comment text,
  total_cents integer not null default 0,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists erp_goods_receipt_lines (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid not null references erp_goods_receipts(id) on delete cascade,
  erp_material_id uuid not null references erp_materials(id) on delete restrict,
  unit text not null default 'шт.',
  quantity numeric(14,3) not null check (quantity > 0),
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  total_cents integer not null default 0,
  comment text,
  sort_order integer not null default 0
);

create table if not exists product_variant_skus (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  color_variant_id uuid references product_color_variants(id) on delete cascade,
  color_name text,
  size text not null,
  sku text not null unique,
  sewing_cost_cents integer not null default 0 check (sewing_cost_cents >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, color_variant_id, size)
);

create table if not exists product_variant_recipe_lines (
  id uuid primary key default uuid_generate_v4(),
  variant_sku_id uuid not null references product_variant_skus(id) on delete cascade,
  erp_material_id uuid not null references erp_materials(id) on delete restrict,
  role text not null default 'material',
  quantity numeric(14,4) not null check (quantity > 0),
  production_step text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists erp_production_order_lines (
  id uuid primary key default uuid_generate_v4(),
  production_order_id uuid not null references erp_production_orders(id) on delete cascade,
  variant_sku_id uuid references product_variant_skus(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  due_date date,
  comment text,
  material_requirements jsonb not null default '[]',
  sort_order integer not null default 0
);

create table if not exists erp_processing_acts (
  id uuid primary key default uuid_generate_v4(),
  document_no text not null default ('ACT-' || to_char(now(), 'YYYYMMDD-HH24MISS')),
  production_order_id uuid references erp_production_orders(id) on delete set null,
  warehouse_id uuid references erp_warehouses(id) on delete set null,
  status erp_document_status not null default 'draft',
  comment text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists erp_finished_goods (
  id uuid primary key default uuid_generate_v4(),
  variant_sku_id uuid not null references product_variant_skus(id) on delete cascade,
  warehouse_id uuid references erp_warehouses(id) on delete set null,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (variant_sku_id, warehouse_id)
);

create table if not exists erp_stock_transfers (
  id uuid primary key default uuid_generate_v4(),
  document_no text not null default ('TRN-' || to_char(now(), 'YYYYMMDD-HH24MISS')),
  from_warehouse_id uuid references erp_warehouses(id) on delete set null,
  to_warehouse_id uuid references erp_warehouses(id) on delete set null,
  status erp_document_status not null default 'draft',
  comment text,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists erp_stock_transfer_lines (
  id uuid primary key default uuid_generate_v4(),
  transfer_id uuid not null references erp_stock_transfers(id) on delete cascade,
  erp_material_id uuid not null references erp_materials(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null default 'шт.',
  comment text,
  sort_order integer not null default 0
);

alter table erp_stock_movements
  add column if not exists warehouse_id uuid references erp_warehouses(id) on delete set null,
  add column if not exists receipt_id uuid references erp_goods_receipts(id) on delete set null,
  add column if not exists transfer_id uuid references erp_stock_transfers(id) on delete set null,
  add column if not exists processing_act_id uuid references erp_processing_acts(id) on delete set null;

alter table leads
  add column if not exists payment_status erp_payment_status not null default 'unpaid',
  add column if not exists payment_amount_cents integer not null default 0,
  add column if not exists buyer_requisites jsonb not null default '{}',
  add column if not exists nova_poshta_data jsonb not null default '{}',
  add column if not exists fiscal_data jsonb not null default '{}';

create index if not exists idx_receipts_status on erp_goods_receipts(status, created_at desc);
create index if not exists idx_variant_skus_product on product_variant_skus(product_id, sort_order);
create index if not exists idx_variant_recipe_variant on product_variant_recipe_lines(variant_sku_id, sort_order);
create index if not exists idx_production_lines_order on erp_production_order_lines(production_order_id, sort_order);
create index if not exists idx_processing_acts_order on erp_processing_acts(production_order_id, created_at desc);
create index if not exists idx_finished_goods_variant on erp_finished_goods(variant_sku_id);
create index if not exists idx_transfers_status on erp_stock_transfers(status, created_at desc);

alter table erp_suppliers enable row level security;
alter table erp_warehouses enable row level security;
alter table erp_goods_receipts enable row level security;
alter table erp_goods_receipt_lines enable row level security;
alter table product_variant_skus enable row level security;
alter table product_variant_recipe_lines enable row level security;
alter table erp_production_order_lines enable row level security;
alter table erp_processing_acts enable row level security;
alter table erp_finished_goods enable row level security;
alter table erp_stock_transfers enable row level security;
alter table erp_stock_transfer_lines enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'erp_suppliers', 'erp_warehouses', 'erp_goods_receipts', 'erp_goods_receipt_lines',
    'product_variant_skus', 'product_variant_recipe_lines', 'erp_production_order_lines',
    'erp_processing_acts', 'erp_finished_goods', 'erp_stock_transfers', 'erp_stock_transfer_lines'
  ]
  loop
    execute format('drop policy if exists "%s admin all" on %I', tbl, tbl);
    execute format('create policy "%s admin all" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')', tbl, tbl);
  end loop;
end $$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'erp_suppliers', 'erp_warehouses', 'erp_goods_receipts', 'product_variant_skus',
    'product_variant_recipe_lines', 'erp_processing_acts', 'erp_stock_transfers'
  ]
  loop
    execute format('drop trigger if exists update_%s_updated_at on %I', tbl, tbl);
    execute format('create trigger update_%s_updated_at before update on %I for each row execute function update_updated_at_column()', tbl, tbl);
  end loop;
end $$;
