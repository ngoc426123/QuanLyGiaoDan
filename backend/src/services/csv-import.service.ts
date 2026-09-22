import { readFileSync } from 'node:fs'
import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { runInTransaction } from '#/repositories/query-helpers.ts'
import * as familyRepository from '#/repositories/family.repository.ts'
import * as personRepository from '#/repositories/person.repository.ts'
import * as zoneRepository from '#/repositories/zone.repository.ts'
import * as familyMemberService from './family-member.service.ts'
import * as familyService from './family.service.ts'
import * as personService from './person.service.ts'
import * as zoneService from './zone.service.ts'
import { toAscii } from './service-helpers.ts'

const HEADERS = [
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
const relationships = {
  'Chủ hộ': 'head',
  'Vợ/Chồng': 'spouse',
  Con: 'child',
  'Cha/Mẹ': 'parent',
  'Ông/Bà': 'grandparent',
  Cháu: 'grandchild',
  'Anh/Chị/Em': 'sibling',
  'Họ hàng': 'relative',
  Khác: 'other',
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted && char === '"' && text[index + 1] === '"') {
      cell += '"'
      index += 1
    } else if (char === '"') quoted = !quoted
    else if (!quoted && char === ',') {
      row.push(cell)
      cell = ''
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell)
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ''
    } else cell += char
  }
  if (quoted) throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'CSV có dấu nháy chưa đóng')
  row.push(cell)
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function readRows(filePath: string) {
  const rows = parseCsv(readFileSync(filePath, 'utf8'))
  const headers = rows.shift()?.map((value) => value.replace(/^\ufeff/, '').trim())
  if (
    !headers ||
    headers.length !== HEADERS.length ||
    headers.some((value, index) => value !== HEADERS[index])
  )
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'CSV không đúng mẫu cột nhập liệu')
  const records = rows.map(
    (values) =>
      Object.fromEntries(
        HEADERS.map((header, column) => [header, values[column]?.trim() || null]),
      ) as any,
  )
  const duplicatePeople = new Set<string>()
  records.forEach((row, index) => {
    if (
      !row['Giáo họ'] ||
      !row['Tên hộ'] ||
      !row['Họ tên'] ||
      !row['Ngày sinh'] ||
      !row['Quan hệ'] ||
      !row['Ngày vào hộ']
    )
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Dòng ${index + 2} thiếu trường bắt buộc`)
    if (row['Giới tính'] && !['Nam', 'Nữ'].includes(row['Giới tính']))
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Dòng ${index + 2} có giới tính không hợp lệ`,
      )
    if (!relationships[row['Quan hệ']])
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Dòng ${index + 2} có quan hệ không hợp lệ`)
    const key = `${row['Họ tên']}|${row['Ngày sinh']}`.toLocaleLowerCase('vi')
    if (duplicatePeople.has(key))
      throw new AppError(
        ERROR_CODES.CONFLICT,
        `Dòng ${index + 2} nghi ngờ trùng giáo dân trong tệp`,
      )
    duplicatePeople.add(key)
  })
  return records
}

function duplicateKeys(rows: any[]) {
  const unique = new Map<string, { fullNameAscii: string; birthDate: string }>()
  for (const row of rows) {
    const fullNameAscii = toAscii(row['Họ tên'])
    unique.set(`${fullNameAscii}|${row['Ngày sinh']}`, {
      fullNameAscii,
      birthDate: row['Ngày sinh'],
    })
  }
  return [...unique.values()]
}

function inspectExistingDuplicates(rows: any[]) {
  const keys = duplicateKeys(rows)
  return {
    count: personRepository.countPotentialDuplicates(keys),
    samples: personRepository.findPotentialDuplicates(keys),
  }
}

export function previewCsv(filePath: string) {
  const rows = readRows(filePath)
  const duplicates = inspectExistingDuplicates(rows)
  return {
    rowCount: rows.length,
    zoneCount: new Set(rows.map((row) => row['Giáo họ'])).size,
    familyCount: new Set(rows.map((row) => `${row['Giáo họ']}|${row['Tên hộ']}`)).size,
    suspectedDuplicateCount: duplicates.count,
    suspectedDuplicates: duplicates.samples.slice(0, 5),
    sample: rows.slice(0, 5).map((row) => ({
      zoneName: row['Giáo họ'],
      familyName: row['Tên hộ'],
      fullName: row['Họ tên'],
      birthDate: row['Ngày sinh'],
    })),
  }
}

export function importCsv({ filePath, onProgress = () => {} }: any) {
  const rows = readRows(filePath)
  const duplicates = inspectExistingDuplicates(rows)
  if (duplicates.count > 0) {
    throw new AppError(
      ERROR_CODES.CONFLICT,
      `Tệp có ${duplicates.count} giáo dân nghi ngờ trùng với dữ liệu hiện có. Hãy rà soát trước khi nhập.`,
      { duplicateCount: duplicates.count, duplicates: duplicates.samples.slice(0, 20) },
    )
  }
  const zones = new Map<string, any>()
  const families = new Map<string, any>()
  const reportEvery = Math.max(1, Math.floor(rows.length / 20))
  onProgress({ processed: 0, total: rows.length, percent: 0 })
  runInTransaction(() =>
    rows.forEach((row, index) => {
      if (!zones.has(row['Giáo họ']))
        zones.set(
          row['Giáo họ'],
          zoneRepository.findByName(row['Giáo họ']) ?? zoneService.create({ name: row['Giáo họ'] }),
        )
      const familyKey = `${row['Giáo họ']}|${row['Tên hộ']}`
      if (!families.has(familyKey))
        families.set(
          familyKey,
          familyRepository.findByZoneAndName(zones.get(row['Giáo họ']).id, row['Tên hộ']) ??
            familyService.create({
              zoneId: zones.get(row['Giáo họ']).id,
              name: row['Tên hộ'],
              address: row['Địa chỉ'],
            }),
        )
      const person = personService.create({
        fullName: row['Họ tên'],
        givenName: row['Tên gọi'],
        holyName: row['Tên thánh'],
        gender: row['Giới tính'] === 'Nam' ? 'male' : row['Giới tính'] === 'Nữ' ? 'female' : null,
        birthDate: row['Ngày sinh'],
        sacraments: [
          ['baptism', row['Ngày rửa tội']],
          ['first_communion', row['Ngày rước lễ lần đầu']],
          ['confirmation', row['Ngày thêm sức']],
          ['marriage', row['Ngày hôn phối']],
        ]
          .filter(([, date]) => Boolean(date))
          .map(([type, date]) => ({ type, date, minister: null })),
        phone: row['Số điện thoại'],
        source: 'csv_import',
        note: row['Ghi chú'],
      }).data
      familyMemberService.add({
        familyId: families.get(familyKey).id,
        personId: person.id,
        relationship: relationships[row['Quan hệ']],
        fromDate: row['Ngày vào hộ'],
      })
      const processed = index + 1
      if (processed % reportEvery === 0 || processed === rows.length)
        onProgress({
          processed,
          total: rows.length,
          percent: Math.round((processed / rows.length) * 100),
        })
    }),
  )
  return { rowCount: rows.length }
}
