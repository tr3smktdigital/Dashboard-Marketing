-- Multi-cliente MVP (Supabase)
-- Execute no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.user_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists user_clients_user_id_idx on public.user_clients(user_id);
create index if not exists user_clients_client_id_idx on public.user_clients(client_id);

alter table public.clients enable row level security;
alter table public.user_clients enable row level security;

-- PostgreSQL/Supabase não suporta `create policy if not exists`.
-- Então removemos e recriamos as policies de forma idempotente.
drop policy if exists "clients_select_by_membership" on public.clients;
create policy "clients_select_by_membership"
  on public.clients
  for select
  using (
    exists (
      select 1
      from public.user_clients uc
      where uc.client_id = clients.id
        and uc.user_id = auth.uid()
    )
  );

drop policy if exists "user_clients_select_own" on public.user_clients;
create policy "user_clients_select_own"
  on public.user_clients
  for select
  using (user_id = auth.uid());

drop policy if exists "user_clients_insert_own" on public.user_clients;
create policy "user_clients_insert_own"
  on public.user_clients
  for insert
  with check (user_id = auth.uid());

-- Seed MVP: cria cliente e vincula usuário por e-mail.
-- Troque o e-mail abaixo para o usuário real autenticado.
with inserted_client as (
  insert into public.clients (name, slug)
  values ('Cliente Demo TR3S', 'cliente-demo-tr3s')
  on conflict (slug) do update
    set name = excluded.name
  returning id
)
insert into public.user_clients (user_id, client_id)
select u.id, c.id
from auth.users u
cross join inserted_client c
where lower(u.email) = lower('SEU_EMAIL_AQUI')
on conflict (user_id, client_id) do nothing;
