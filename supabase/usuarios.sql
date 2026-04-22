create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  usuario text not null unique,
  nombre text not null,
  rut text not null,
  cargo text,
  contrasena text,
  accesos jsonb not null default '[]'::jsonb,
  permisos_empresas jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usuarios_usuario_idx on public.usuarios (usuario);

alter table public.usuarios enable row level security;

drop policy if exists "usuarios_select_anon" on public.usuarios;
drop policy if exists "usuarios_insert_anon" on public.usuarios;
drop policy if exists "usuarios_update_anon" on public.usuarios;
drop policy if exists "usuarios_delete_anon" on public.usuarios;

create policy "usuarios_select_anon"
on public.usuarios for select
to anon
using (true);

create policy "usuarios_insert_anon"
on public.usuarios for insert
to anon
with check (true);

create policy "usuarios_update_anon"
on public.usuarios for update
to anon
using (true)
with check (true);

create policy "usuarios_delete_anon"
on public.usuarios for delete
to anon
using (true);
