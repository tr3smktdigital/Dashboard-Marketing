-- Base de fila simples em Postgres para sync manual + worker claim.
-- Execute apos 003_etl_sync_foundation.sql.

alter table public.etl_sync_runs
  drop constraint if exists etl_sync_runs_status_check;

alter table public.etl_sync_runs
  alter column started_at drop not null;

alter table public.etl_sync_runs
  add column if not exists requested_by uuid references auth.users(id),
  add column if not exists trigger text not null default 'manual',
  add column if not exists locked_by text,
  add column if not exists locked_at timestamptz;

-- Compatibilidade com versões antigas que usaram claimed_*.
alter table public.etl_sync_runs
  rename column if exists claimed_by to locked_by;

alter table public.etl_sync_runs
  rename column if exists claimed_at to locked_at;

alter table public.etl_sync_runs
  add constraint etl_sync_runs_status_check
  check (status in ('queued', 'running', 'success', 'failed'));

create index if not exists etl_sync_runs_queue_idx
  on public.etl_sync_runs (status, created_at asc)
  where status in ('queued', 'running');

-- Usuário autenticado pode criar sync manual para seus tenants.
drop policy if exists "etl_sync_runs_insert_own_clients" on public.etl_sync_runs;
create policy "etl_sync_runs_insert_own_clients"
  on public.etl_sync_runs
  for insert
  with check (
    trigger = 'manual'
    and status = 'queued'
    and exists (
      select 1
      from public.client_memberships cm
      where cm.client_id = etl_sync_runs.client_id
        and cm.user_id = auth.uid()
        and cm.is_active = true
    )
  );

-- Claim atômico do próximo job queued elegível.
create or replace function public.claim_next_sync_run(p_worker_id text)
returns setof public.etl_sync_runs
language plpgsql
security definer
as $$
declare
  claimed public.etl_sync_runs%rowtype;
begin
  select *
    into claimed
  from public.etl_sync_runs
  where status = 'queued'
    and locked_at is null
  order by created_at asc
  for update skip locked
  limit 1;

  if not found then
    return;
  end if;

  update public.etl_sync_runs
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
