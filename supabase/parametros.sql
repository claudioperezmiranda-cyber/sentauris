create table if not exists public.parametros (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.parametros enable row level security;

drop policy if exists "parametros_select_anon" on public.parametros;
drop policy if exists "parametros_insert_anon" on public.parametros;
drop policy if exists "parametros_update_anon" on public.parametros;
drop policy if exists "parametros_delete_anon" on public.parametros;

create policy "parametros_select_anon"
on public.parametros for select
to anon
using (true);

create policy "parametros_insert_anon"
on public.parametros for insert
to anon
with check (true);

create policy "parametros_update_anon"
on public.parametros for update
to anon
using (true)
with check (true);

create policy "parametros_delete_anon"
on public.parametros for delete
to anon
using (true);
