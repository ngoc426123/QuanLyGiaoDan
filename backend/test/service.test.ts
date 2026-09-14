import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { after, beforeEach, describe, it } from 'node:test'
import * as familyMemberService from '#/services/family-member.service.ts'
import * as familyService from '#/services/family.service.ts'
import * as personService from '#/services/person.service.ts'
import * as reportService from '#/services/report.service.ts'
import * as searchService from '#/services/search.service.ts'
import * as trashService from '#/services/trash.service.ts'
import * as csvImportService from '#/services/csv-import.service.ts'
import * as dataService from '#/services/data.service.ts'
import * as zoneService from '#/services/zone.service.ts'
import { disposeDatabase, freshDatabase } from './helpers/database.mjs'

/**
 * Nghiệp vụ tầng Service, chạy trên SQLite `:memory:` với schema thật.
 *
 * Lệch với `plan/phase-2-data-layer.md` §2.9 (bảng đó ghi "Service: mock Repository"):
 * các quy tắc cần kiểm ở đây — đúng một hộ hiện hành, rollback giữa chừng, xoá mềm kéo
 * theo — **không tách rời được** khỏi ràng buộc và transaction của DB. Mock Repository sẽ
 * kiểm chứng một thứ khác với thứ chạy thật. Ngoại lệ ghi ở `project/decisions.md` §4.
 */

let db

beforeEach(async () => {
  db = await freshDatabase()
})

after(disposeDatabase)

/** Bộ dữ liệu tối thiểu: một giáo họ, hai hộ. */
function seed() {
  const zone = zoneService.create({ name: 'Giáo họ Thánh Tâm' })
  const familyA = familyService.create({ zoneId: zone.id, name: 'Hộ A' })
  const familyB = familyService.create({ zoneId: zone.id, name: 'Hộ B' })

  return { zone, familyA, familyB }
}

const codeIs = (code) => (error) => error.code === code

describe('person.service', () => {
  it('tạo người và gán vào hộ trong cùng một transaction', () => {
    const { familyA } = seed()

    const { data: person } = personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })

    const rows = db
      .prepare('SELECT id, to_date FROM family_members WHERE person_id = ? AND deleted_at IS NULL')
      .all(person.id)

    assert.equal(rows.length, 1)
    assert.equal(rows[0].to_date, null)
    assert.equal(person.familyName, 'Hộ A')
  })

  it('chuẩn hoá tên: cắt khoảng trắng thừa và sinh cột không dấu', () => {
    const { data: person } = personService.create({ fullName: '  Nguyễn Văn An  ' })

    assert.equal(person.fullName, 'Nguyễn Văn An')
    assert.equal(person.fullNameAscii, 'nguyen van an')
  })

  it('tên gõ bằng tổ hợp Unicode NFD lưu về NFC, so sánh bằng bản NFC', () => {
    const nfd = 'Nguyễn Văn Ế'.normalize('NFD')
    assert.notEqual(nfd, 'Nguyễn Văn Ế')

    const { data: person } = personService.create({ fullName: nfd })

    assert.equal(person.fullName, 'Nguyễn Văn Ế'.normalize('NFC'))
    assert.equal(person.fullNameAscii, 'nguyen van e')
  })

  it('tìm kiếm không dấu khớp tên có dấu', () => {
    personService.create({ fullName: 'Nguyễn Văn Ánh' })

    const { data } = personService.list({ search: 'nguyen van anh' })

    assert.equal(data.length, 1)
    assert.equal(data[0].fullName, 'Nguyễn Văn Ánh')
  })

  it('ngày qua đời trước ngày sinh bị từ chối', () => {
    assert.throws(
      () =>
        personService.create({
          fullName: 'Lê Văn Tí',
          birthDate: '2000-01-01',
          deathDate: '1999-01-01',
        }),
      codeIs('VALIDATION_ERROR'),
    )
  })

  it('ngày bí tích sai thứ tự chỉ cảnh báo, không chặn', () => {
    const result = personService.create({
      fullName: 'Phạm Thị Hoa',
      baptismDate: '2005-01-01',
      firstCommunionDate: '2004-01-01',
    })

    assert.ok(result.data.id)
    assert.deepEqual(result.meta.warnings, ['Ngày rước lễ lần đầu đang trước ngày rửa tội'])
  })

  it('sắp xếp theo tên gọi đúng bảng chữ cái tiếng Việt', () => {
    for (const givenName of ['Bé', 'Ánh', 'Cường', 'Đức']) {
      personService.create({ fullName: 'Nguyễn Văn ' + givenName, givenName })
    }

    const { data } = personService.list({ sortBy: 'givenName', sortDir: 'asc' })

    // Sắp trên cột có dấu (collation BINARY) sẽ ra Bé, Cường, Ánh, Đức — sai.
    assert.deepEqual(
      data.map((person) => person.givenName),
      ['Ánh', 'Bé', 'Cường', 'Đức'],
    )
  })

  it('không có tên gọi thì cột sắp xếp là null, không phải chuỗi rỗng', () => {
    const { data: person } = personService.create({ fullName: 'Nguyễn Văn An' })

    assert.equal(person.givenName, null)
    assert.equal(person.givenNameAscii, null)
  })

  it('sửa với expectedUpdatedAt cũ trả CONFLICT kèm bản ghi mới nhất', () => {
    const { data: person } = personService.create({ fullName: 'Nguyễn Văn An' })

    assert.throws(
      () =>
        personService.update({
          id: person.id,
          expectedUpdatedAt: '2020-01-01T00:00:00.000Z',
          patch: { note: 'ghi đè' },
        }),
      (error) => error.code === 'CONFLICT' && error.details.currentRecord.id === person.id,
    )
  })

  it('xoá mềm người thì dòng thành viên hiện hành cũng bị xoá mềm', () => {
    const { familyA } = seed()
    const { data: person } = personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })

    personService.remove({ id: person.id })

    const alive = db
      .prepare(
        'SELECT COUNT(*) AS total FROM family_members WHERE person_id = ? AND deleted_at IS NULL',
      )
      .get(person.id).total

    assert.equal(alive, 0)
    assert.equal(personService.list({}).data.length, 0)
  })

  it('xoá một id đã xoá vẫn thành công (idempotent)', () => {
    const { data: person } = personService.create({ fullName: 'Nguyễn Văn An' })

    personService.remove({ id: person.id })
    assert.deepEqual(personService.remove({ id: person.id }), { id: person.id })
  })
})

describe('family-member.service', () => {
  it('gán người đã có hộ hiện hành vào hộ thứ hai bị chặn', () => {
    const { familyA, familyB } = seed()
    const { data: person } = personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })

    assert.throws(
      () =>
        familyMemberService.add({
          familyId: familyB.id,
          personId: person.id,
          relationship: 'child',
          fromDate: '2020-01-01',
        }),
      codeIs('CONFLICT'),
    )
  })

  it('gán chủ hộ thứ hai cho cùng một hộ bị chặn', () => {
    const { familyA } = seed()
    personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })
    const { data: second } = personService.create({ fullName: 'Trần Thị Bé' })

    assert.throws(
      () =>
        familyMemberService.add({
          familyId: familyA.id,
          personId: second.id,
          relationship: 'head',
          fromDate: '2012-01-01',
        }),
      codeIs('CONFLICT'),
    )
  })

  it('chuyển hộ: đóng dòng cũ, mở dòng mới, đúng một dòng hiện hành', () => {
    const { familyA, familyB } = seed()
    const { data: person } = personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })

    const result = familyMemberService.move({
      personId: person.id,
      toFamilyId: familyB.id,
      relationship: 'child',
      moveDate: '2024-03-15',
    })

    assert.equal(result.closed.toDate, '2024-03-15')
    assert.equal(result.opened.isCurrent, true)
    assert.equal(result.opened.familyId, familyB.id)

    const rows = db
      .prepare('SELECT to_date FROM family_members WHERE person_id = ? AND deleted_at IS NULL')
      .all(person.id)

    assert.equal(rows.length, 2)
    assert.equal(rows.filter((row) => row.to_date === null).length, 1)
  })

  it('chuyển hộ hỏng giữa chừng thì rollback, dòng cũ vẫn hiện hành', () => {
    const { familyA, familyB } = seed()
    const { data: person } = personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })

    // Hộ đích đã có chủ hộ -> openMembership ném lỗi SAU khi dòng cũ đã bị đóng.
    const { data: headOfB } = personService.create({ fullName: 'Trần Thị Bé' })
    familyMemberService.add({
      familyId: familyB.id,
      personId: headOfB.id,
      relationship: 'head',
      fromDate: '2011-01-01',
    })

    assert.throws(
      () =>
        familyMemberService.move({
          personId: person.id,
          toFamilyId: familyB.id,
          relationship: 'head',
          moveDate: '2024-03-15',
        }),
      codeIs('CONFLICT'),
    )

    const current = db
      .prepare(
        'SELECT family_id, to_date FROM family_members' +
          ' WHERE person_id = ? AND deleted_at IS NULL AND to_date IS NULL',
      )
      .all(person.id)

    assert.equal(current.length, 1)
    assert.equal(current[0].family_id, familyA.id)
  })

  it('ngày chuyển hộ trước ngày vào hộ hiện tại bị từ chối', () => {
    const { familyA, familyB } = seed()
    const { data: person } = personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })

    assert.throws(
      () =>
        familyMemberService.move({
          personId: person.id,
          toFamilyId: familyB.id,
          relationship: 'child',
          moveDate: '2009-01-01',
        }),
      (error) =>
        error.code === 'VALIDATION_ERROR' &&
        error.details.fieldErrors.moveDate ===
          'Ngày chuyển hộ không được trước ngày vào hộ cũ (01/01/2010)',
    )
  })
})

describe('zone.service / family.service', () => {
  it('xoá giáo họ còn hộ bị chặn', () => {
    const { zone } = seed()

    assert.throws(() => zoneService.remove({ id: zone.id }), codeIs('FOREIGN_KEY_VIOLATION'))
  })

  it('xoá hộ còn thành viên bị chặn, kèm số thành viên', () => {
    const { familyA } = seed()
    personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })

    assert.throws(
      () => familyService.remove({ id: familyA.id }),
      (error) => error.code === 'CONFLICT' && error.details.memberCount === 1,
    )
  })

  it('trùng tên giáo họ bị chặn bằng thông điệp tiếng Việt trước khi DB ném ràng buộc', () => {
    seed()

    assert.throws(
      () => zoneService.create({ name: 'Giáo họ Thánh Tâm' }),
      (error) => error.code === 'CONFLICT' && error.details.fieldErrors.name.length > 0,
    )
  })

  it('tên chỉ gồm khoảng trắng bị từ chối sau khi chuẩn hoá', () => {
    assert.throws(() => zoneService.create({ name: '   ' }), codeIs('VALIDATION_ERROR'))
  })

  it('danh sách giáo họ kèm số hộ và số giáo dân, không truy vấn lặp', () => {
    const { familyA } = seed()
    personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })

    const { data, meta } = zoneService.list({})

    assert.equal(meta.total, 1)
    assert.equal(data[0].familyCount, 2)
    assert.equal(data[0].personCount, 1)
  })

  it('dấu % người dùng gõ được escape, không biến thành ký tự đại diện', () => {
    zoneService.create({ name: 'Giáo họ 100%' })
    zoneService.create({ name: 'Giáo họ Khác' })

    assert.equal(zoneService.list({ search: '100%' }).data.length, 1)

    // Escape đúng thì '%' là ký tự thường: chỉ khớp bản ghi CÓ CHỨA dấu phần trăm.
    // Không escape thì nó là ký tự đại diện và trả về cả hai.
    assert.equal(zoneService.list({ search: '%' }).data.length, 1)
    assert.equal(zoneService.list({ search: '_' }).data.length, 0)
  })

  it('phân trang: trang 2 trả đúng phần còn lại', () => {
    for (const name of ['Giáo họ A', 'Giáo họ B', 'Giáo họ C']) zoneService.create({ name })

    const page1 = zoneService.list({ page: 1, pageSize: 2 })
    const page2 = zoneService.list({ page: 2, pageSize: 2 })

    assert.equal(page1.data.length, 2)
    assert.equal(page2.data.length, 1)
    assert.equal(page1.meta.total, 3)
    assert.deepEqual(
      [...page1.data, ...page2.data].map((zone) => zone.name),
      ['Giáo họ A', 'Giáo họ B', 'Giáo họ C'],
    )
  })

  it('sắp xếp giáo họ đúng bảng chữ cái tiếng Việt', () => {
    for (const name of ['Giáo họ Bến Tre', 'Giáo họ Ân Phú', 'Giáo họ Cửa Lò', 'Giáo họ Đông Hà']) {
      zoneService.create({ name })
    }

    // Sắp trên cột có dấu sẽ ra Bến Tre, Cửa Lò, Ân Phú, Đông Hà — sai.
    assert.deepEqual(
      zoneService.list({}).data.map((zone) => zone.name),
      ['Giáo họ Ân Phú', 'Giáo họ Bến Tre', 'Giáo họ Cửa Lò', 'Giáo họ Đông Hà'],
    )
  })

  it('tìm giáo họ và hộ bằng từ khoá không dấu', () => {
    const zone = zoneService.create({ name: 'Giáo họ Đông Hà' })
    familyService.create({ zoneId: zone.id, name: 'Hộ ông Nguyễn Văn Ánh' })

    assert.equal(zoneService.list({ search: 'dong ha' }).data.length, 1)
    assert.equal(familyService.list({ search: 'nguyen van anh' }).data.length, 1)
  })

  it('đổi tên thì cột bỏ dấu được sinh lại theo', () => {
    const zone = zoneService.create({ name: 'Giáo họ Cũ' })

    const updated = zoneService.update({
      id: zone.id,
      expectedUpdatedAt: zone.updatedAt,
      patch: { name: 'Giáo họ Đức Mẹ' },
    })

    assert.equal(updated.nameAscii, 'giao ho duc me')
    assert.equal(zoneService.list({ search: 'duc me' }).data.length, 1)
    assert.equal(zoneService.list({ search: 'cu' }).data.length, 0)
  })

  it('pageSize vượt trần bị kẹp về 200', () => {
    seed()

    const { meta } = zoneService.list({ pageSize: 5000 })

    assert.equal(meta.pageSize, 200)
  })
})

describe('report.service', () => {
  it('xuất CSV có BOM, giữ tiếng Việt và chặn công thức bảng tính', () => {
    const { familyA } = seed()
    personService.create({
      fullName: 'Nguyễn, "Văn" An',
      note: '=SUM(A1:A2)',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })
    const directory = mkdtempSync(join(tmpdir(), 'elecrusion-report-'))
    const filePath = join(directory, 'danh-sach.csv')

    try {
      const result = reportService.exportCsv({ report: 'persons', filter: {}, filePath })
      const content = readFileSync(filePath, 'utf8')

      assert.equal(result.rowCount, 1)
      assert.equal(content.codePointAt(0), 0xfeff)
      assert.match(content, /"Nguyễn, ""Văn"" An"/)
      assert.match(content, /"'=SUM\(A1:A2\)"/)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})

describe('search.service', () => {
  it('tìm FTS không dấu trên tên, tên thánh, địa chỉ và dữ liệu Unicode NFD', () => {
    const zone = zoneService.create({ name: 'Giáo họ Đức Mẹ' })
    const family = familyService.create({
      zoneId: zone.id,
      name: 'Hộ Nguyễn',
      address: 'Đường Nguyễn Huệ',
    })
    const { data: person } = personService.create({ fullName: 'Nguyễn Văn An', holyName: 'Giuse' })

    assert.equal(searchService.query('nguyen van an')[0].id, person.id)
    assert.equal(
      searchService.query('NGUYEN').some((row: any) => row.id === person.id),
      true,
    )
    assert.equal(searchService.query('giuse')[0].id, person.id)
    assert.equal(
      searchService.query('Nguyễn'.normalize('NFD')).some((row: any) => row.id === person.id),
      true,
    )
    assert.equal(searchService.query('nguyen hue')[0].id, family.id)
  })

  it('cập nhật bản ghi thì chỉ mục FTS cũng cập nhật', () => {
    const { data: person } = personService.create({ fullName: 'Tên cũ' })
    personService.update({
      id: person.id,
      expectedUpdatedAt: person.updatedAt,
      patch: { fullName: 'Tên mới' },
    })

    assert.equal(searchService.query('cu').length, 0)
    assert.equal(searchService.query('moi')[0].id, person.id)
  })
})

describe('trash.service', () => {
  it('khôi phục người không khôi phục dòng thành viên hộ đã xoá mềm', () => {
    const { familyA } = seed()
    const { data: person } = personService.create({
      fullName: 'Nguyễn Văn An',
      family: { familyId: familyA.id, relationship: 'head', fromDate: '2010-01-01' },
    })
    personService.remove({ id: person.id })

    trashService.restore({ type: 'person', id: person.id })

    assert.equal(personService.getById(person.id).currentMembership, null)
  })

  it('chặn khôi phục hộ khi giáo họ nguồn chưa được khôi phục', () => {
    const zone = zoneService.create({ name: 'Giáo họ đã xoá' })
    const family = familyService.create({ zoneId: zone.id, name: 'Hộ đã xoá' })
    familyService.remove({ id: family.id })
    zoneService.remove({ id: zone.id })

    assert.throws(() => trashService.restore({ type: 'family', id: family.id }), codeIs('CONFLICT'))
  })
})

describe('csv-import.service', () => {
  it('nhập đủ dữ liệu mẫu trong một transaction', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'elecrusion-csv-import-'))
    const filePath = join(directory, 'du-lieu-kiem-thu-nhap-1200.csv')
    const headers = [
      'Giáo họ',
      'Tên hộ',
      'Địa chỉ',
      'Họ tên',
      'Tên gọi',
      'Tên thánh',
      'Giới tính',
      'Ngày sinh',
      'Ngày rửa tội',
      'Ngày rước lễ lần đầu',
      'Ngày thêm sức',
      'Ngày hôn phối',
      'Số điện thoại',
      'Ghi chú',
      'Quan hệ',
      'Ngày vào hộ',
    ]
    const rows = Array.from({ length: 1200 }, (_, index) => {
      const family = Math.floor(index / 4) + 1
      return [
        `Giáo họ ${((family - 1) % 15) + 1}`,
        `Hộ ${family}`,
        `Địa chỉ ${family}`,
        `Giáo dân ${index + 1}`,
        `Dân ${index + 1}`,
        '',
        index % 2 === 0 ? 'Nam' : 'Nữ',
        `19${String(60 + (index % 40)).padStart(2, '0')}-01-01`,
        '',
        '',
        '',
        '',
        '',
        '',
        ['Chủ hộ', 'Vợ/Chồng', 'Con', 'Con'][index % 4],
        '2020-01-01',
      ]
    })
    writeFileSync(filePath, [headers, ...rows].map((row) => row.join(',')).join('\n'), 'utf8')

    try {
      const result = csvImportService.importCsv({ filePath })

      assert.equal(result.rowCount, 1200)
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM zones').get().total, 15)
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM families').get().total, 300)
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM persons').get().total, 1200)
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM family_members').get().total, 1200)
      assert.throws(
        () => csvImportService.importCsv({ filePath }),
        (error) => error.code === 'CONFLICT' && error.details.duplicateCount === 1200,
      )
      dataService.clearAll()
      assert.equal(csvImportService.importCsv({ filePath }).rowCount, 1200)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})

describe('thao tác hàng loạt và xoá dữ liệu', () => {
  it('chuyển 100 giáo dân trong một lần và xoá mềm cả nhóm', () => {
    const { familyA, familyB } = seed()
    const ids = Array.from(
      { length: 100 },
      (_, index) =>
        personService.create({
          fullName: `Giáo dân ${index}`,
          family: { familyId: familyA.id, relationship: 'other', fromDate: '2020-01-01' },
        }).data.id,
    )

    const moved = personService.bulkMove({
      ids,
      familyId: familyB.id,
      relationship: 'other',
      moveDate: '2021-01-01',
    })
    assert.equal(moved.count, 100)
    assert.equal(
      db
        .prepare(
          'SELECT COUNT(*) AS total FROM family_members WHERE family_id = ? AND to_date IS NULL AND deleted_at IS NULL',
        )
        .get(familyB.id).total,
      100,
    )

    assert.equal(personService.bulkRemove({ ids }).count, 100)
    assert.equal(
      db.prepare('SELECT COUNT(*) AS total FROM persons WHERE deleted_at IS NOT NULL').get().total,
      100,
    )
  })

  it('xoá dữ liệu nghiệp vụ nhưng giữ cấu hình', () => {
    seed()
    personService.create({ fullName: 'Giáo dân kiểm thử' })
    db.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)').run(
      'ui.theme',
      '"light"',
      '2026-01-01T00:00:00.000Z',
    )
    const result = dataService.clearAll()
    assert.equal(result.zones, 1)
    assert.equal(result.families, 2)
    assert.equal(result.persons, 1)
    assert.equal(db.prepare('SELECT COUNT(*) AS total FROM settings').get().total > 0, true)
  })
})
