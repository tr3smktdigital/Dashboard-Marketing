import { buildStatusClassMap, stageCompositeKey } from './status-classifier.ts'
import type { KommoCheckpoint, KommoLead, KommoStageClass } from './types.ts'
import { KommoClient } from './client.ts'

const OVERLAP_SECONDS = 300
const MAX_PAGES_DEFENSIVE = 500
const PAGE_LIMIT = 250

type DayBucketInput = {
  metricDate: string
  createdLeads: KommoLead[]
  updatedLeads: KommoLead[]
}

function toDateKey(unixSeconds: number) {
  // V1 usa dia UTC (ISO YYYY-MM-DD) para agregacao temporal.
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10)
}

function utcDayRange(metricDate: string) {
  const startUnix = Math.floor(new Date(`${metricDate}T00:00:00.000Z`).getTime() / 1000)
  const endUnix = startUnix + 24 * 60 * 60 - 1

  return { startUnix, endUnix }
}

async function fetchAllLeadsInRange(params: {
  client: KommoClient
  timeField: 'created_at' | 'updated_at'
  fromUnix: number
  toUnix: number
}) {
  const leads: KommoLead[] = []
  let pagesRead = 0
  let page = 1

  while (true) {
    const pageLeads = await params.client.listLeadsPage({
      timeField: params.timeField,
      fromUnix: params.fromUnix,
      toUnix: params.toUnix,
      page,
      limit: PAGE_LIMIT,
    })

    pagesRead += 1

    if (!pageLeads.length) {
      break
    }

    leads.push(...pageLeads)

    if (pageLeads.length < PAGE_LIMIT) {
      break
    }

    page += 1

    if (page > MAX_PAGES_DEFENSIVE) {
      throw new Error(
        `Kommo pagination exceeded defensive limit (${MAX_PAGES_DEFENSIVE}) for ${params.timeField}`
      )
    }
  }

  return {
    leads,
    pagesRead,
  }
}

export async function extractKommoIncremental(params: {
  client: KommoClient
  checkpoint: KommoCheckpoint
  onWarning?: (message: string, meta?: unknown) => void
}) {
  const nowUnix = Math.floor(Date.now() / 1000)
  const fromUpdatedAt = Math.max(params.checkpoint.lastSyncedUpdatedAt - OVERLAP_SECONDS, 0)
  const toUpdatedAt = nowUnix

  const pipelines = await params.client.listPipelines()
  const stagesForClassification: Array<{
    pipelineId: number
    statusId: number
    type?: string | null
    name?: string
  }> = []

  let pagesRead = 0

  for (const pipeline of pipelines) {
    const statuses = await params.client.listPipelineStatuses(pipeline.id)

    for (const status of statuses) {
      stagesForClassification.push({
        pipelineId: pipeline.id,
        statusId: status.id,
        type: status.type,
        name: status.name,
      })
    }
  }

  const stageClassMap = buildStatusClassMap(stagesForClassification, (message, stage) => {
    params.onWarning?.(message, stage)
  })

  const incrementalSlice = await fetchAllLeadsInRange({
    client: params.client,
    timeField: 'updated_at',
    fromUnix: fromUpdatedAt,
    toUnix: toUpdatedAt,
  })

  pagesRead += incrementalSlice.pagesRead

  const impactedDateSet = new Set<string>()
  let maxUpdatedAt = params.checkpoint.lastSyncedUpdatedAt

  for (const lead of incrementalSlice.leads) {
    impactedDateSet.add(toDateKey(lead.created_at))
    impactedDateSet.add(toDateKey(lead.updated_at))

    const key =
      lead.pipeline_id !== null && lead.status_id !== null
        ? stageCompositeKey(lead.pipeline_id, lead.status_id)
        : null

    const stageClass: KommoStageClass = key ? stageClassMap.get(key) ?? 'other' : 'other'

    if (stageClass === 'won') {
      // Mantido apenas para visibilidade futura de regras por classe.
    }

    if (lead.updated_at > maxUpdatedAt) {
      maxUpdatedAt = lead.updated_at
    }
  }

  const impactedDates = Array.from(impactedDateSet).sort()
  const dayBuckets: DayBucketInput[] = []

  for (const metricDate of impactedDates) {
    const { startUnix, endUnix } = utcDayRange(metricDate)

    const createdSlice = await fetchAllLeadsInRange({
      client: params.client,
      timeField: 'created_at',
      fromUnix: startUnix,
      toUnix: endUnix,
    })

    const updatedSlice = await fetchAllLeadsInRange({
      client: params.client,
      timeField: 'updated_at',
      fromUnix: startUnix,
      toUnix: endUnix,
    })

    pagesRead += createdSlice.pagesRead + updatedSlice.pagesRead

    dayBuckets.push({
      metricDate,
      createdLeads: createdSlice.leads,
      updatedLeads: updatedSlice.leads,
    })
  }

  return {
    stageClassMap,
    fromUpdatedAt,
    toUpdatedAt,
    pagesRead,
    maxUpdatedAt,
    impactedDates,
    incrementalLeadsCount: incrementalSlice.leads.length,
    dayBuckets,
  }
}
