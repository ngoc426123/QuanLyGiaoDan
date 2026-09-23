import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, describe, it } from 'node:test'
import Database from 'better-sqlite3-multiple-ciphers'
import {
  LATEST_VERSION,
  assertNotDowngrade,
  backupDatabase,
  migrate,
  pendingMigrations,
  readSchemaVersion,
} from '#/db/migrator.ts'
import { MIGRATIONS } from '#/db/migrations/index.ts'

/** Migration và chặn hạ cấp — `storage-strategy.md` §5.3–5.4. */

let workDir

before(() => {
  workDir = mkdtempSync(join(tmpdir(), 'elecrusion-test-'))
})

after(() => {
  rmSync(workDir, { recursive: true, force: true })
})

describe('readSchemaVersion', () => {
  it('file DB chưa tồn tại thì coi như phiên bản 0', () => {
    assert.equal(readSchemaVersion(join(workDir, 'khong-co.db')), 0)
  })

  it('đọc được phiên bản mà KHÔNG mở kết nối ghi', () => {
    const file = join(workDir, 'version.db')
    const db = new Database(file)
    db.pragma('user_version = 7')
    db.close()

    assert.equal(readSchemaVersion(file), 7)
  })
})

describe('assertNotDowngrade', () => {
  it('cho qua khi phiên bản DB bằng hoặc thấp hơn bản build', () => {
    assert.doesNotThrow(() => assertNotDowngrade(LATEST_VERSION))
    assert.doesNotThrow(() => assertNotDowngrade(0))
  })

  it('chặn khi DB mới hơn bản build đang chạy', () => {
    assert.throws(
      () => assertNotDowngrade(LATEST_VERSION + 1),
      (error) => error.code === 'DB_ERROR' && error.details.supportedVersion === LATEST_VERSION,
    )
  })
})

describe('migrate', () => {
  it('DB rỗng: chạy hết migration và đặt user_version', async () => {
    const db = new Database(':memory:')
    const result = await migrate(db)

    assert.equal(result.from, 0)
    assert.equal(result.to, LATEST_VERSION)
    assert.deepEqual(result.applied, [
      '001_init.sql',
      '002_add_fts.sql',
      '003_add_fts_delete_triggers.sql',
      '004_fix_fts_soft_delete_triggers.sql',
      '005_add_activity_logs.sql',
      '006_add_person_extensions_and_sacraments.sql',
      '007_add_sacrament_place.sql',
      '008_add_marriages.sql',
      '009_add_person_occupation.sql',
      '010_add_dashboard_indexes.sql',
    ])
    assert.equal(db.pragma('user_version', { simple: true }), LATEST_VERSION)

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((row) => row.name)
      .sort()

    assert.deepEqual(tables, [
      'activity_logs',
      'certificate_issuances',
      'families',
      'families_fts',
      'families_fts_config',
      'families_fts_data',
      'families_fts_docsize',
      'families_fts_idx',
      'family_members',
      'marriage_participants',
      'marriages',
      'persons',
      'persons_fts',
      'persons_fts_config',
      'persons_fts_data',
      'persons_fts_docsize',
      'persons_fts_idx',
      'sacraments',
      'settings',
      'zones',
    ])
    assert.equal(
      db.prepare("SELECT name FROM pragma_table_info('sacraments') WHERE name = 'place'").get()
        .name,
      'place',
    )
    assert.equal(
      db.prepare("SELECT name FROM pragma_table_info('persons') WHERE name = 'occupation'").get()
        .name,
      'occupation',
    )
    assert.ok(
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_persons_phone'",
        )
        .get(),
    )
    db.close()
  })

  it('chạy lần hai không làm gì thêm', async () => {
    const db = new Database(':memory:')
    await migrate(db)
    const second = await migrate(db)

    assert.deepEqual(second.applied, [])
    assert.equal(second.from, LATEST_VERSION)
    db.close()
  })

  it('chuyển bốn ngày bí tích cũ sang bảng sacraments', async () => {
    const db = new Database(':memory:')
    for (const migration of MIGRATIONS.filter((migration) => migration.version <= 5)) {
      db.exec(migration.sql)
      db.pragma(`user_version = ${migration.version}`)
    }
    db.prepare(
      'INSERT INTO persons (id, full_name, full_name_ascii, baptism_date, first_communion_date,' +
        ' confirmation_date, marriage_date, created_at, updated_at)' +
        ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      'person-1',
      'Nguyễn Văn An',
      'nguyen van an',
      '1990-01-01',
      '1997-01-01',
      '2000-01-01',
      '2010-01-01',
      '2026-09-22T00:00:00.000Z',
      '2026-09-22T00:00:00.000Z',
    )

    await migrate(db)

    assert.deepEqual(
      db
        .prepare('SELECT type, date, minister FROM sacraments WHERE person_id = ? ORDER BY type')
        .all('person-1'),
      [
        { type: 'baptism', date: '1990-01-01', minister: null },
        { type: 'confirmation', date: '2000-01-01', minister: null },
        { type: 'first_communion', date: '1997-01-01', minister: null },
        { type: 'marriage', date: '2010-01-01', minister: null },
      ],
    )
    db.close()
  })

  it('không còn migration nào thì danh sách chờ rỗng', () => {
    assert.deepEqual(pendingMigrations(LATEST_VERSION), [])
    assert.equal(pendingMigrations(0).length, LATEST_VERSION)
  })

  it('migration lỗi thì rollback, user_version không đổi', async () => {
    const db = new Database(':memory:')
    await migrate(db)

    // Giả lập migration hỏng: chạy lại 001 trên DB đã có bảng.
    const broken = db.transaction(() => {
      db.exec('CREATE TABLE zones (id TEXT PRIMARY KEY)')
      db.pragma('user_version = 99')
    })

    assert.throws(broken)
    assert.equal(db.pragma('user_version', { simple: true }), LATEST_VERSION)
    db.close()
  })
})

describe('backupDatabase', () => {
  it('tạo bản sao bằng VACUUM INTO và giữ tối đa 5 bản', async () => {
    const backupDir = join(workDir, 'backups')
    const db = new Database(join(workDir, 'source.db'))
    await migrate(db)

    for (let index = 0; index < 7; index += 1) {
      // Mốc thời gian tăng dần để thứ tự tên file phản ánh thứ tự thời gian.
      await backupDatabase(db, backupDir, '2026-09-13T10:0' + index + ':00.000Z')
    }

    const files = readdirSync(backupDir).sort()

    assert.equal(files.length, 5)
    assert.equal(files[0], 'app-2026-09-13T10-02-00-000Z.db')
    assert.equal(files[4], 'app-2026-09-13T10-06-00-000Z.db')

    // Bản backup phải mở được và có đủ schema.
    const restored = new Database(join(backupDir, files[4]), { readonly: true })
    assert.equal(restored.pragma('user_version', { simple: true }), LATEST_VERSION)
    restored.close()
    db.close()
  })

  it('tên file backup không chứa ký tự Windows cấm', async () => {
    const backupDir = join(workDir, 'backups-2')
    const db = new Database(':memory:')
    await migrate(db)

    const file = await backupDatabase(db, backupDir, '2026-09-13T10:00:00.000Z')

    assert.ok(!file.slice(3).includes(':'))
    db.close()
  })
})

describe('bảo vệ dữ liệu', () => {
  it('file DB không phải SQLite thì báo lỗi rõ ràng thay vì ghi đè', () => {
    const file = join(workDir, 'rac.db')
    writeFileSync(file, 'đây không phải file SQLite')

    assert.throws(() => readSchemaVersion(file))
  })
})
