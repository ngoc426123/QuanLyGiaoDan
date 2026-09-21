import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3-multiple-ciphers'
import { configureSqlCipher, isPlaintextSqliteDatabase, rekeySqlCipher } from '#/db/encryption.ts'
import { exportDatabase, inspectDatabaseFile } from '#/db/transfer.ts'

const databasePassword = 'mat-khau-du-lieu-2026'
const backupPassword = 'mat-khau-backup-rieng-2026'

describe('mã hóa cơ sở dữ liệu', () => {
  it('mở đúng mật khẩu, từ chối mật khẩu sai và đổi khóa backup độc lập', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'elecrusion-encryption-'))
    const databaseFile = join(directory, 'app.db')

    try {
      const writer = new Database(databaseFile)
      configureSqlCipher(writer, databasePassword)
      writer.exec(`
        CREATE TABLE families (deleted_at TEXT);
        CREATE TABLE family_members (deleted_at TEXT);
        CREATE TABLE persons (deleted_at TEXT);
        CREATE TABLE settings (deleted_at TEXT);
        CREATE TABLE zones (deleted_at TEXT);
        CREATE TABLE secrets (value TEXT);
        INSERT INTO secrets VALUES ('đã mã hóa');
      `)
      writer.close()

      assert.equal(isPlaintextSqliteDatabase(databaseFile), false)

      const reader = new Database(databaseFile, { readonly: true })
      configureSqlCipher(reader, databasePassword)
      assert.equal(reader.prepare('SELECT value FROM secrets').get().value, 'đã mã hóa')
      reader.close()

      const exportedFile = join(directory, 'backup-rieng.db')
      const exported = new Database(databaseFile)
      configureSqlCipher(exported, databasePassword)
      await exportDatabase(exported, exportedFile, {
        sourcePassword: databasePassword,
        backupPassword,
      })
      exported.close()

      const backupReader = new Database(exportedFile, { readonly: true })
      configureSqlCipher(backupReader, backupPassword)
      assert.equal(backupReader.prepare('SELECT value FROM secrets').get().value, 'đã mã hóa')
      backupReader.close()
      assert.equal(inspectDatabaseFile(exportedFile, backupPassword).sizeBytes > 0, true)

      const wrongPassword = new Database(databaseFile, { readonly: true })
      configureSqlCipher(wrongPassword, 'mat-khau-khong-dung-2026')
      assert.throws(() => wrongPassword.prepare('SELECT value FROM secrets').get())
      wrongPassword.close()

      const backup = new Database(databaseFile)
      configureSqlCipher(backup, databasePassword)
      rekeySqlCipher(backup, backupPassword)
      backup.close()

      const rekeyed = new Database(databaseFile, { readonly: true })
      configureSqlCipher(rekeyed, backupPassword)
      assert.equal(rekeyed.prepare('SELECT value FROM secrets').get().value, 'đã mã hóa')
      rekeyed.close()
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
