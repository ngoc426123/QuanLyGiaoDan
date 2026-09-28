import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { freshDatabase, disposeDatabase } from './helpers/database.mjs'
import { seedDefaultSettings, seedSuggestionItems } from '#/db/seed.ts'
import { suggestionListSchema, suggestionCreateSchema, suggestionUpdateSchema } from '#/schemas/suggestion.schema.ts'
import * as suggestionService from '#/services/suggestion.service.ts'

const timestamp = '2026-09-28T00:00:00.000Z'

describe('suggestion.service', () => {
  beforeEach(async () => {
    const db = await freshDatabase()
    seedDefaultSettings(db, timestamp)
    seedSuggestionItems(db, timestamp)
  })
  afterEach(disposeDatabase)

  it('seed sẵn danh sách tên thánh và nơi sinh', () => {
    const holyNames = suggestionService.list(suggestionListSchema.parse({ category: 'holy_name' }))
    const birthPlaces = suggestionService.list(suggestionListSchema.parse({ category: 'birth_place' }))
    assert.ok(holyNames.meta.total > 20)
    assert.ok(birthPlaces.meta.total > 50)
    assert.equal(holyNames.data[0].category, 'holy_name')
  })

  it('CRUD, tìm không dấu và chống trùng', () => {
    const input = suggestionCreateSchema.parse({ category: 'diocese', value: 'Giáo phận Hà Nội' })
    const created = suggestionService.create(input)
    assert.equal(created.value, 'Giáo phận Hà Nội')
    assert.equal(suggestionService.list({ category: 'diocese', search: 'ha noi' }).meta.total, 1)
    assert.throws(() => suggestionService.create(input), { code: 'CONFLICT' })

    const updated = suggestionService.update(suggestionUpdateSchema.parse({
      id: created.id,
      expectedUpdatedAt: created.updatedAt,
      patch: { value: 'Giáo phận Sài Gòn' },
    }))
    assert.equal(updated.value, 'Giáo phận Sài Gòn')
    assert.deepEqual(suggestionService.remove({ id: created.id }), { id: created.id })
    assert.equal(suggestionService.list({ category: 'diocese' }).meta.total, 0)
  })
})
