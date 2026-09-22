import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import {
  migrateLegacyUserDataDirectory,
  USER_DATA_DIRECTORY_NAME,
} from '#/main/user-data-directory.ts'

const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe('đổi thư mục AppData khi đổi tên ứng dụng', () => {
  it('chuyển toàn bộ dữ liệu Elecrusion sang thư mục tên mới một lần', () => {
    const appDataDirectory = mkdtempSync(join(tmpdir(), 'quan-ly-giao-dan-app-data-'))
    directories.push(appDataDirectory)
    const legacyDirectory = join(appDataDirectory, 'elecrusion')
    const userDataDirectory = join(appDataDirectory, USER_DATA_DIRECTORY_NAME)
    mkdirSync(join(legacyDirectory, 'data'), { recursive: true })
    writeFileSync(join(legacyDirectory, 'data', 'app.db'), 'database')

    assert.equal(migrateLegacyUserDataDirectory(appDataDirectory, userDataDirectory), true)
    assert.equal(existsSync(legacyDirectory), false)
    assert.equal(existsSync(join(userDataDirectory, 'data', 'app.db')), true)
  })

  it('không đụng dữ liệu khi thư mục tên mới đã tồn tại', () => {
    const appDataDirectory = mkdtempSync(join(tmpdir(), 'quan-ly-giao-dan-app-data-'))
    directories.push(appDataDirectory)
    const legacyDirectory = join(appDataDirectory, 'elecrusion')
    const userDataDirectory = join(appDataDirectory, USER_DATA_DIRECTORY_NAME)
    mkdirSync(legacyDirectory)
    mkdirSync(userDataDirectory)

    assert.equal(migrateLegacyUserDataDirectory(appDataDirectory, userDataDirectory), false)
    assert.equal(existsSync(legacyDirectory), true)
  })
})
