import { logError, logInfo } from '../lib/etl/logger.ts'
import { claimNextSyncJob } from './job-claim.ts'
import { runKommoSync } from './connectors/kommo/index.ts'
import { finishSyncRun } from './sync-runs.ts'

const POLL_INTERVAL_MS = 3000

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function processRun(job: { id: string; clientId: string; source: string }) {
  if (job.source !== 'kommo') {
    throw new Error(`Unsupported source: ${job.source}`)
  }

  return runKommoSync({
    runId: job.id,
    clientId: job.clientId,
  })
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown worker error'
}

async function main() {
  const workerId = `worker-${process.pid}`

  logInfo({ service: 'worker', action: 'boot' }, 'Worker started', { workerId })

  while (true) {
    const job = await claimNextSyncJob(workerId)

    if (!job) {
      await wait(POLL_INTERVAL_MS)
      continue
    }

    logInfo(
      {
        service: 'worker',
        action: 'job_claimed',
        runId: job.id,
        clientId: job.clientId,
      },
      'Sync run claimed',
      { source: job.source }
    )

    try {
      const result = await processRun(job)

      await finishSyncRun({
        id: job.id,
        status: 'success',
      })

      logInfo(
        {
          service: 'worker',
          action: 'job_finished',
          runId: job.id,
          clientId: job.clientId,
        },
        'Sync run finished',
        result
      )
    } catch (error: unknown) {
      const message = getErrorMessage(error)

      await finishSyncRun({
        id: job.id,
        status: 'failed',
        errorMessage: message,
      })

      logError(
        {
          service: 'worker',
          action: 'job_failed',
          runId: job.id,
          clientId: job.clientId,
        },
        'Sync run failed',
        { message, source: job.source }
      )
    }
  }
}

main().catch((error: unknown) => {
  const message = getErrorMessage(error)

  logError(
    {
      service: 'worker',
      action: 'fatal',
    },
    'Worker crashed',
    { message }
  )

  process.exitCode = 1
})
