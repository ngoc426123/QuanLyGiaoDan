import assert from 'node:assert/strict'
import { after, beforeEach, describe, it } from 'node:test'
import { getDatabase } from '#/db/connection.ts'
import * as familyService from '#/services/family.service.ts'
import * as personService from '#/services/person.service.ts'
import * as zoneService from '#/services/zone.service.ts'
import { disposeDatabase, freshDatabase } from './helpers/database.mjs'

let zoneId: string
let familyId: string

beforeEach(async () => {
  await freshDatabase()
  const zone = zoneService.create({ name: 'Giáo họ hiệu năng' })
  const family = familyService.create({ zoneId: zone.id, name: 'Hộ hiệu năng' })
  personService.create({
    fullName: 'Nguyễn Văn An',
    family: { familyId: family.id, relationship: 'head', fromDate: '2020-01-01' },
  })
  zoneId = zone.id
  familyId = family.id
})

after(disposeDatabase)

function plan(sql: string, params: unknown[]) {
  return getDatabase()
    .prepare(`EXPLAIN QUERY PLAN ${sql}`)
    .all(...params)
    .map((row: { detail: string }) => row.detail)
}

function hasFullScan(details: string[], table: string) {
  return details.some((detail) => new RegExp(`SCAN ${table}(?:\\s|$)`, 'i').test(detail))
}

describe('kế hoạch truy vấn nóng', () => {
  it('lọc giáo dân theo giáo họ không quét bảng persons', () => {
    const details = plan(
      'SELECT p.id FROM persons p' +
        ' LEFT JOIN family_members fm ON fm.person_id = p.id AND fm.deleted_at IS NULL AND fm.to_date IS NULL' +
        ' LEFT JOIN families f ON f.id = fm.family_id AND f.deleted_at IS NULL' +
        ' LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL' +
        ' WHERE p.deleted_at IS NULL AND z.id = ? ORDER BY p.given_name_ascii ASC LIMIT 50',
      [zoneId],
    )

    assert.equal(hasFullScan(details, 'persons'), false, details.join('\n'))
  })

  it('đọc thành viên hộ dùng chỉ mục family_members', () => {
    const details = plan(
      'SELECT fm.id FROM family_members fm JOIN persons p ON p.id = fm.person_id' +
        ' WHERE fm.family_id = ? AND fm.deleted_at IS NULL AND fm.to_date IS NULL',
      [familyId],
    )

    assert.equal(hasFullScan(details, 'family_members'), false, details.join('\n'))
  })

  it('tìm kiếm FTS không quét bảng persons', () => {
    const details = plan(
      'SELECT p.id FROM persons_fts JOIN persons p ON p.rowid = persons_fts.rowid' +
        ' WHERE persons_fts MATCH ? AND p.deleted_at IS NULL ORDER BY bm25(persons_fts) LIMIT 50',
      ['nguyen'],
    )

    assert.equal(hasFullScan(details, 'persons'), false, details.join('\n'))
  })

  it('lọc sinh nhật theo tháng dùng chỉ mục biểu thức của Dashboard', () => {
    const details = plan(
      'SELECT p.id FROM persons p WHERE p.deleted_at IS NULL AND p.death_date IS NULL' +
        ' AND p.birth_date IS NOT NULL AND substr(p.birth_date, 6, 2) = ?' +
        ' ORDER BY substr(p.birth_date, 9, 2) ASC LIMIT 12',
      ['09'],
    )

    assert.ok(
      details.some((detail) => detail.includes('idx_persons_birth_month')),
      details.join('\n'),
    )
  })
})
