import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, beforeEach, describe, it } from 'node:test'
import Database from 'better-sqlite3'
import { applyPragmas, closeDatabase, openDatabase } from '#/db/connection.js'
import { migrate } from '#/db/migrator.js'
import { seedDefaultSettings } from '#/db/seed.js'
import { inspectDatabaseFile } from '#/db/transfer.js'
import * as backupService from '#/services/backup.service.js'
import * as zoneService from '#/services/zone.service.js'

/**
 * Xuất / nhập toàn bộ dữ liệu. Phải chạy trên DB **theo file** chứ không phải `:memory:`:
 * chính thao tác thay file là thứ cần kiểm.
 */

let workDir
let dbFile
let backupDir
let db

/** Dựng một DB thật trong thư mục tạm, giống hệt luồng khởi động của app. */
async function freshFileDatabase() {
  closeDatabase()

  workDir = mkdtempSync(join(tmpdir(), 'elecrusion-backup-'))
  dbFile = join(workDir, 'data', 'app.db')
  backupDir = join(workDir, 'backups')

  const { mkdirSync } = await import('node:fs')
  mkdirSync(join(workDir, 'data'), { recursive: true })

  const db = openDatabase(dbFile)
  await migrate(db)
  applyPragmas(db)
  seedDefaultSettings(db, '2026-09-13T00:00:00.000Z')

  return db
}

beforeEach(async () => {
  db = await freshFileDatabase()
})

after(() => {
  closeDatabase()
  if (workDir) rmSync(workDir, { recursive: true, force: true })
})

describe('backup.service — xuất dữ liệu', () => {
  it('xuất ra file mở lại được và đủ dữ liệu', async () => {
    zoneService.create({ name: 'Giáo họ Thánh Tâm' })
    zoneService.create({ name: 'Giáo họ Mân Côi' })

    const target = join(workDir, 'xuat.db')
    const result = await backupService.exportToFile({ targetPath: target })

    assert.equal(result.filePath, target)
    assert.ok(result.sizeBytes > 0)

    const info = inspectDatabaseFile(target)
    assert.equal(info.recordCounts.zones, 2)
    assert.equal(info.schemaVersion, 1)
  })

  it('xuất được cả khi đang có dữ liệu ghi dở — dùng API backup của SQLite', async () => {
    zoneService.create({ name: 'Giáo họ A' })

    const target = join(workDir, 'xuat-2.db')
    await backupService.exportToFile({ targetPath: target })

    // Ghi thêm sau khi xuất: file đã xuất không được đổi theo.
    zoneService.create({ name: 'Giáo họ B' })

    assert.equal(inspectDatabaseFile(target).recordCounts.zones, 1)
    assert.equal(zoneService.list({}).meta.total, 2)
  })
})

describe('backup.service — soi file trước khi nhập', () => {
  it('từ chối file không phải SQLite', () => {
    const rubbish = join(workDir, 'rac.db')
    writeFileSync(rubbish, 'đây không phải file SQLite')

    assert.throws(
      () => backupService.inspectFile({ sourcePath: rubbish }),
      (error) => error.code === 'VALIDATION_ERROR',
    )
  })

  it('từ chối file SQLite hợp lệ nhưng không phải của ứng dụng', () => {
    const foreign = join(workDir, 'la.db')
    const other = new Database(foreign)
    other.exec('CREATE TABLE ghi_chu (id TEXT PRIMARY KEY)')
    other.close()

    assert.throws(
      () => backupService.inspectFile({ sourcePath: foreign }),
      (error) => error.code === 'VALIDATION_ERROR' && error.details.missing.length === 5,
    )
  })

  it('từ chối file không tồn tại', () => {
    assert.throws(
      () => backupService.inspectFile({ sourcePath: join(workDir, 'khong-co.db') }),
      (error) => error.code === 'IO_ERROR',
    )
  })
})

describe('backup.service — đối chiếu trước khi nhập', () => {
  it('đếm đúng bản ghi sẽ mất và bản ghi sẽ bị lùi về bản cũ', async () => {
    const zoneA = zoneService.create({ name: 'Giáo họ A' })

    const exported = join(workDir, 'doi-chieu.db')
    await backupService.exportToFile({ targetPath: exported })

    // Máy này đi tiếp sau khi xuất: thêm một giáo họ, và sửa giáo họ cũ.
    zoneService.create({ name: 'Giáo họ B' })
    db.prepare('UPDATE zones SET updated_at = ? WHERE id = ?').run(
      '2099-01-01T00:00:00.000Z',
      zoneA.id,
    )

    const { divergence } = backupService.inspectFile({ sourcePath: exported, dbFile })

    assert.equal(divergence.current.zones, 2)
    assert.equal(divergence.incoming.zones, 1)

    // "Giáo họ B" chỉ có trên máy này -> nhập vào là mất.
    assert.equal(divergence.onlyInCurrent.zones, 1)
    assert.equal(divergence.onlyInCurrent.total, 1)

    // "Giáo họ A" trên máy này mới hơn -> nhập vào là lùi về bản cũ.
    assert.equal(divergence.newerInCurrent.zones, 1)
    assert.equal(divergence.currentIsNewer, true)
  })

  it('hai bên giống hệt thì báo không mất gì', async () => {
    zoneService.create({ name: 'Giáo họ A' })

    const exported = join(workDir, 'giong-het.db')
    await backupService.exportToFile({ targetPath: exported })

    const { divergence } = backupService.inspectFile({ sourcePath: exported, dbFile })

    assert.equal(divergence.onlyInCurrent.total, 0)
    assert.equal(divergence.newerInCurrent.total, 0)
    assert.equal(divergence.currentIsNewer, false)
  })

  it('đối chiếu không được đụng vào dữ liệu của cả hai bên', async () => {
    zoneService.create({ name: 'Giáo họ A' })

    const exported = join(workDir, 'chi-doc.db')
    await backupService.exportToFile({ targetPath: exported })

    const before = inspectDatabaseFile(exported)
    backupService.inspectFile({ sourcePath: exported, dbFile })
    const after = inspectDatabaseFile(exported)

    assert.deepEqual(after.recordCounts, before.recordCounts)
    assert.equal(zoneService.list({}).meta.total, 1)
  })
})

describe('backup.service — nội dung cảnh báo', () => {
  it('nói thẳng con số sẽ mất và số sẽ bị lùi về bản cũ', async () => {
    const zoneA = zoneService.create({ name: 'Giáo họ A' })

    const exported = join(workDir, 'canh-bao.db')
    await backupService.exportToFile({ targetPath: exported })

    zoneService.create({ name: 'Giáo họ B' })
    db.prepare('UPDATE zones SET updated_at = ? WHERE id = ?').run(
      '2099-01-01T00:00:00.000Z',
      zoneA.id,
    )

    const info = backupService.inspectFile({ sourcePath: exported, dbFile })
    const warning = backupService.describeImportWarning(info)

    assert.ok(warning.includes('1 bản ghi chỉ có trên máy này sẽ bị XOÁ (1 giáo họ).'))
    assert.ok(warning.includes('1 bản ghi trên máy này mới hơn sẽ bị LÙI VỀ bản trong file'))
    assert.ok(warning.includes('Máy này có thay đổi mới hơn file bạn sắp nhập'))
    assert.ok(warning.includes('sao lưu vào thư mục backups'))
  })

  it('hai bên giống nhau thì nói rõ không mất gì', async () => {
    zoneService.create({ name: 'Giáo họ A' })

    const exported = join(workDir, 'canh-bao-2.db')
    await backupService.exportToFile({ targetPath: exported })

    const info = backupService.inspectFile({ sourcePath: exported, dbFile })
    const warning = backupService.describeImportWarning(info)

    assert.ok(warning.includes('Không có bản ghi nào trên máy này bị mất'))
    assert.equal(warning.includes('XOÁ'), false)
  })
})

describe('backup.service — nhập dữ liệu', () => {
  it('thay trọn dữ liệu và để lại bản sao an toàn', async () => {
    zoneService.create({ name: 'Giáo họ Gốc' })

    const exported = join(workDir, 'nguon.db')
    await backupService.exportToFile({ targetPath: exported })

    // Dữ liệu hiện tại đi theo hướng khác trước khi nhập.
    zoneService.create({ name: 'Giáo họ Thêm Sau' })
    assert.equal(zoneService.list({}).meta.total, 2)

    const result = await backupService.importFromFile({ dbFile, sourcePath: exported, backupDir })

    assert.equal(result.recordCounts.zones, 1)
    assert.ok(existsSync(result.safetyBackup))

    // Bản sao an toàn phải chứa dữ liệu TRƯỚC khi nhập.
    assert.equal(inspectDatabaseFile(result.safetyBackup).recordCounts.zones, 2)

    // Mở lại như app làm sau khi khởi động lại.
    const reopened = openDatabase(dbFile)
    applyPragmas(reopened)

    const zones = zoneService.list({})
    assert.equal(zones.meta.total, 1)
    assert.equal(zones.data[0].name, 'Giáo họ Gốc')
  })

  it('xoá luôn file -wal cũ để WAL của DB cũ không ghép vào DB mới', async () => {
    zoneService.create({ name: 'Giáo họ Gốc' })

    const exported = join(workDir, 'nguon-2.db')
    await backupService.exportToFile({ targetPath: exported })

    assert.ok(existsSync(dbFile + '-wal'))

    await backupService.importFromFile({ dbFile, sourcePath: exported, backupDir })

    assert.equal(existsSync(dbFile + '-wal'), false)
    assert.equal(existsSync(dbFile + '-shm'), false)
    assert.equal(existsSync(dbFile + '.incoming'), false)
  })

  it('từ chối file có schema mới hơn bản build đang chạy', async () => {
    const newer = join(workDir, 'moi-hon.db')
    const db = new Database(newer)
    await migrate(db)
    db.pragma('user_version = 99')
    db.close()

    await assert.rejects(
      () => backupService.importFromFile({ dbFile, sourcePath: newer, backupDir }),
      (error) => error.code === 'VALIDATION_ERROR' && error.details.schemaVersion === 99,
    )

    // DB hiện tại không được đụng tới.
    assert.ok(existsSync(dbFile))
    assert.equal(zoneService.list({}).meta.total, 0)
  })

  it('từ chối khi chọn đúng file đang dùng', async () => {
    await assert.rejects(
      () => backupService.importFromFile({ dbFile, sourcePath: dbFile, backupDir }),
      (error) => error.code === 'VALIDATION_ERROR',
    )
  })

  it('từ chối file hỏng, không đụng tới dữ liệu hiện có', async () => {
    zoneService.create({ name: 'Giáo họ Gốc' })

    const rubbish = join(workDir, 'rac-2.db')
    writeFileSync(rubbish, 'không phải SQLite')

    await assert.rejects(() =>
      backupService.importFromFile({ dbFile, sourcePath: rubbish, backupDir }),
    )

    assert.equal(zoneService.list({}).meta.total, 1)
    assert.equal(existsSync(backupDir) ? readdirSync(backupDir).length : 0, 0)
  })
})
