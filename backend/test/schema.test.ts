import assert from 'node:assert/strict'
import { after, beforeEach, describe, it } from 'node:test'
import { disposeDatabase, freshDatabase } from './helpers/database.mjs'

/**
 * Ràng buộc ở tầng DB — lưới an toàn cuối. Các ca này ghi **thẳng bằng SQL**, bỏ qua
 * Service, để chứng minh dữ liệu hỏng không lọt được vào file DB kể cả khi tầng trên có bug.
 */

let db

beforeEach(async () => {
  db = await freshDatabase()
})

after(disposeDatabase)

const TIMESTAMP = '2026-09-13T00:00:00.000Z'

function seedZoneFamilyPerson() {
  db.prepare(
    'INSERT INTO zones (id, name, name_ascii, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).run('z1', 'Giáo họ A', 'giao ho a', TIMESTAMP, TIMESTAMP)

  db.prepare(
    'INSERT INTO families (id, zone_id, name, name_ascii, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?)',
  ).run('f1', 'z1', 'Hộ A', 'ho a', TIMESTAMP, TIMESTAMP)

  db.prepare(
    'INSERT INTO families (id, zone_id, name, name_ascii, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?, ?)',
  ).run('f2', 'z1', 'Hộ B', 'ho b', TIMESTAMP, TIMESTAMP)

  db.prepare(
    'INSERT INTO persons (id, full_name, full_name_ascii, created_at, updated_at)' +
      ' VALUES (?, ?, ?, ?, ?)',
  ).run('p1', 'Nguyễn Văn A', 'nguyen van a', TIMESTAMP, TIMESTAMP)
}

function insertMember(id, familyId, personId, relationship, fromDate, toDate = null) {
  db.prepare(
    'INSERT INTO family_members (id, family_id, person_id, relationship, from_date, to_date,' +
      ' created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, familyId, personId, relationship, fromDate, toDate, TIMESTAMP, TIMESTAMP)
}

describe('001_init.sql — ràng buộc tầng DB', () => {
  it('bật khoá ngoại: chèn hộ với giáo họ không tồn tại bị chặn', () => {
    assert.equal(db.pragma('foreign_keys', { simple: true }), 1)

    assert.throws(
      () =>
        db
          .prepare(
            'INSERT INTO families (id, zone_id, name, name_ascii, created_at, updated_at)' +
              ' VALUES (?, ?, ?, ?, ?, ?)',
          )
          .run('f9', 'khong-ton-tai', 'Hộ ma', 'ho ma', TIMESTAMP, TIMESTAMP),
      (error) => error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY',
    )
  })

  it('mỗi người chỉ được một hộ hiện hành (uq_family_members_current)', () => {
    seedZoneFamilyPerson()
    insertMember('m1', 'f1', 'p1', 'head', '2010-01-01')

    assert.throws(
      () => insertMember('m2', 'f2', 'p1', 'child', '2020-01-01'),
      (error) => error.code === 'SQLITE_CONSTRAINT_UNIQUE',
    )
  })

  it('mỗi hộ chỉ được một chủ hộ đang tại vị (uq_family_members_head)', () => {
    seedZoneFamilyPerson()
    db.prepare(
      'INSERT INTO persons (id, full_name, full_name_ascii, created_at, updated_at)' +
        ' VALUES (?, ?, ?, ?, ?)',
    ).run('p2', 'Trần Thị B', 'tran thi b', TIMESTAMP, TIMESTAMP)

    insertMember('m1', 'f1', 'p1', 'head', '2010-01-01')

    assert.throws(
      () => insertMember('m2', 'f1', 'p2', 'head', '2011-01-01'),
      (error) => error.code === 'SQLITE_CONSTRAINT_UNIQUE',
    )
  })

  it('đóng dòng cũ rồi mở dòng mới thì không vi phạm ràng buộc', () => {
    seedZoneFamilyPerson()
    insertMember('m1', 'f1', 'p1', 'head', '2010-01-01')

    db.prepare('UPDATE family_members SET to_date = ? WHERE id = ?').run('2024-03-15', 'm1')
    insertMember('m2', 'f2', 'p1', 'child', '2024-03-15')

    const current = db
      .prepare(
        'SELECT COUNT(*) AS total FROM family_members' +
          ' WHERE person_id = ? AND to_date IS NULL AND deleted_at IS NULL',
      )
      .get('p1').total

    assert.equal(current, 1)
  })

  it('to_date trước from_date bị CHECK chặn', () => {
    seedZoneFamilyPerson()

    assert.throws(
      () => insertMember('m1', 'f1', 'p1', 'head', '2020-01-01', '2019-01-01'),
      (error) => error.code === 'SQLITE_CONSTRAINT_CHECK',
    )
  })

  it('tên giáo họ không trùng trong số bản ghi còn sống, nhưng xoá mềm rồi thì dùng lại được', () => {
    db.prepare(
      'INSERT INTO zones (id, name, name_ascii, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).run('z1', 'Giáo họ A', 'giao ho a', TIMESTAMP, TIMESTAMP)

    assert.throws(
      () =>
        db
          .prepare(
            'INSERT INTO zones (id, name, name_ascii, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          )
          .run('z2', 'Giáo họ A', 'giao ho a', TIMESTAMP, TIMESTAMP),
      (error) => error.code === 'SQLITE_CONSTRAINT_UNIQUE',
    )

    db.prepare('UPDATE zones SET deleted_at = ? WHERE id = ?').run(TIMESTAMP, 'z1')

    db.prepare(
      'INSERT INTO zones (id, name, name_ascii, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).run('z2', 'Giáo họ A', 'giao ho a', TIMESTAMP, TIMESTAMP)

    assert.equal(
      db.prepare('SELECT COUNT(*) AS total FROM zones WHERE deleted_at IS NULL').get().total,
      1,
    )
  })

  it('giới tính ngoài danh sách bị CHECK chặn', () => {
    assert.throws(
      () =>
        db
          .prepare(
            'INSERT INTO persons (id, full_name, full_name_ascii, gender, created_at, updated_at)' +
              ' VALUES (?, ?, ?, ?, ?, ?)',
          )
          .run('p9', 'X', 'x', 'khac', TIMESTAMP, TIMESTAMP),
      (error) => error.code === 'SQLITE_CONSTRAINT_CHECK',
    )
  })

  it('dấu nháy đơn và emoji lưu rồi đọc lại nguyên vẹn', () => {
    const note = "Ghi chú của O'Brien — 😀 gia đình 5 người"

    db.prepare(
      'INSERT INTO zones (id, name, name_ascii, note, created_at, updated_at)' +
        ' VALUES (?, ?, ?, ?, ?, ?)',
    ).run('z1', "Giáo họ O'Brien", "giao ho o'brien", note, TIMESTAMP, TIMESTAMP)

    const row = db.prepare('SELECT name, note FROM zones WHERE id = ?').get('z1')

    assert.equal(row.name, "Giáo họ O'Brien")
    assert.equal(row.note, note)
  })
})
