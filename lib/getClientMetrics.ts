import 'server-only'

import { getUserClient } from '@/lib/getUserClient'
import { createClient } from '@/lib/supabase/server'

export type ClientMetricDaily = {
  metricDate: string
  source: string
  impressions: number
  clicks: number
  spend: number
  leads: number
  conversions: number
  revenue: number
}

export type ClientMetricsSummary = {
  totalSpend: number
  totalClicks: number
  totalLeads: number
  totalConversions: number
  totalRevenue: number
}

export type ClientMetricsResult = {
  clientId: string
  sourceFilter: string | null
  rows: ClientMetricDaily[]
  summary: ClientMetricsSummary
}

type MetricRow = {
  metric_date: string
  source: string
  metric_key: string
  impressions: number | null
  clicks: number | null
  spend: number | string | null
  leads: number | null
  conversions: number | null
  revenue: number | string | null
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export async function getClientMetrics(source?: string) {
  const currentClient = await getUserClient()

  if (!currentClient) {
    return null
  }

  const sourceFilter = source?.trim() ? source.trim().toLowerCase() : null
  const supabase = await createClient()

  let query = supabase
    .from('client_metrics_daily')
    .select(
      'metric_date, source, metric_key, impressions, clicks, spend, leads, conversions, revenue'
    )
    .eq('client_id', currentClient.id)
    .eq('metric_key', 'summary')
    .order('metric_date', { ascending: true })

  if (sourceFilter) {
    query = query.eq('source', sourceFilter)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const rows: ClientMetricDaily[] = ((data ?? []) as MetricRow[]).map((row) => ({
    metricDate: row.metric_date,
    source: row.source,
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
    spend: toNumber(row.spend),
    leads: row.leads ?? 0,
    conversions: row.conversions ?? 0,
    revenue: toNumber(row.revenue),
  }))

  const summary = rows.reduce<ClientMetricsSummary>(
    (acc, row) => {
      acc.totalSpend += row.spend
      acc.totalClicks += row.clicks
      acc.totalLeads += row.leads
      acc.totalConversions += row.conversions
      acc.totalRevenue += row.revenue
      return acc
    },
    {
      totalSpend: 0,
      totalClicks: 0,
      totalLeads: 0,
      totalConversions: 0,
      totalRevenue: 0,
    }
  )

  return {
    clientId: currentClient.id,
    sourceFilter,
    rows,
    summary,
  } satisfies ClientMetricsResult
}
