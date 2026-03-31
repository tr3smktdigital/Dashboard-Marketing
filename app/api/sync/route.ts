import { logInfo } from '../../../lib/etl/logger'
import { createClient } from '../../../lib/supabase/server'

type SyncRequestBody = {
  clientId?: string
  source?: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as SyncRequestBody
  const source = body.source?.trim() || 'kommo'

  if (!body.clientId) {
    return Response.json({ error: 'clientId is required' }, { status: 400 })
  }

  const { data: membership, error: membershipError } = await supabase
    .from('client_memberships')
    .select('client_id, is_active')
    .eq('client_id', body.clientId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  if (!membership) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: run, error: runError } = await supabase
    .from('client_source_sync_runs')
    .insert({
      client_id: body.clientId,
      source,
      trigger: 'manual',
      status: 'queued',
      requested_by: user.id,
    })
    .select('id, status')
    .single()

  if (runError) {
    throw new Error(runError.message)
  }

  logInfo(
    {
      service: 'api',
      action: 'queue_manual_sync',
      runId: run.id,
      clientId: body.clientId,
    },
    'Manual sync queued'
  )

  return Response.json({ runId: run.id, status: run.status }, { status: 202 })
}
