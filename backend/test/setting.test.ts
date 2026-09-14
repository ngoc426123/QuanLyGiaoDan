import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { freshDatabase, disposeDatabase } from './helpers/database.mjs'
import { seedDefaultSettings } from '#/db/seed.ts'
import { settingGetAllSchema, settingSetSchema } from '#/schemas/setting.schema.ts'
import { getAll, setValue } from '#/services/setting.service.ts'

describe('Cấu hình giao diện qua schema → Service → SQLite', () => {
  beforeEach(async () => seedDefaultSettings(await freshDatabase(), '2026-09-13T00:00:00.000Z'))
  afterEach(disposeDatabase)

  it('đọc giá trị JSON đúng kiểu, lưu theme và density vào schema thật', () => {
    assert.equal(getAll()['ui.theme'], 'system')
    assert.equal(getAll()['data.autoBackup'], true)
    assert.deepEqual(setValue(settingSetSchema.parse({ key: 'ui.theme', value: 'dark' })), {
      key: 'ui.theme',
      value: 'dark',
    })
    setValue(settingSetSchema.parse({ key: 'ui.density', value: 'compact' }))
    assert.equal(getAll()['ui.theme'], 'dark')
    assert.equal(getAll()['ui.density'], 'compact')
  })

  it('từ chối khoá lạ, ngôn ngữ khác, giá trị sai kiểu và thuộc tính thừa', () => {
    for (const input of [
      { key: 'general.language', value: 'en' },
      { key: 'ui.theme', value: true },
      { key: 'ui.theme', value: 'dark', extra: true },
      { key: 'unknown', value: 'dark' },
      { key: 'data.autoBackup', value: false },
    ])
      assert.equal(settingSetSchema.safeParse(input).success, false)
    assert.equal(settingGetAllSchema.safeParse({}).success, false)
    assert.equal(getAll()['ui.theme'], 'system')
  })

  it('không tự tạo khoá, không thay dữ liệu khi khoá không tồn tại', () => {
    assert.throws(() => setValue({ key: 'missing', value: 'dark' }), { code: 'NOT_FOUND' })
    assert.equal(Object.hasOwn(getAll(), 'missing'), false)
  })
})
