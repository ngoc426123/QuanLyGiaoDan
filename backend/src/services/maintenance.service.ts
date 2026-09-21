import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { backupDatabase } from '#/db/migrator.ts'
import { getDatabase } from '#/db/connection.ts'
import * as activityLogRepository from '#/repositories/activity-log.repository.ts'
import { runInTransaction } from '#/repositories/query-helpers.ts'
import * as settingRepository from '#/repositories/setting.repository.ts'
import * as trashRepository from '#/repositories/trash.repository.ts'

const VACUUM_INTERVAL_DAYS = 30

export async function runStartupMaintenance({ backupDir, timestamp }: any) {
  const settings = settingRepository.getAll()
  const retentionDays = Number(settings['data.trashRetentionDays'] ?? 30)
  const cutoff = new Date(Date.parse(timestamp) - retentionDays * 86_400_000).toISOString()
  const purged = runInTransaction(() => ({
    trash: trashRepository.purgeBefore(cutoff),
    activities: activityLogRepository.removeBefore(cutoff),
  }))
  const database = getDatabase()
  const vacuumed = vacuumIsDue(settings['data.lastVacuumAt'], timestamp)
  if (vacuumed) {
    database.exec('VACUUM')
    settingRepository.setValue({
      key: 'data.lastVacuumAt',
      value: timestamp,
      updatedAt: timestamp,
    })
  }

  if (
    !settings['data.autoBackup'] ||
    !backupIsDue(backupDir, Number(settings['data.backupIntervalDays'] ?? 7), timestamp)
  ) {
    return { ...purged, vacuumed, backup: null }
  }

  return { ...purged, vacuumed, backup: await backupDatabase(database, backupDir, timestamp) }
}

function backupIsDue(backupDir: string, intervalDays: number, timestamp: string) {
  try {
    const backups = readdirSync(backupDir)
      .filter((name) => name.startsWith('app-') && name.endsWith('.db'))
      .map((name) => statSync(join(backupDir, name)).mtimeMs)
    const newest = Math.max(...backups)
    return !Number.isFinite(newest) || Date.parse(timestamp) - newest >= intervalDays * 86_400_000
  } catch {
    return true
  }
}

function vacuumIsDue(lastVacuumAt: unknown, timestamp: string) {
  if (typeof lastVacuumAt !== 'string') return true
  const lastRun = Date.parse(lastVacuumAt)
  return (
    !Number.isFinite(lastRun) ||
    Date.parse(timestamp) - lastRun >= VACUUM_INTERVAL_DAYS * 86_400_000
  )
}
