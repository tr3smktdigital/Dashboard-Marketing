import type { SyncRun } from '../lib/etl/types.ts'
import { createWorkerAdminClient } from './supabase-admin.ts'

type ClaimRow = {
  id: string
  client_id: string
  source: string
  trigger: 'manual'
  status: 'running'
  requested_by: string | null
  locked_by: string | null
  locked_at: string | null
  started_at: string | null
  finished_at: string | null
  error_message: string | null
  created_at: string
}

export async function claimNextSyncJob(workerId: string): Promise<SyncRun | null> {
  const supabase = createWorkerAdminClient()

  const { data, error } = await supabase.rpc('claim_next_sync_run', {
    p_worker_id: workerId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = (Array.isArray(data) ? data[0] : null) as ClaimRow | null

  if (!row) {
    return null
  }

  return {
    id: row.id,
    clientId: row.client_id,
    source: row.source,
    trigger: row.trigger,
    status: row.status,
    requestedBy: row.requested_by,
    lockedBy: row.locked_by,
    lockedAt: row.locked_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }
}
