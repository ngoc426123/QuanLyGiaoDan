import { createWriteStream, existsSync, writeFileSync } from 'node:fs'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import * as reportRepository from '#/repositories/report.repository.ts'
import * as personService from '#/services/person.service.ts'
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

const sacramentLabels = Object.freeze({
  baptism: 'Rửa tội',
  first_communion: 'Rước lễ lần đầu',
  confirmation: 'Thêm sức',
})

const residenceLabels = Object.freeze({
  permanent: 'Thường trú',
  temporary: 'Tạm trú',
  moved_away: 'Đã chuyển đi',
})

const pastoralLabels = Object.freeze({
  ordinary: 'Bình thường',
  catechism: 'Học giáo lý',
  catechist: 'Giáo lý viên',
  needs_visit: 'Cần thăm viếng',
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
  zones: {
    filename: 'danh-sach-giao-ho.csv',
    headers: ['Giáo họ', 'Bổn mạng', 'Số hộ', 'Số giáo dân', 'Ghi chú'],
    rows: () => reportRepository.findZonesForCsv(),
    map: (row: any) => [row.name, row.holy_name, row.family_count, row.person_count, row.note],
  },
  sacraments: {
    filename: 'so-bi-tich.csv',
    headers: [
      'Giáo dân',
      'Tên thánh',
      'Bí tích',
      'Ngày cử hành',
      'Linh mục',
      'Nơi cử hành',
      'Hộ',
      'Giáo họ',
    ],
    rows: (filter: any) => reportRepository.findSacramentsForCsv(filter),
    map: (row: any) => [
      row.full_name,
      row.holy_name,
      sacramentLabels[row.type] ?? row.type,
      row.date,
      row.minister,
      row.place,
      row.family_name,
      row.zone_name,
    ],
  },
  marriages: {
    filename: 'danh-sach-hon-phoi.csv',
    headers: ['Hai đương sự', 'Ngày hôn phối', 'Linh mục cử hành', 'Nơi cử hành'],
    rows: (filter: any) => reportRepository.findMarriagesForCsv(filter),
    map: (row: any) => [row.participants, row.date, row.minister, row.place],
  },
  pastoral: {
    filename: 'danh-sach-muc-vu.csv',
    headers: [
      'Giáo dân',
      'Tên thánh',
      'Ngày sinh',
      'Số điện thoại',
      'Cư trú',
      'Tình trạng mục vụ',
      'Ghi chú mục vụ',
      'Hộ',
      'Giáo họ',
    ],
    rows: (filter: any) => reportRepository.findPastoralForCsv(filter),
    map: (row: any) => [
      row.full_name,
      row.holy_name,
      row.birth_date,
      row.phone,
      residenceLabels[row.residence_status] ?? row.residence_status,
      pastoralLabels[row.pastoral_status] ?? row.pastoral_status,
      row.pastoral_note,
      row.family_name,
      row.zone_name,
    ],
  },
  summary: {
    filename: 'bao-cao-thong-ke.csv',
    headers: [
      'Tổng giáo dân',
      'Còn sống',
      'Đã qua đời',
      'Tổng hộ',
      'Tổng giáo họ',
      'Tổng hôn phối',
    ],
    rows: () => reportRepository.findSummaryForCsv(),
    map: (row: any) => [
      row.person_count,
      row.living_person_count,
      row.deceased_person_count,
      row.family_count,
      row.zone_count,
      row.marriage_count,
    ],
  },
  dataQuality: {
    filename: 'ho-so-can-bo-sung.csv',
    headers: ['Giáo dân', 'Thông tin cần bổ sung', 'Hộ', 'Giáo họ'],
    rows: () => reportRepository.findDataQualityForCsv(),
    map: (row: any) => [row.full_name, row.issue, row.family_name, row.zone_name],
  },
  birthdays: {
    filename: 'danh-sach-sinh-nhat.csv',
    headers: ['Giáo dân', 'Tên thánh', 'Ngày sinh', 'Số điện thoại', 'Hộ', 'Giáo họ'],
    rows: (filter: any) => reportRepository.findBirthdaysForCsv(filter),
    map: (row: any) => [
      row.full_name,
      row.holy_name,
      row.birth_date,
      row.phone,
      row.family_name,
      row.zone_name,
    ],
  },
  householdMembers: {
    filename: 'danh-sach-thanh-vien-cac-ho.csv',
    headers: ['Giáo họ', 'Hộ', 'Giáo dân', 'Tên thánh', 'Ngày sinh', 'Quan hệ', 'Ngày vào hộ'],
    rows: (filter: any) => reportRepository.findHouseholdMembersForCsv(filter),
    map: (row: any) => [
      row.zone_name,
      row.family_name,
      row.full_name,
      row.holy_name,
      row.birth_date,
      relationshipLabels[row.relationship] ?? row.relationship,
      row.from_date,
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

function reportData(report: keyof typeof reportDefinitions, filter: any) {
  const definition = reportDefinitions[report]
  const rows = definition.rows(filter).map(definition.map)
  return { definition, rows }
}

function filenameFor(report: keyof typeof reportDefinitions, extension: string) {
  return reportDefinitions[report].filename.replace(/\.csv$/, '.' + extension)
}

function safeSpreadsheetCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value)
  return /^[=+\-@]/.test(text) ? "'" + text : text
}

export function exportCsv({ report, filter, filePath }: any) {
  const { definition, rows } = reportData(report, filter)
  writeFileSync(filePath, toCsv(definition.headers, rows), 'utf8')
  return { filePath, rowCount: rows.length }
}

export async function exportXlsx({ report, filter, filePath }: any) {
  const { definition, rows } = reportData(report, filter)
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Quản lý giáo dân'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet('Báo cáo', { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.addRow(definition.headers)
  for (const row of rows) sheet.addRow(row.map(safeSpreadsheetCell))
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } }
  sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: definition.headers.length },
  }
  for (let index = 1; index <= definition.headers.length; index += 1) {
    const values = [definition.headers[index - 1], ...rows.map((row) => row[index - 1])]
    const width = Math.min(
      42,
      Math.max(12, ...values.map((value) => String(value ?? '').length + 2)),
    )
    sheet.getColumn(index).width = width
  }
  sheet.eachRow((row, index) => {
    row.alignment = { vertical: 'top', wrapText: true }
    if (index > 1) row.border = { bottom: { style: 'hair', color: { argb: 'FFD9E2F3' } } }
  })
  await workbook.xlsx.writeFile(filePath)
  return { filePath, rowCount: rows.length }
}

function setPdfFont(document: any) {
  const windowsArial = 'C:\\Windows\\Fonts\\arial.ttf'
  if (existsSync(windowsArial)) document.font(windowsArial)
}

function drawPdfTable(document: any, headers: string[], rows: unknown[][]) {
  const left = document.page.margins.left
  const right = document.page.width - document.page.margins.right
  const bottom = document.page.height - document.page.margins.bottom
  const width = (right - left) / headers.length
  let y = document.y
  const drawHeader = () => {
    document.fontSize(7).fillColor('#FFFFFF')
    document.rect(left, y, right - left, 20).fill('#1F4E78')
    headers.forEach((header, index) =>
      document.text(header, left + index * width + 3, y + 5, {
        width: width - 6,
        height: 12,
        ellipsis: true,
      }),
    )
    y += 20
  }
  drawHeader()
  for (const row of rows) {
    const cells = row.map((value) => String(value ?? ''))
    const height = Math.max(
      20,
      Math.min(
        42,
        ...cells.map(
          (cell) =>
            document.heightOfString(cell, { width: width - 6, height: 34, ellipsis: true }) + 6,
        ),
      ),
    )
    if (y + height > bottom) {
      document.addPage()
      y = document.page.margins.top
      drawHeader()
    }
    document.fontSize(7).fillColor('#1F2937')
    if (Math.floor((y - document.page.margins.top) / 20) % 2 === 0)
      document.rect(left, y, right - left, height).fill('#F8FAFC')
    cells.forEach((cell, index) =>
      document.text(cell, left + index * width + 3, y + 4, {
        width: width - 6,
        height: height - 6,
        ellipsis: true,
      }),
    )
    document
      .strokeColor('#D9E2F3')
      .lineWidth(0.3)
      .moveTo(left, y + height)
      .lineTo(right, y + height)
      .stroke()
    y += height
  }
}

export async function exportPdf({ report, filter, filePath }: any) {
  const { definition, rows } = reportData(report, filter)
  await new Promise<void>((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      layout: definition.headers.length > 5 ? 'landscape' : 'portrait',
      margin: 36,
      info: { Title: definition.headers[0] },
    })
    const stream = createWriteStream(filePath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    document.pipe(stream)
    setPdfFont(document)
    document.fontSize(15).fillColor('#102A43').text('Báo cáo giáo xứ')
    document.moveDown(0.4)
    drawPdfTable(document, definition.headers, rows)
    document.end()
  })
  return { filePath, rowCount: rows.length }
}

function profileField(document: any, label: string, value: unknown) {
  document.fontSize(9).fillColor('#52606D').text(label)
  document
    .fontSize(11)
    .fillColor('#102A43')
    .text(String(value || 'Chưa cập nhật'))
  document.moveDown(0.35)
}

function profileSection(document: any, title: string) {
  document.moveDown(0.5)
  document.fontSize(12).fillColor('#1F4E78').text(title)
  document.moveDown(0.3)
}

export async function exportPersonProfilePdf({ personId, filePath }: any) {
  const person = personService.getById(personId)
  await new Promise<void>((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 48, info: { Title: person.fullName } })
    const stream = createWriteStream(filePath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    document.pipe(stream)
    setPdfFont(document)
    document.fontSize(18).fillColor('#102A43').text('Hồ sơ giáo dân')
    document.fontSize(11).fillColor('#1F4E78').text(person.fullName)
    profileSection(document, 'Thông tin hành chính')
    profileField(document, 'Tên thánh', person.holyName)
    profileField(document, 'Ngày sinh', person.birthDate)
    profileField(document, 'Giới tính', genderLabel(person.gender))
    profileField(document, 'Số điện thoại', person.phone)
    profileField(document, 'Hộ gia đình', person.currentMembership?.familyName)
    profileField(document, 'Giáo họ', person.currentMembership?.zoneName)
    profileSection(document, 'Đời sống bí tích')
    for (const type of ['baptism', 'first_communion', 'confirmation']) {
      const sacrament = person.sacraments?.find((item: any) => item.type === type)
      profileField(document, sacramentLabels[type], sacrament?.date)
    }
    profileSection(document, 'Hôn phối')
    profileField(document, 'Người phối ngẫu', person.marriage?.spouseFullName)
    profileField(document, 'Ngày hôn phối', person.marriage?.date)
    document.end()
  })
  return { filePath, rowCount: 1 }
}

export function getSuggestedFilename(report: keyof typeof reportDefinitions, extension = 'csv') {
  return filenameFor(report, extension)
}

export const personProfileFilename = 'ho-so-giao-dan.pdf'
