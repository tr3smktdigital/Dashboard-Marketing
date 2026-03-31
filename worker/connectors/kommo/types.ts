export type KommoConnectionConfig = {
  baseUrl: string
  accessToken: string
}

export type KommoPipeline = {
  id: number
  name: string
}

export type KommoStage = {
  id: number
  name: string
  type?: string | null
}

export type KommoLead = {
  id: number
  pipeline_id: number | null
  status_id: number | null
  created_at: number
  updated_at: number
  price: number | null
}

export type KommoCheckpoint = {
  lastSyncedUpdatedAt: number
}

export type KommoStageClass = 'won' | 'lost' | 'incoming' | 'other'

export type KommoDailyMetrics = {
  metricDate: string
  leadsCreated: number
  leadsWon: number
  wonRevenue: number
}

export type KommoExtractResult = {
  leads: KommoLead[]
  maxUpdatedAt: number
  impactedDates: string[]
  pagesRead: number
}
