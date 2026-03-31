import { createClient } from '../../../../lib/supabase/server'

export async function GET(_request: Request, context: RouteContext<'/api/sync-runs/[id]'>) {
  const params = await context.params
  const runId = params.id

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: run, error: runError } = await supabase
    .from('client_source_sync_runs')
    .select(
      'id, client_id, source, status, trigger, created_at, started_at, finished_at, error_message, locked_at, locked_by'
    )
    .eq('id', runId)
    .maybeSingle()

  if (runError) {
    throw new Error(runError.message)
  }

  if (!run) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: membership, error: membershipError } = await supabase
    .from('client_memberships')
    .select('client_id')
    .eq('client_id', run.client_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  if (!membership) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return Response.json({
    id: run.id,
    clientId: run.client_id,
    source: run.source,
    status: run.status,
    trigger: run.trigger,
    createdAt: run.created_at,
    lockedAt: run.locked_at,
    lockedBy: run.locked_by,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    errorMessage: run.error_message,
  })
}
