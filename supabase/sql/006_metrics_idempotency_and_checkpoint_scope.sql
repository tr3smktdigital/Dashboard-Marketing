-- Fase 2.1: corrigir idempotencia de metricas e explicitar escopo de checkpoint.

-- 1) client_metrics_daily: suporte a multiplas metricas por dia/fonte.
alter table public.client_metrics_daily
  add column if not exists metric_key text not null default 'summary',
  add column if not exists metric_value numeric;

-- Remove chave antiga simplificada (client_id, metric_date, source).
alter table public.client_metrics_daily
  drop constraint if exists client_metrics_daily_client_id_metric_date_source_key;

alter table public.client_metrics_daily
  drop constraint if exists client_metrics_daily_client_date_source_key;

drop index if exists public.client_metrics_daily_client_date_source_uidx;

-- Nova chave idempotente por metrica.
create unique index if not exists client_metrics_daily_idempotency_uidx
  on public.client_metrics_daily (client_id, source, metric_date, metric_key);

-- Leitura atual do dashboard (summary) continua eficiente.
create index if not exists client_metrics_daily_dashboard_summary_idx
  on public.client_metrics_daily (client_id, source, metric_date)
  where metric_key = 'summary';

-- 2) client_source_connections: campos minimos para connectors futuros (ex: Kommo).
alter table public.client_source_connections
  add column if not exists display_name text,
  add column if not exists last_validated_at timestamptz;

-- 3) checkpoints: escopo explicito (source vs connection).
alter table public.client_source_sync_checkpoints
  add column if not exists scope text not null default 'source',
  add column if not exists connection_id uuid references public.client_source_connections(id) on delete cascade;

alter table public.client_source_sync_checkpoints
  drop constraint if exists client_source_sync_checkpoints_scope_check;

alter table public.client_source_sync_checkpoints
  add constraint client_source_sync_checkpoints_scope_check
  check (
    (scope = 'source' and connection_id is null)
    or (scope = 'connection' and connection_id is not null)
  );

alter table public.client_source_sync_checkpoints
  drop constraint if exists client_source_sync_checkpoints_client_source_key_unique;

create unique index if not exists client_source_sync_checkpoints_scope_uidx
  on public.client_source_sync_checkpoints (
    client_id,
    source,
    scope,
    coalesce(connection_id, '00000000-0000-0000-0000-000000000000'::uuid),
    checkpoint_key
  );
