alter table if exists public.repuestos
  add column if not exists item_type text not null default 'replacement',
  add column if not exists equipment_category text,
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists tender_reference text,
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'repuestos_item_type_check'
  ) then
    alter table public.repuestos
      add constraint repuestos_item_type_check
      check (item_type in ('replacement', 'repair_service'));
  end if;
end $$;

create or replace view public.catalog_items as
select
  r.id,
  coalesce(nullif(r.sku, ''), nullif(r.part_number, ''), 'SIN-CODIGO') as code,
  r.name,
  r.item_type,
  r.equipment_category,
  r.brand,
  r.model,
  r.tender_reference,
  r.active,
  r.created_at,
  r.updated_at
from public.repuestos r;

create table if not exists public.technical_findings (
  id uuid primary key default gen_random_uuid(),
  work_order_id text not null,
  equipment_id text null,
  raw_findings_text text not null,
  created_by text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.selected_catalog_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id text not null,
  catalog_item_id text null,
  quantity integer not null default 1 check (quantity > 0),
  optional_note text null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generated_diagnostics (
  id uuid primary key default gen_random_uuid(),
  work_order_id text not null unique,
  diagnosis_text text not null,
  conclusion_text text not null,
  full_report_text text not null,
  input_snapshot_json jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default timezone('utc', now()),
  generated_by_model text not null default 'local-template-engine-v1',
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_technical_findings_work_order_id
  on public.technical_findings (work_order_id);

create index if not exists idx_selected_catalog_items_work_order_id
  on public.selected_catalog_items (work_order_id);

create index if not exists idx_generated_diagnostics_work_order_id
  on public.generated_diagnostics (work_order_id);
