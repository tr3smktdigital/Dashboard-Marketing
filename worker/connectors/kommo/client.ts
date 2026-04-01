import type { KommoLead, KommoPipeline, KommoStage } from './types.ts'

type LeadsPageParams = {
  timeField: 'created_at' | 'updated_at'
  fromUnix: number
  toUnix: number
  page: number
  limit: number
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class KommoClient {
  private lastRequestAt = 0
  private readonly baseUrl: string
  private readonly accessToken: string

  constructor(baseUrl: string, accessToken: string) {
    this.baseUrl = baseUrl
    this.accessToken = accessToken
  }

  private async throttle() {
    const minIntervalMs = 180
    const delta = Date.now() - this.lastRequestAt

    if (delta < minIntervalMs) {
      await wait(minIntervalMs - delta)
    }

    this.lastRequestAt = Date.now()
  }

  private async get<T>(path: string, query?: URLSearchParams): Promise<T> {
    const url = `${this.baseUrl}${path}${query ? `?${query.toString()}` : ''}`
    let attempt = 0

    while (attempt < 4) {
      await this.throttle()

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }).catch(() => null)

      if (!response) {
        attempt += 1
        await wait(200 * attempt)
        continue
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Kommo auth failed (${response.status})`)
      }

      if (response.status === 429 || response.status >= 500) {
        attempt += 1
        await wait(300 * attempt)
        continue
      }

      if (!response.ok) {
        throw new Error(`Kommo request failed (${response.status})`)
      }

      const payload = (await response.json().catch(() => null)) as T | null

      if (!payload) {
        throw new Error('Kommo payload is invalid JSON')
      }

      return payload
    }

    throw new Error('Kommo request retries exhausted')
  }

  async listPipelines() {
    const payload = await this.get<{ _embedded?: { pipelines?: KommoPipeline[] } }>(
      '/api/v4/leads/pipelines'
    )

    return payload._embedded?.pipelines ?? []
  }

  async listPipelineStatuses(pipelineId: number) {
    const payload = await this.get<{ _embedded?: { statuses?: KommoStage[] } }>(
      `/api/v4/leads/pipelines/${pipelineId}/statuses`
    )

    return payload._embedded?.statuses ?? []
  }

  async listLeadsPage(params: LeadsPageParams) {
    const query = new URLSearchParams()
    query.set('limit', String(params.limit))
    query.set('page', String(params.page))
    query.set(`filter[${params.timeField}][from]`, String(params.fromUnix))
    query.set(`filter[${params.timeField}][to]`, String(params.toUnix))

    const payload = await this.get<{ _embedded?: { leads?: KommoLead[] } }>('/api/v4/leads', query)

    return payload._embedded?.leads ?? []
  }
}
