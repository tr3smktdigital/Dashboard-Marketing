import type { KommoStageClass } from './types.ts'

export type KommoStageForClassification = {
  pipelineId: number
  statusId: number
  type?: string | null
  name?: string
}

export function stageCompositeKey(pipelineId: number, statusId: number) {
  return `${pipelineId}:${statusId}`
}

export function classifyKommoStage(stage: KommoStageForClassification): KommoStageClass {
  const type = String(stage.type ?? '').toLowerCase().trim()

  if (type.includes('won')) {
    return 'won'
  }

  if (type.includes('lost')) {
    return 'lost'
  }

  if (type.includes('incoming')) {
    return 'incoming'
  }

  return 'other'
}

export function buildStatusClassMap(
  stages: KommoStageForClassification[],
  onWarning?: (message: string, stage: KommoStageForClassification) => void
) {
  const map = new Map<string, KommoStageClass>()

  for (const stage of stages) {
    if (!stage.type && onWarning) {
      onWarning('Kommo stage returned without type', stage)
    }

    map.set(stageCompositeKey(stage.pipelineId, stage.statusId), classifyKommoStage(stage))
  }

  return map
}
