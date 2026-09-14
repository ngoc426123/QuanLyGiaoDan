import { writeFileSync } from 'node:fs'
import * as reportRepository from '#/repositories/report.repository.ts'
import { normalizeText, toAscii } from './service-helpers.ts'

const relationshipLabels = Object.freeze({
  head: 'Chủ hộ',
  spouse: 'Vợ/Chồng',
  child: 'Con',
  parent: 'Cha/Mẹ',
  grandparent: 'Ông/Bà',
  grandchild: 'Cháu',
  sibling: 'Anh/Chị/Em',
  relative: 'Họ hàng',
  other: 'Khác',
})

const reportDefinitions = Object.freeze({
  persons: {
    filename: 'danh-sach-giao-dan.csv',
    headers: [
      'Họ tên',
      'Tên thánh',
      'Giới tính',
      'Ngày sinh',
      'Ngày rửa tội',
      'Ngày rước lễ lần đầu',
      'Ngày thêm sức',
      'Ngày hôn phối',
      'Ngày qua đời',
      'Số điện thoại',
      'Hộ gia đình',
      'Giáo họ',
      'Ghi chú',
    ],
    rows: (filter: any) =>
      reportRepository.findPersonsForCsv({ ...filter, search: normalizeSearch(filter.search) }),
    map: (row: any) => [
      row.full_name,
      row.holy_name,
      genderLabel(row.gender),
      row.birth_date,
      row.baptism_date,
      row.first_communion_date,
      row.confirmation_date,
      row.marriage_date,
      row.death_date,
      row.phone,
      row.family_name,
      row.zone_name,
      row.note,
    ],
  },
  families: {
    filename: 'danh-sach-gia-dinh.csv',
    headers: ['Tên hộ', 'Giáo họ', 'Địa chỉ', 'Số thành viên', 'Ghi chú'],
    rows: (filter: any) =>
      reportRepository.findFamiliesForCsv({ ...filter, search: normalizeSearch(filter.search) }),
    map: (row: any) => [row.name, row.zone_name, row.address, row.member_count, row.note],
  },
  familyMembers: {
    filename: 'danh-sach-thanh-vien-ho.csv',
    headers: ['Họ tên', 'Tên thánh', 'Giới tính', 'Ngày sinh', 'Quan hệ', 'Ngày vào hộ', 'Ghi chú'],
    rows: (filter: any) => reportRepository.findFamilyMembersForCsv(filter.familyId),
    map: (row: any) => [
      row.full_name,
      row.holy_name,
      genderLabel(row.gender),
      row.birth_date,
      relationshipLabels[row.relationship] ?? row.relationship,
      row.from_date,
      row.note,
    ],
  },
})

function normalizeSearch(value: unknown) {
  const text = normalizeText(value)
  return text ? toAscii(text) : undefined
}

function genderLabel(value: string | null) {
  return value === 'male' ? 'Nam' : value === 'female' ? 'Nữ' : null
}

function escapeCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value)
  const safeText = /^[=+\-@]/.test(text) ? "'" + text : text
  return '"' + safeText.replaceAll('"', '""') + '"'
}

function toCsv(headers: string[], rows: unknown[][]) {
  return (
    '\ufeff' + [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n') + '\r\n'
  )
}

export function exportCsv({ report, filter, filePath }: any) {
  const definition = reportDefinitions[report]
  const rows = definition.rows(filter).map(definition.map)
  writeFileSync(filePath, toCsv(definition.headers, rows), 'utf8')
  return { filePath, rowCount: rows.length }
}

export function getSuggestedFilename(report: keyof typeof reportDefinitions) {
  return reportDefinitions[report].filename
}
