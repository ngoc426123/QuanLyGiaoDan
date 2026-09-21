import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { after, describe, it } from 'node:test'
import Database from 'better-sqlite3-multiple-ciphers'

const directory = mkdtempSync(join(tmpdir(), 'elecrusion-durability-'))

after(() => rmSync(directory, { recursive: true, force: true }))

describe('độ bền WAL khi tiến trình bị dừng lúc đang ghi', () => {
  it('mở lại được DB và bỏ transaction chưa commit', async () => {
    const databaseFile = join(directory, 'app.db')
    const writer = spawn(
      process.execPath,
      [join(import.meta.dirname, 'helpers/transaction-writer.mjs'), databaseFile],
      {
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      },
    )

    await once(writer, 'message')
    writer.kill('SIGKILL')
    await once(writer, 'exit')

    const database = new Database(databaseFile)
    try {
      assert.equal(database.pragma('integrity_check', { simple: true }), 'ok')
      assert.equal(
        database.prepare('SELECT COUNT(*) AS total FROM durability_records').get().total,
        0,
      )
    } finally {
      database.close()
    }
  })
})
