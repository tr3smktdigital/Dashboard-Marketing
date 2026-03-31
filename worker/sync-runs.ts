import { createWorkerAdminClient } from './supabase-admin.ts'

export async function finishSyncRun(params: {
  id: string
  status: 'success' | 'failed'
  errorMessage?: string
}) {
  const supabase = createWorkerAdminClient()

  const { error } = await supabase
    .from('client_source_sync_runs')
    .update({
      status: params.status,
      finished_at: new Date().toISOString(),
      error_message: params.errorMessage ?? null,
    })
    .eq('id', params.id)
    .eq('status', 'running')

  if (error) {
    throw new Error(error.message)
  }
}
