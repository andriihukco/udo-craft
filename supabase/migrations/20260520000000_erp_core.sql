-- ERP core for catalog costing, stock, and production planning.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'erp_material_kind') then
    create type erp_material_kind as enum (
      'garment',
      'fabric',
      'print_supply',
      'hardware',
      'thread',
      'packaging',
      'service',
      'labor',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'erp_stock_movement_type') then
    create type erp_stock_movement_type as enum (
      'receipt',
      'reservation',
      'production_consume',
      'production_output',
      'adjustment',
      'write_off'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'erp_production_status') then
    create type erp_production_status as enum (
      'draft',
      'planned',
      'reserved',
      'in_progress',
      'done',
      'cancelled'
    );
  end if;
end $$;

create table if not exists erp_materials (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sku text,
  kind erp_material_kind not null default 'other',
  unit text not null default 'шт.',
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  stock_quantity numeric(14,3) not null default 0,
  reserved_quantity numeric(14,3) not null default 0,
  reorder_point numeric(14,3) not null default 0,
  supplier text,
  notes text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sku)
);

create index if not exists idx_erp_materials_kind on erp_materials(kind);
create index if not exists idx_erp_materials_active on erp_materials(is_active);

create table if not exists product_recipe_lines (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  erp_material_id uuid not null references erp_materials(id) on delete restrict,
  role text not null default 'material',
  quantity numeric(14,4) not null check (quantity > 0),
  waste_percent numeric(6,2) not null default 0 check (waste_percent >= 0),
  production_step text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_recipe_lines_product on product_recipe_lines(product_id, sort_order);
create index if not exists idx_product_recipe_lines_material on product_recipe_lines(erp_material_id);

create table if not exists erp_production_orders (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete set null,
  order_item_id uuid references order_items(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  document_no text,
  status erp_production_status not null default 'draft',
  quantity integer not null default 1 check (quantity > 0),
  planned_start_at timestamptz,
  planned_finish_at timestamptz,
  actual_finish_at timestamptz,
  estimated_cost_cents integer not null default 0,
  actual_cost_cents integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_erp_production_orders_status on erp_production_orders(status);
create index if not exists idx_erp_production_orders_product on erp_production_orders(product_id);

create table if not exists erp_stock_movements (
  id uuid primary key default uuid_generate_v4(),
  erp_material_id uuid not null references erp_materials(id) on delete restrict,
  production_order_id uuid references erp_production_orders(id) on delete set null,
  movement_type erp_stock_movement_type not null,
  quantity numeric(14,3) not null,
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_erp_stock_movements_material on erp_stock_movements(erp_material_id, created_at desc);

alter table erp_materials enable row level security;
alter table product_recipe_lines enable row level security;
alter table erp_production_orders enable row level security;
alter table erp_stock_movements enable row level security;

do $$
begin
  drop policy if exists "ERP materials admin all" on erp_materials;
  drop policy if exists "Product recipes admin all" on product_recipe_lines;
  drop policy if exists "ERP production admin all" on erp_production_orders;
  drop policy if exists "ERP stock movements admin all" on erp_stock_movements;

  create policy "ERP materials admin all" on erp_materials for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  create policy "Product recipes admin all" on product_recipe_lines for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  create policy "ERP production admin all" on erp_production_orders for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  create policy "ERP stock movements admin all" on erp_stock_movements for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
end $$;

do $$
begin
  drop trigger if exists update_erp_materials_updated_at on erp_materials;
  create trigger update_erp_materials_updated_at before update on erp_materials
    for each row execute function update_updated_at_column();

  drop trigger if exists update_product_recipe_lines_updated_at on product_recipe_lines;
  create trigger update_product_recipe_lines_updated_at before update on product_recipe_lines
    for each row execute function update_updated_at_column();

  drop trigger if exists update_erp_production_orders_updated_at on erp_production_orders;
  create trigger update_erp_production_orders_updated_at before update on erp_production_orders
    for each row execute function update_updated_at_column();
end $$;
