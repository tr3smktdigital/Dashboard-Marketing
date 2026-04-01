-- Base do ETL (worker externo + estado de sincronizacao)
-- Execute no SQL Editor do Supabase apos 002_client_metrics_daily.sql.

create table if not exists public.etl_sync_cursors (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source text not null,
  cursor text,
  updated_at timestamptz not null default now(),
  unique (client_id, source)
);

create index if not exists etl_sync_cursors_client_source_idx
  on public.etl_sync_cursors (client_id, source);

create table if not exists public.etl_sync_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source text not null,
  status text not null check (status in ('success', 'error')),
  started_at timestamptz not null,
  finished_at timestamptz,
  metrics_written integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists etl_sync_runs_client_created_idx
  on public.etl_sync_runs (client_id, created_at desc);

alter table public.etl_sync_cursors enable row level security;
alter table public.etl_sync_runs enable row level security;

-- Leitura restrita aos tenants vinculados ao usuario autenticado.
drop policy if exists "etl_sync_cursors_select_own_clients" on public.etl_sync_cursors;
create policy "etl_sync_cursors_select_own_clients"
  on public.etl_sync_cursors
  for select
  using (
    exists (
      select 1
      from public.client_memberships cm
      where cm.client_id = etl_sync_cursors.client_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );

drop policy if exists "etl_sync_runs_select_own_clients" on public.etl_sync_runs;
create policy "etl_sync_runs_select_own_clients"
  on public.etl_sync_runs
  for select
  using (
    exists (
      select 1
      from public.client_memberships cm
      where cm.client_id = etl_sync_runs.client_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );
