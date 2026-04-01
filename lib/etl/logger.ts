import type { EtlLogContext } from './types.ts'

type LogLevel = 'info' | 'error'

function write(level: LogLevel, context: EtlLogContext, message: string, meta?: unknown) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
    meta,
  }

  if (level === 'error') {
    console.error(JSON.stringify(payload))
    return
  }

  console.log(JSON.stringify(payload))
}

export function logInfo(context: EtlLogContext, message: string, meta?: unknown) {
  write('info', context, message, meta)
}

export function logError(context: EtlLogContext, message: string, meta?: unknown) {
  write('error', context, message, meta)
}
