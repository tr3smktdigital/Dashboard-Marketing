-- Fase 2: consolidacao minima do schema ETL para idempotencia + incremental sync.
-- Objetivo: padronizar nomes client_source_* e reforcar indices essenciais.

-- 1) Consolidar nome da fila/runs.
do $$
begin
  if to_regclass('public.client_source_sync_runs') is null
     and to_regclass('public.etl_sync_runs') is not null then
    alter table public.etl_sync_runs rename to client_source_sync_runs;
  end if;
end
$$;

-- 2) Consolidar nome de cursores/checkpoints.
do $$
begin
  if to_regclass('public.client_source_sync_checkpoints') is null
     and to_regclass('public.etl_sync_cursors') is not null then
    alter table public.etl_sync_cursors rename to client_source_sync_checkpoints;
  end if;
end
$$;

-- 3) Tabela minima de conexoes por cliente/fonte.
create table if not exists public.client_source_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  source text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  external_account_id text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, source)
);

create index if not exists client_source_connections_client_status_idx
  on public.client_source_connections (client_id, status);

-- 4) Ajustes minimos para checkpoints incrementais.
alter table public.client_source_sync_checkpoints
  add column if not exists checkpoint_key text not null default 'default',
  add column if not exists checkpoint jsonb not null default '{}'::jsonb,
  add column if not exists last_run_id uuid references public.client_source_sync_runs(id) on delete set null,
  add column if not exists last_synced_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

-- Mantem compatibilidade com coluna legado "cursor".
update public.client_source_sync_checkpoints
set checkpoint = jsonb_build_object('cursor', cursor)
where cursor is not null
  and checkpoint = '{}'::jsonb;

alter table public.client_source_sync_checkpoints
  drop constraint if exists etl_sync_cursors_client_source_key;

alter table public.client_source_sync_checkpoints
  add constraint client_source_sync_checkpoints_client_source_key_unique
  unique (client_id, source, checkpoint_key);

create index if not exists client_source_sync_checkpoints_client_source_idx
  on public.client_source_sync_checkpoints (client_id, source);

-- 5) Runs: indices essenciais para claim/status.
create index if not exists client_source_sync_runs_claim_idx
  on public.client_source_sync_runs (status, locked_at, created_at)
  where status = 'queued';

create index if not exists client_source_sync_runs_client_created_idx
  on public.client_source_sync_runs (client_id, created_at desc);

-- 6) Idempotencia das metricas diarias (upsert por client/date/source).
create unique index if not exists client_metrics_daily_client_date_source_uidx
  on public.client_metrics_daily (client_id, metric_date, source);

create index if not exists client_metrics_daily_client_source_date_idx
  on public.client_metrics_daily (client_id, source, metric_date);

-- 7) RLS basico multi-tenant para novas tabelas.
alter table public.client_source_connections enable row level security;
alter table public.client_source_sync_checkpoints enable row level security;

-- Select por tenancy.
drop policy if exists "client_source_connections_select_own_clients" on public.client_source_connections;
create policy "client_source_connections_select_own_clients"
  on public.client_source_connections
  for select
  using (
    exists (
      select 1
      from public.client_memberships cm
      where cm.client_id = client_source_connections.client_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );

drop policy if exists "client_source_sync_checkpoints_select_own_clients" on public.client_source_sync_checkpoints;
create policy "client_source_sync_checkpoints_select_own_clients"
  on public.client_source_sync_checkpoints
  for select
  using (
    exists (
      select 1
      from public.client_memberships cm
      where cm.client_id = client_source_sync_checkpoints.client_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );

-- 8) Atualizar funcao de claim para tabela consolidada.
create or replace function public.claim_next_sync_run(p_worker_id text)
returns setof public.client_source_sync_runs
language plpgsql
security definer
as $$
declare
  claimed public.client_source_sync_runs%rowtype;
begin
  select *
    into claimed
  from public.client_source_sync_runs
  where status = 'queued'
    and locked_at is null
  order by created_at asc
  for update skip locked
  limit 1;

  if not found then
    return;
  end if;

  update public.client_source_sync_runs
  set
    status = 'running',
    locked_at = now(),
    locked_by = p_worker_id,
    started_at = now()
  where id = claimed.id
    and status = 'queued'
    and locked_at is null
  returning * into claimed;

  if not found then
    return;
  end if;

  return next claimed;
end;
$$;

grant execute on function public.claim_next_sync_run(text) to authenticated;
grant execute on function public.claim_next_sync_run(text) to service_role;
