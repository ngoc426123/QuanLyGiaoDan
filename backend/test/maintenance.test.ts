import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, afterEach, beforeEach, describe, it } from 'node:test'
import { getDatabase } from '#/db/connection.ts'
import { createLogger } from '#/main/logger.ts'
import * as activityLogRepository from '#/repositories/activity-log.repository.ts'
import { runStartupMaintenance } from '#/services/maintenance.service.ts'
import * as zoneService from '#/services/zone.service.ts'
import { disposeDatabase, freshDatabase } from './helpers/database.mjs'

let db: any
let temporaryDirectories: string[] = []

beforeEach(async () => {
  db = await freshDatabase()
  temporaryDirectories = []
  const settings = [
    ['data.autoBackup', false],
    ['data.backupIntervalDays', 7],
    ['data.trashRetentionDays', 30],
    ['data.lastVacuumAt', '2026-09-01T00:00:00.000Z'],
  ]
  for (const [key, value] of settings) {
    db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)').run(
      key,
      JSON.stringify(value),
      '2026-09-01T00:00:00.000Z',
    )
  }
})

after(() => {
  disposeDatabase()
})

afterEach(() => {
  temporaryDirectories.forEach((directory) => rmSync(directory, { recursive: true, force: true }))
})

function temporaryDirectory(prefix: string) {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

describe('bảo trì khởi động', () => {
  it('dọn thùng rác và lịch sử quá hạn theo đúng thứ tự khoá ngoại', async () => {
    const zone = zoneService.create({ name: 'Giáo họ cũ' })
    zoneService.remove({ id: zone.id })
    db.prepare('UPDATE zones SET deleted_at = ? WHERE id = ?').run(
      '2026-07-01T00:00:00.000Z',
      zone.id,
    )
    db.prepare('UPDATE activity_logs SET created_at = ?').run('2026-07-01T00:00:00.000Z')

    const result = await runStartupMaintenance({
      backupDir: temporaryDirectory('elecrusion-maintenance-'),
      timestamp: '2026-09-21T00:00:00.000Z',
    })

    assert.equal(result.trash, 1)
    assert.equal(result.activities, 2)
    assert.equal(db.prepare('SELECT COUNT(*) AS total FROM zones').get().total, 0)
    assert.equal(activityLogRepository.findByEntity('zone', zone.id).length, 0)
  })

  it('chạy VACUUM mỗi 30 ngày và ghi lại mốc hoàn tất', async () => {
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run('null', 'data.lastVacuumAt')
    const result = await runStartupMaintenance({
      backupDir: temporaryDirectory('elecrusion-vacuum-'),
      timestamp: '2026-09-21T00:00:00.000Z',
    })

    assert.equal(result.vacuumed, true)
    assert.equal(
      JSON.parse(
        getDatabase().prepare('SELECT value FROM settings WHERE key = ?').get('data.lastVacuumAt')
          .value,
      ),
      '2026-09-21T00:00:00.000Z',
    )
  })
})

it('log chẩn đoán chỉ giữ metadata được phép', () => {
  const directory = mkdtempSync(join(tmpdir(), 'elecrusion-log-'))
  try {
    const logger = createLogger(directory)
    logger.info('person:update', { id: 'person-1', fullName: 'Nguyễn Văn An', phone: '0900000000' })
    const file = join(directory, `main-${new Date().toISOString().slice(0, 10)}.log`)
    const content = readFileSync(file, 'utf8')

    assert.ok(content.includes('person-1'))
    assert.equal(content.includes('Nguyễn Văn An'), false)
    assert.equal(content.includes('0900000000'), false)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
