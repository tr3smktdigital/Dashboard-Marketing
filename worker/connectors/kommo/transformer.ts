import { stageCompositeKey } from './status-classifier.ts'
import type { KommoDailyMetrics, KommoLead, KommoStageClass } from './types.ts'

type DayBucketInput = {
  metricDate: string
  createdLeads: KommoLead[]
  updatedLeads: KommoLead[]
}

export function transformKommoDailyBuckets(params: {
  dayBuckets: DayBucketInput[]
  stageClassMap: Map<string, KommoStageClass>
}) {
  const metrics: KommoDailyMetrics[] = []

  for (const bucket of params.dayBuckets) {
    let leadsWon = 0
    let wonRevenue = 0

    for (const lead of bucket.updatedLeads) {
      if (lead.pipeline_id === null || lead.status_id === null) {
        continue
      }

      const stageClass =
        params.stageClassMap.get(stageCompositeKey(lead.pipeline_id, lead.status_id)) ?? 'other'

      if (stageClass === 'won') {
        leadsWon += 1
        wonRevenue += Number(lead.price ?? 0)
      }
    }

    metrics.push({
      metricDate: bucket.metricDate,
      leadsCreated: bucket.createdLeads.length,
      leadsWon,
      wonRevenue,
    })
  }

  return metrics
}
