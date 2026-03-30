-- Métricas diárias por cliente (MVP)
-- Execute no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.client_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  metric_date date not null,
  source text not null,
  impressions integer default 0,
  clicks integer default 0,
  spend numeric default 0,
  leads integer default 0,
  conversions integer default 0,
  revenue numeric default 0,
  created_at timestamptz not null default now(),
  unique (client_id, metric_date, source)
);

create index if not exists client_metrics_daily_client_date_source_idx
  on public.client_metrics_daily (client_id, metric_date, source);

create index if not exists client_metrics_daily_metric_date_idx
  on public.client_metrics_daily (metric_date);

alter table public.client_metrics_daily enable row level security;

-- SELECT: usuário autenticado enxerga apenas métricas dos clientes vinculados.
drop policy if exists "client_metrics_daily_select_own_clients" on public.client_metrics_daily;
create policy "client_metrics_daily_select_own_clients"
  on public.client_metrics_daily
  for select
  using (
    exists (
      select 1
      from public.user_clients uc
      where uc.client_id = client_metrics_daily.client_id
        and uc.user_id = auth.uid()
    )
  );

-- INSERT: permite gravar métricas apenas para clientes vinculados ao usuário.
drop policy if exists "client_metrics_daily_insert_own_clients" on public.client_metrics_daily;
create policy "client_metrics_daily_insert_own_clients"
  on public.client_metrics_daily
  for insert
  with check (
    exists (
      select 1
      from public.user_clients uc
      where uc.client_id = client_metrics_daily.client_id
        and uc.user_id = auth.uid()
    )
  );

-- UPDATE: permite atualizar métricas apenas para clientes vinculados ao usuário.
drop policy if exists "client_metrics_daily_update_own_clients" on public.client_metrics_daily;
create policy "client_metrics_daily_update_own_clients"
  on public.client_metrics_daily
  for update
  using (
    exists (
      select 1
      from public.user_clients uc
      where uc.client_id = client_metrics_daily.client_id
        and uc.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.user_clients uc
      where uc.client_id = client_metrics_daily.client_id
        and uc.user_id = auth.uid()
    )
  );

-- Seed MVP: insere métricas para o cliente vinculado ao usuário.
-- Troque o e-mail abaixo para o usuário autenticado do teste.
with selected_client as (
  select uc.client_id
  from public.user_clients uc
  join auth.users u on u.id = uc.user_id
  where lower(u.email) = lower('SEU_EMAIL_AQUI')
  order by uc.created_at asc
  limit 1
)
insert into public.client_metrics_daily (
  client_id,
  metric_date,
  source,
  impressions,
  clicks,
  spend,
  leads,
  conversions,
  revenue
)
select
  sc.client_id,
  d.metric_date,
  d.source,
  d.impressions,
  d.clicks,
  d.spend,
  d.leads,
  d.conversions,
  d.revenue
from selected_client sc
cross join (
  values
    (current_date - 6, 'meta_ads', 14000, 520, 820.50, 46, 14, 6300.00),
    (current_date - 5, 'google_ads', 12000, 480, 760.00, 41, 11, 5400.00),
    (current_date - 4, 'ga4', 0, 0, 0.00, 38, 9, 4900.00),
    (current_date - 3, 'crm', 0, 0, 0.00, 27, 8, 7100.00),
    (current_date - 2, 'meta_ads', 15600, 610, 910.30, 53, 16, 7800.00),
    (current_date - 1, 'google_ads', 13200, 505, 802.20, 44, 12, 5900.00)
) as d(metric_date, source, impressions, clicks, spend, leads, conversions, revenue)
on conflict (client_id, metric_date, source) do update
set
  impressions = excluded.impressions,
  clicks = excluded.clicks,
  spend = excluded.spend,
  leads = excluded.leads,
  conversions = excluded.conversions,
  revenue = excluded.revenue;
