export type SyncStatus = 'queued' | 'running' | 'success' | 'failed'

export type SyncRun = {
  id: string
  clientId: string
  source: string
  trigger: 'manual'
  status: SyncStatus
  requestedBy: string | null
  lockedBy: string | null
  lockedAt: string | null
  startedAt: string | null
  finishedAt: string | null
  errorMessage: string | null
  createdAt: string
}

export type EtlLogContext = {
  service: 'api' | 'worker'
  action: string
  runId?: string
  clientId?: string
}
