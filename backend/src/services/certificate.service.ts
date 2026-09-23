import { createWriteStream, existsSync } from 'node:fs'
import PDFDocument from 'pdfkit'
import * as certificateRepository from '#/repositories/certificate.repository.ts'
import * as marriageRepository from '#/repositories/marriage.repository.ts'
import * as personRepository from '#/repositories/person.repository.ts'
import * as sacramentRepository from '#/repositories/sacrament.repository.ts'
import * as settingRepository from '#/repositories/setting.repository.ts'
import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { now } from './clock.ts'
import { newId, pageMeta } from './service-helpers.ts'

const titles = Object.freeze({
  baptism: 'CHỨNG THƯ RỬA TỘI',
  first_communion: 'CHỨNG THƯ RƯỚC LỄ LẦN ĐẦU',
  confirmation: 'CHỨNG THƯ THÊM SỨC',
  marriage: 'CHỨNG THƯ HÔN PHỐI',
})

function formatDate(value: string | null) {
  if (!value) return 'Chưa cập nhật'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

function sourceFor(personId: string, type: string) {
  if (type === 'marriage') return marriageRepository.findByPersonId(personId)
  return sacramentRepository.findByPersonId(personId).find((record: any) => record.type === type)
}

function requireCertificateData(input: any) {
  const person = personRepository.findById(input.personId)
  if (!person) throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy giáo dân')
  const source = sourceFor(person.id, input.type)
  if (!source)
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Giáo dân chưa có thông tin bí tích này')
  const settings = settingRepository.getAll()
  const parishName = String(settings['general.parishName'] ?? '').trim()
  const dioceseName = String(settings['general.dioceseName'] ?? '').trim()
  const parishPriestName = String(settings['general.parishPriestName'] ?? '').trim()
  if (!parishName || !dioceseName || !parishPriestName)
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Hãy hoàn tất Giáo phận, Giáo xứ và Linh mục chánh xứ trong Cài đặt trước khi cấp chứng thư',
    )
  return { person, source, parishName, dioceseName, parishPriestName }
}

function setFont(document: any) {
  const fontPath = 'C:\\Windows\\Fonts\\arial.ttf'
  if (existsSync(fontPath)) document.font(fontPath)
}

function line(document: any, label: string, value: string) {
  document.fontSize(11).fillColor('#102A43').text(`${label}: ${value}`, { lineGap: 5 })
}

async function writePdf(filePath: string, input: any, data: any) {
  await new Promise<void>((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      margin: 54,
      info: { Title: titles[input.type] },
    })
    const stream = createWriteStream(filePath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    document.pipe(stream)
    setFont(document)
    document.fontSize(11).fillColor('#102A43').text(data.dioceseName, { align: 'center' })
    document.fontSize(13).text(data.parishName, { align: 'center' })
    document.moveDown(1.4)
    document.fontSize(18).fillColor('#1F4E78').text(titles[input.type], { align: 'center' })
    document.moveDown(1.5)
    document
      .fontSize(10)
      .fillColor('#102A43')
      .text(
      `Số quyển: ${input.registerBook}     Số tờ: ${input.registerPage}     Số thứ tự sổ: ${input.registerEntry}`,
      )
    document.moveDown(1.2)
    document.fontSize(11).text(`${data.parishName} xác nhận:`)
    document.moveDown(0.7)
    line(document, 'Họ và tên', data.person.fullName)
    line(document, 'Tên thánh', data.person.holyName || 'Chưa cập nhật')
    line(document, 'Ngày sinh', formatDate(data.person.birthDate))
    if (input.type === 'marriage') line(document, 'Người phối ngẫu', data.source.spouseFullName)
    line(document, 'Ngày cử hành', formatDate(data.source.date))
    line(document, 'Nơi cử hành', data.source.place || 'Chưa cập nhật')
    line(document, 'Linh mục cử hành', data.source.minister || 'Chưa cập nhật')
    document.moveDown(0.7)
    line(document, 'Cha mẹ', '________________________________________________')
    line(document, 'Người đỡ đầu', '____________________________________________')
    document.moveDown(2.4)
    document.fontSize(11).text(`Cấp tại ${data.parishName}, ngày ${formatDate(now())}.`, {
      align: 'right',
    })
    document.moveDown(2.8)
    document.fontSize(11).text('LINH MỤC CHÁNH XỨ', { align: 'right' })
    document.moveDown(3.2)
    document.fontSize(11).text(data.parishPriestName, { align: 'right' })
    document.end()
  })
}

export async function issue({ filePath, ...input }: any) {
  const data = requireCertificateData(input)
  await writePdf(filePath, input, data)
  const timestamp = now()
  certificateRepository.insert({
    id: newId(),
    personId: data.person.id,
    type: input.type,
    sourceId: data.source.id,
    registerBook: input.registerBook,
    registerPage: input.registerPage,
    registerEntry: input.registerEntry,
    personFullName: data.person.fullName,
    issuedAt: timestamp,
    createdAt: timestamp,
  })
  return { filePath }
}

export function list(filter: any = {}) {
  return {
    data: certificateRepository.findMany(filter),
    meta: pageMeta(certificateRepository.count(), filter),
  }
}

export function suggestedFilename(type: string) {
  return `chung-thu-${type}.pdf`
}
