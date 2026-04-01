import { logInfo } from '../../../lib/etl/logger.ts'
import { createWorkerAdminClient } from '../../supabase-admin.ts'
import { extractKommoIncremental } from './extractor.ts'
import { KommoClient } from './client.ts'
import { transformKommoDailyBuckets } from './transformer.ts'
import type { KommoCheckpoint, KommoConnectionConfig } from './types.ts'

function parseKommoConfig(raw: unknown): KommoConnectionConfig {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Kommo config payload is invalid')
  }

  const record = raw as Record<string, unknown>
  const baseUrl = String(record.base_url ?? '').trim()
  const accessToken = String(record.access_token ?? '').trim()

  if (!baseUrl || !accessToken) {
    throw new Error('Kommo config requires base_url and access_token')
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    accessToken,
  }
}

function parseCheckpoint(raw: unknown): KommoCheckpoint {
  if (!raw || typeof raw !== 'object') {
    return { lastSyncedUpdatedAt: 0 }
  }

  const record = raw as Record<string, unknown>
  const value = Number(record.lastSyncedUpdatedAt ?? 0)

  return {
    lastSyncedUpdatedAt: Number.isFinite(value) && value > 0 ? value : 0,
  }
}

export async function runKommoSync(params: { runId: string; clientId: string }) {
  const supabase = createWorkerAdminClient()

  const { data: connection, error: connectionError } = await supabase
    .from('client_source_connections')
    .select('id, config')
    .eq('client_id', params.clientId)
    .eq('source', 'kommo')
    .eq('status', 'active')
    .maybeSingle()

  if (connectionError) {
    throw new Error(connectionError.message)
  }

  if (!connection) {
    throw new Error('No active Kommo connection found')
  }

  const { data: checkpointRow, error: checkpointError } = await supabase
    .from('client_source_sync_checkpoints')
    .select('id, checkpoint')
    .eq('client_id', params.clientId)
    .eq('source', 'kommo')
    .eq('scope', 'source')
    .eq('checkpoint_key', 'default')
    .maybeSingle()

  if (checkpointError) {
    throw new Error(checkpointError.message)
  }

  const config = parseKommoConfig(connection.config)
  const checkpoint = parseCheckpoint(checkpointRow?.checkpoint)
  const client = new KommoClient(config.baseUrl, config.accessToken)

  logInfo(
    { service: 'worker', action: 'kommo_extract_start', runId: params.runId, clientId: params.clientId },
    'Kommo extract started',
    { source: 'kommo', lastSyncedUpdatedAt: checkpoint.lastSyncedUpdatedAt }
  )

  const warnings: unknown[] = []

  const extracted = await extractKommoIncremental({
    client,
    checkpoint,
    onWarning: (message, meta) => {
      warnings.push({ message, meta })
    },
  })

  if (warnings.length > 0) {
    logInfo(
      {
        service: 'worker',
        action: 'kommo_stage_warnings',
        runId: params.runId,
        clientId: params.clientId,
      },
      'Kommo stage warnings detected',
      { source: 'kommo', warningsCount: warnings.length }
    )
  }

  const dailyMetrics = transformKommoDailyBuckets({
    dayBuckets: extracted.dayBuckets,
    stageClassMap: extracted.stageClassMap,
  })

  const rows = dailyMetrics.flatMap((metric) => [
    {
      client_id: params.clientId,
      source: 'kommo',
      metric_date: metric.metricDate,
      metric_key: 'leads_created',
      metric_value: metric.leadsCreated,
    },
    {
      client_id: params.clientId,
      source: 'kommo',
      metric_date: metric.metricDate,
      metric_key: 'leads_won',
      metric_value: metric.leadsWon,
    },
    {
      client_id: params.clientId,
      source: 'kommo',
      metric_date: metric.metricDate,
      metric_key: 'won_revenue',
      metric_value: metric.wonRevenue,
    },
  ])

  if (rows.length > 0) {
    const { error: upsertError } = await supabase.from('client_metrics_daily').upsert(rows, {
      onConflict: 'client_id,source,metric_date,metric_key',
    })

    if (upsertError) {
      throw new Error(upsertError.message)
    }
  }

  const nextCheckpoint: KommoCheckpoint = {
    lastSyncedUpdatedAt: extracted.maxUpdatedAt,
  }

  if (checkpointRow) {
    const { error: updateError } = await supabase
      .from('client_source_sync_checkpoints')
      .update({
        checkpoint: nextCheckpoint,
        last_run_id: params.runId,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', checkpointRow.id)

    if (updateError) {
      throw new Error(updateError.message)
    }
  } else {
    const { error: insertError } = await supabase
      .from('client_source_sync_checkpoints')
      .insert({
        client_id: params.clientId,
        source: 'kommo',
        scope: 'source',
        checkpoint_key: 'default',
        checkpoint: nextCheckpoint,
        last_run_id: params.runId,
        last_synced_at: new Date().toISOString(),
      })

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  logInfo(
    { service: 'worker', action: 'kommo_extract_done', runId: params.runId, clientId: params.clientId },
    'Kommo sync completed',
    {
      source: 'kommo',
      pagesRead: extracted.pagesRead,
      incrementalLeadsProcessed: extracted.incrementalLeadsCount,
      maxUpdatedAt: extracted.maxUpdatedAt,
      impactedDays: extracted.impactedDates.length,
      rowsUpserted: rows.length,
      fromUpdatedAt: extracted.fromUpdatedAt,
      toUpdatedAt: extracted.toUpdatedAt,
    }
  )

  return {
    source: 'kommo',
    pagesRead: extracted.pagesRead,
    leadsProcessed: extracted.incrementalLeadsCount,
    maxUpdatedAt: extracted.maxUpdatedAt,
    impactedDays: extracted.impactedDates.length,
    rowsUpserted: rows.length,
  }
}
