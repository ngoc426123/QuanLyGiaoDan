import { appendFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const MAX_LOG_FILES = 7

export function createLogger(logDir: string) {
  mkdirSync(logDir, { recursive: true })
  prune(logDir)

  function write(level: string, operation: string, metadata: Record<string, unknown> = {}) {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      operation,
      metadata: safeMetadata(metadata),
    })
    appendFileSync(join(logDir, `main-${new Date().toISOString().slice(0, 10)}.log`), line + '\n')
  }

  return Object.freeze({
    info: (operation: string, metadata?: Record<string, unknown>) =>
      write('info', operation, metadata),
    warn: (operation: string, metadata?: Record<string, unknown>) =>
      write('warn', operation, metadata),
    error: (operation: string, error?: unknown) =>
      write('error', operation, {
        errorName: error instanceof Error ? error.name : typeof error,
        errorCode: typeof error === 'object' && error ? (error as any).code : undefined,
      }),
  })
}

function safeMetadata(metadata: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(metadata).filter(
      ([key, value]) =>
        ['id', 'count', 'durationMs', 'errorName', 'errorCode', 'reason'].includes(key) &&
        ['string', 'number', 'boolean'].includes(typeof value),
    ),
  )
}

function prune(logDir: string) {
  const files = readdirSync(logDir)
    .filter((name) => /^main-\d{4}-\d{2}-\d{2}\.log$/.test(name))
    .sort()
  for (const name of files.slice(0, Math.max(0, files.length - MAX_LOG_FILES))) {
    rmSync(join(logDir, name), { force: true })
  }
}
