create table if not exists public.app_data (
  key text primary key,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

drop policy if exists "app_data_select_anon" on public.app_data;
drop policy if exists "app_data_insert_anon" on public.app_data;
drop policy if exists "app_data_update_anon" on public.app_data;
drop policy if exists "app_data_delete_anon" on public.app_data;

create policy "app_data_select_anon"
on public.app_data for select
to anon
using (true);

create policy "app_data_insert_anon"
on public.app_data for insert
to anon
with check (true);

create policy "app_data_update_anon"
on public.app_data for update
to anon
using (true)
with check (true);

create policy "app_data_delete_anon"
on public.app_data for delete
to anon
using (true);
