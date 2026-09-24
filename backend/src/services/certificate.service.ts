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
  confirmation: 'CHỨNG THƯ THÊM SỨC',
  marriage: 'CHỨNG THƯ HÔN PHỐI',
})

function formatDate(value: string | null) {
  if (!value) return 'Chưa cập nhật'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

function requireCertificateData(input: any) {
  const person = personRepository.findById(input.personId)
  if (!person) throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy giáo dân')
  const sacramentRecords = sacramentRepository.findByPersonId(person.id)
  const marriageHistory = input.type === 'marriage'
    ? marriageRepository.findManyByPersonId(person.id)
    : []
  const source =
    input.type === 'marriage'
      ? (input.marriageId
          ? marriageHistory.find((record: any) => record.id === input.marriageId)
          : marriageHistory[0])
      : sacramentRecords.find((record: any) => record.type === input.type)
  if (!source)
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Giáo dân chưa có thông tin bí tích này')
  const settings = settingRepository.getAll()
  const parishName = String(settings['general.parishName'] ?? '').trim()
  const deaneryName = String(settings['general.deaneryName'] ?? '').trim()
  const dioceseName = String(settings['general.dioceseName'] ?? '').trim()
  const parishPriestName = String(settings['general.parishPriestName'] ?? '').trim()
  const parishAddress = String(settings['general.parishAddress'] ?? '').trim()
  const parishPhone = String(settings['general.parishPhone'] ?? '').trim()
  const data = {
    person,
    source,
    sacramentRecords,
    spouse:
      input.type === 'marriage' && source?.spouseId
        ? personRepository.findById(source.spouseId)
        : input.type === 'marriage' && source?.spouseFullName
          ? {
              fullName: source.spouseFullName,
              holyName: source.spouseHolyName,
              birthDate: source.spouseBirthDate,
              parishName: source.spouseParishName,
              dioceseName: source.spouseDioceseName,
              baptismDate: source.spouseBaptismDate,
              baptismPlace: source.spouseBaptismPlace,
              confirmationDate: source.spouseConfirmationDate,
              confirmationPlace: source.spouseConfirmationPlace,
              fatherName: source.spouseFatherName,
              motherName: source.spouseMotherName,
            }
          : null,
    spouseSacraments:
      input.type === 'marriage' && source?.spouseId
        ? sacramentRepository.findByPersonId(source.spouseId)
        : [],
    parishName,
    deaneryName,
    dioceseName,
    parishPriestName,
    parishAddress,
    parishPhone,
    baptismSource: sacramentRecords.find((record: any) => record.type === 'baptism') ?? null,
  }
  const result = !input.draft
    ? data
    : {
        ...data,
        dioceseName: input.draft.dioceseName,
        deaneryName: input.draft.deaneryName,
        parishName: input.draft.parishName,
        parishAddress: input.draft.parishAddress,
        parishPhone: input.draft.parishPhone,
        parishPriestName: input.draft.parishPriestName,
        person: {
          ...data.person,
          fullName: input.draft.personName,
          holyName: input.draft.holyName,
          birthDate: input.draft.birthDate || null,
          birthPlace: input.draft.birthPlace,
          fatherName: input.draft.fatherName,
          motherName: input.draft.motherName,
        },
        source: {
          ...data.source,
          date: input.draft.ceremonyDate || null,
          place: input.draft.ceremonyPlace,
          minister: input.draft.minister,
          witnessOne: input.draft.witnessOne,
          witnessTwo: input.draft.witnessTwo,
          spouseFullName: input.draft.spouseName,
          sponsor: input.draft.sponsor,
          note: input.draft.note,
        },
        spouse: data.spouse
          ? {
              ...data.spouse,
              fullName: input.draft.spouseName || data.spouse.fullName,
            }
          : input.draft.spouseName
            ? { fullName: input.draft.spouseName }
            : null,
      }
  if (!result.parishName || !result.dioceseName || !result.parishPriestName)
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Hãy hoàn tất Giáo phận, Giáo xứ và Linh mục chánh xứ trong nội dung chứng thư',
    )
  return result
}

function setFont(document: any) {
  const fontPath = 'C:\\Windows\\Fonts\\times.ttf'
  if (existsSync(fontPath)) document.font(fontPath)
}

function font(document: any, fileName: string) {
  const fontPath = `C:\\Windows\\Fonts\\${fileName}`
  if (existsSync(fontPath)) document.font(fontPath)
  return document
}

function line(document: any, label: string, value: string) {
  document.fontSize(11).fillColor('#102A43').text(`${label}: ${value}`, { lineGap: 5 })
}

function registryLine(input: any) {
  if (![input.registerBook, input.registerPage, input.registerEntry].some(Boolean)) return ''
  return `Số quyển: ${input.registerBook || '—'}     Số tờ: ${input.registerPage || '—'}     Số thứ tự sổ: ${input.registerEntry || '—'}`
}

function drawRule(document: any, x1: number, y: number, x2: number) {
  document.save().strokeColor('#555').lineWidth(0.6).moveTo(x1, y).lineTo(x2, y).stroke().restore()
}

function textAt(
  document: any,
  value: string,
  x: number,
  y: number,
  width = 500,
  size = 12,
  align: 'left' | 'center' | 'right' = 'left',
) {
  document
    .fontSize(size === 12 ? 13 : size)
    .fillColor('#111')
    .text(value || '', x, y, { width, align, lineBreak: false })
}

function sampleHeader(document: any, data: any) {
  font(document, 'timesbd.ttf')
  textAt(document, data.dioceseName || 'TỔNG GIÁO PHẬN', 36, 50, 523, 13)
  font(document, 'times.ttf')
  textAt(document, `Giáo hạt: ${data.deaneryName || ''}`, 36, 68, 523)
  textAt(document, `Giáo xứ: ${data.parishName || ''}`, 36, 84, 523)
  textAt(document, `Điện thoại: ${data.parishPhone || ''}`, 36, 100, 523)
  textAt(document, `Địa chỉ: ${data.parishAddress || ''}`, 36, 116, 523)
}

function sampleTitle(document: any, title: string) {
  font(document, 'timesbd.ttf')
  textAt(document, title, 36, 148, 523, 20, 'center')
  textAt(document, '---†---', 36, 175, 523, 13, 'center')
}

function personName(data: any) {
  return `${data.person?.holyName || ''} ${String(data.person?.fullName || '').toUpperCase()}`.trim()
}

function parishLabel(value: string) {
  return String(value || '')
    .replace(/^giáo\s*xứ\s+/i, '')
    .trim()
}

function drawBaptismTemplate(document: any, input: any, data: any) {
  sampleHeader(document, data)
  sampleTitle(document, 'CHỨNG CHỈ RỬA TỘI')
  font(document, 'times.ttf')
  textAt(document, '(Tên thánh, họ và tên)', 54, 235, 150, 12)
  textAt(document, personName(data), 190, 235, 365, 12)
  drawRule(document, 190, 252, 520)
  textAt(document, 'Sinh ngày:', 36, 256, 90, 12)
  textAt(document, formatDate(data.person.birthDate), 110, 256, 165, 12)
  drawRule(document, 110, 273, 250)
  textAt(document, `tại ${data.person.birthPlace || '(tỉnh/thành phố)'}`, 292, 256, 150, 12)
  drawRule(document, 430, 273, 520)
  textAt(document, 'Con ông (tên thánh, họ tên):', 36, 277, 180, 12)
  textAt(document, data.person.fatherName || '', 190, 277, 330, 12)
  drawRule(document, 190, 294, 520)
  textAt(document, 'và bà (tên thánh, họ tên):', 36, 300, 180, 12)
  textAt(document, data.person.motherName || '', 190, 300, 330, 12)
  drawRule(document, 190, 317, 520)
  textAt(document, 'Đã nhận Bí tích Rửa tội ngày:', 36, 323, 210, 12)
  textAt(document, formatDate(data.source.date), 270, 323, 75, 12)
  drawRule(document, 270, 338, 345)
  textAt(document, 'tại Nhà thờ', 350, 323, 90, 12)
  textAt(document, data.source.place || '', 430, 323, 90, 12)
  drawRule(document, 430, 338, 520)
  textAt(document, 'Do Linh mục:', 36, 346, 100, 12)
  textAt(document, data.source.minister || '', 145, 346, 375, 12)
  drawRule(document, 145, 363, 520)
  textAt(document, 'Người đỡ đầu (tên thánh, họ tên):', 36, 369, 235, 12)
  textAt(document, data.source.sponsor || '', 285, 369, 235, 12)
  drawRule(document, 285, 386, 520)
  textAt(document, 'Số Rửa tội số:', 36, 392, 110, 12)
  textAt(document, registryLine(input), 155, 392, 365, 11)
  drawRule(document, 155, 409, 520)
  textAt(
    document,
    data.source.note || 'Ghi chú trong sổ Rửa tội (về hôn phối...)',
    36,
    415,
    300,
    12,
  )
  drawRule(document, 300, 432, 520)
  drawRule(document, 36, 459, 520)
  textAt(
    document,
    `Giáo xứ ${parishLabel(data.parishName)}, ngày ${formatDate(now())}`,
    330,
    500,
    229,
    11,
    'center',
  )
  textAt(document, 'Linh mục chứng nhận', 330, 535, 229, 12, 'center')
  font(document, 'timesi.ttf')
  textAt(document, data.parishPriestName || '', 330, 625, 229, 12, 'center')
}

function drawConfirmationTemplate(document: any, input: any, data: any) {
  sampleHeader(document, data)
  sampleTitle(document, 'CHỨNG CHỈ THÊM SỨC')
  font(document, 'times.ttf')
  textAt(document, '(Tên thánh, họ và tên)', 36, 235, 150, 12)
  textAt(document, personName(data), 190, 235, 365, 12)
  drawRule(document, 190, 252, 520)
  textAt(document, 'Sinh ngày:', 36, 256, 90, 12)
  textAt(document, formatDate(data.person.birthDate), 110, 256, 165, 12)
  drawRule(document, 110, 271, 250)
  textAt(document, `tại ${data.person.birthPlace || '(tỉnh/thành phố)'}`, 292, 256, 150, 12)
  drawRule(document, 430, 271, 520)
  textAt(document, 'Con ông (tên thánh, họ tên):', 36, 277, 180, 12)
  textAt(document, data.person.fatherName || '', 190, 277, 330, 12)
  drawRule(document, 190, 292, 520)
  textAt(document, 'và bà (tên thánh, họ tên):', 36, 298, 180, 12)
  textAt(document, data.person.motherName || '', 190, 298, 330, 12)
  drawRule(document, 190, 313, 520)
  textAt(document, 'Đã nhận Bí tích Rửa tội ngày:', 36, 319, 210, 12)
  textAt(document, formatDate(data.baptismSource?.date), 270, 319, 75, 12)
  drawRule(document, 270, 334, 345)
  textAt(document, 'tại Nhà thờ', 350, 319, 90, 12)
  textAt(document, data.baptismSource?.place || '', 430, 319, 90, 12)
  drawRule(document, 430, 334, 520)
  textAt(document, 'Đã nhận Bí tích Thêm sức ngày:', 36, 340, 220, 12)
  textAt(document, formatDate(data.source.date), 270, 340, 75, 12)
  drawRule(document, 270, 355, 345)
  textAt(document, 'tại Nhà thờ', 350, 340, 90, 12)
  textAt(document, data.source.place || '', 430, 340, 90, 12)
  drawRule(document, 430, 355, 520)
  textAt(document, 'Do TGM/ĐGM/LM:', 36, 361, 145, 12)
  textAt(document, data.source.minister || '', 145, 361, 375, 12)
  drawRule(document, 145, 376, 520)
  textAt(document, 'Người đỡ đầu (tên thánh, họ tên):', 36, 382, 235, 12)
  textAt(document, data.source.sponsor || '', 285, 382, 235, 12)
  drawRule(document, 285, 397, 520)
  textAt(document, 'Số Thêm sức số:', 36, 403, 125, 12)
  textAt(document, registryLine(input), 155, 403, 365, 11)
  drawRule(document, 155, 418, 520)
  drawRule(document, 36, 459, 520)
  textAt(
    document,
    `Giáo xứ ${parishLabel(data.parishName)}, ngày ${formatDate(now())}`,
    330,
    500,
    229,
    11,
    'center',
  )
  textAt(document, 'Linh mục chứng nhận', 330, 535, 229, 12, 'center')
  font(document, 'timesi.ttf')
  textAt(document, data.parishPriestName || '', 330, 625, 229, 12, 'center')
}

function marriagePersonByGender(data: any, gender: string, fallback: any) {
  const people = [data.person, data.spouse].filter(Boolean)
  return (
    people.find((person: any) => String(person.gender || '').toLowerCase() === gender) ?? fallback
  )
}

function sacramentFor(person: any, records: any[], type: string) {
  if (!person) return null
  return records.find((record: any) => record.type === type) ?? null
}

function dottedRule(document: any, x1: number, y: number, x2: number) {
  document
    .save()
    .strokeColor('#444')
    .lineWidth(0.55)
    .dash(1.2, { space: 1.8 })
    .moveTo(x1, y)
    .lineTo(x2, y)
    .stroke()
    .undash()
    .restore()
}

function marriageField(document: any, label: string, value: string, y: number, options: any = {}) {
  const labelWidth = options.labelWidth ?? 112
  const valueX = options.valueX ?? 150
  const valueWidth = options.valueWidth ?? 370
  font(document, 'timesbd.ttf')
  textAt(document, label, 54, y, labelWidth, options.labelSize ?? 11)
  font(document, 'times.ttf')
  textAt(document, value || '', valueX, y, valueWidth, options.valueSize ?? 11)
  dottedRule(document, valueX, y + 16, options.ruleX2 ?? 520)
}

function drawMarriageTemplate(document: any, input: any, data: any) {
  const selectedIsFemale = String(data.person.gender || '').toLowerCase() === 'nữ'
  const male = marriagePersonByGender(data, 'nam', selectedIsFemale ? data.spouse : data.person)
  const female = marriagePersonByGender(data, 'nữ', selectedIsFemale ? data.person : data.spouse)
  const maleSacraments = male === data.person ? data.sacramentRecords : data.spouseSacraments
  const femaleSacraments = female === data.person ? data.sacramentRecords : data.spouseSacraments
  const maleBaptism = sacramentFor(male, maleSacraments, 'baptism')
  const maleConfirmation = sacramentFor(male, maleSacraments, 'confirmation')
  const femaleBaptism = sacramentFor(female, femaleSacraments, 'baptism')
  const femaleConfirmation = sacramentFor(female, femaleSacraments, 'confirmation')

  // The reference certificate places the parish block at left and the title at right.
  font(document, 'timesbd.ttf')
  textAt(document, data.dioceseName || '', 54, 50, 155, 12)
  font(document, 'times.ttf')
  textAt(document, `Giáo hạt: ${data.deaneryName || ''}`, 54, 68, 155, 12)
  textAt(document, `Giáo xứ: ${data.parishName || ''}`, 54, 87, 155, 12)
  textAt(document, `Địa chỉ: ${data.parishAddress || ''}`, 54, 106, 190, 11)
  dottedRule(document, 54, 128, 225)
  font(document, 'timesbd.ttf')
  textAt(document, 'CHỨNG THƯ HÔN PHỐI', 245, 62, 305, 20, 'center')
  font(document, 'times.ttf')
  textAt(document, 'Tôi, Linh mục:', 54, 182, 90, 13)
  textAt(document, data.parishPriestName || '', 150, 182, 370, 13)
  dottedRule(document, 150, 199, 520)

  font(document, 'timesbd.ttf')
  textAt(document, 'CHỨNG NHẬN', 36, 214, 484, 19, 'center')
  font(document, 'times.ttf')
  marriageField(document, 'Bên Nam', personName({ person: male }), 251, {
    valueX: 150,
    valueWidth: 370,
  })
  marriageField(document, 'Sinh ngày', formatDate(male?.birthDate), 272)
  textAt(document, `tại ${male?.birthPlace || ''}`, 315, 272, 205, 12)
  marriageField(document, 'Rửa tội ngày', formatDate(maleBaptism?.date), 293)
  textAt(document, `tại ${maleBaptism?.place || ''}`, 315, 293, 205, 12)
  marriageField(document, 'Thêm sức ngày', formatDate(maleConfirmation?.date), 314)
  textAt(document, `tại ${maleConfirmation?.place || ''}`, 315, 314, 205, 12)
  marriageField(document, 'Cha', male?.fatherName || '', 335)
  marriageField(document, 'Mẹ', male?.motherName || '', 356)
  marriageField(document, 'Thuộc Giáo họ', male?.zoneName || '', 377, {
    valueX: 160,
    valueWidth: 155,
  })
  textAt(document, 'Giáo xứ', 320, 377, 65, 12)
  textAt(document, data.parishName || '', 386, 377, 134, 12)
  dottedRule(document, 386, 394, 520)

  marriageField(document, 'Bên Nữ', personName({ person: female }), 405, {
    valueX: 150,
    valueWidth: 370,
  })
  marriageField(document, 'Sinh ngày', formatDate(female?.birthDate), 426)
  textAt(document, `tại ${female?.birthPlace || ''}`, 315, 426, 205, 12)
  marriageField(document, 'Rửa tội ngày', formatDate(femaleBaptism?.date), 447)
  textAt(document, `tại ${femaleBaptism?.place || ''}`, 315, 447, 205, 12)
  marriageField(document, 'Thêm sức ngày', formatDate(femaleConfirmation?.date), 468)
  textAt(document, `tại ${femaleConfirmation?.place || ''}`, 315, 468, 205, 12)
  marriageField(document, 'Cha', female?.fatherName || '', 489)
  marriageField(document, 'Mẹ', female?.motherName || '', 510)
  marriageField(document, 'Thuộc Giáo họ', female?.zoneName || '', 531, {
    valueX: 160,
    valueWidth: 155,
  })
  textAt(document, 'Giáo xứ', 320, 531, 65, 12)
  textAt(document, data.parishName || '', 386, 531, 134, 12)
  dottedRule(document, 386, 548, 520)

  font(document, 'timesbd.ttf')
  textAt(document, 'ĐÃ CỬ HÀNH BÍ TÍCH HÔN PHỐI', 36, 561, 484, 15, 'center')
  font(document, 'times.ttf')
  marriageField(document, 'Vào ngày', formatDate(data.source.date), 586)
  marriageField(document, 'Tại', data.source.place || '', 607)
  marriageField(document, 'Trước mặt người chứng hôn', data.source.minister || '', 628, {
    labelWidth: 220,
    valueX: 275,
    valueWidth: 245,
  })
  marriageField(document, 'Và hai người chứng 1', data.source.witnessOne || '', 649, {
    labelWidth: 220,
    valueX: 275,
    valueWidth: 245,
  })
  marriageField(document, '2', data.source.witnessTwo || '', 670, {
    labelWidth: 220,
    valueX: 275,
    valueWidth: 245,
  })
  const registry = registryLine(input)
  marriageField(document, 'Trích sổ Hôn phối Giáo xứ', registry, 691, {
    labelWidth: 220,
    valueX: 275,
    valueWidth: 245,
    valueSize: 10,
  })
  textAt(
    document,
    `Giáo xứ ${parishLabel(data.parishName)}, ngày ${formatDate(now())}`,
    304,
    718,
    216,
    11,
    'center',
  )
  font(document, 'timesbd.ttf')
  textAt(document, 'Linh mục quản xứ', 304, 742, 216, 11, 'center')
  font(document, 'timesi.ttf')
  textAt(document, '(ký tên, đóng dấu)', 304, 758, 216, 11, 'center')
  font(document, 'times.ttf')
  textAt(document, data.parishPriestName || '', 304, 792, 216, 11, 'center')
}

async function writePdf(filePath: string, input: any, data: any) {
  await new Promise<void>((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      margin: 24,
      info: { Title: titles[input.type] },
    })
    const stream = createWriteStream(filePath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    document.pipe(stream)
    setFont(document)
    if (input.type === 'baptism') {
      drawBaptismTemplate(document, input, data)
      document.end()
      return
    }
    if (input.type === 'confirmation') {
      drawConfirmationTemplate(document, input, data)
      document.end()
      return
    }
    if (input.type === 'marriage') {
      drawMarriageTemplate(document, input, data)
      document.end()
      return
    }
    const headerValue = (value: string) => value || 'Chưa cập nhật'
    document.fontSize(12).fillColor('#102A43').text(headerValue(data.dioceseName))
    document.fontSize(11).text(`Giáo hạt: ${headerValue(data.deaneryName)}`)
    document.fontSize(11).text(`Giáo xứ: ${headerValue(data.parishName)}`)
    document.fontSize(10).text(`Địa chỉ: ${headerValue(data.parishAddress)}`)
    document.fontSize(10).text(`Điện thoại: ${headerValue(data.parishPhone)}`)
    document.moveDown(1.4)
    document.fontSize(18).fillColor('#1F4E78').text(titles[input.type], { align: 'center' })
    document.moveDown(1.5)
    const registry = registryLine(input)
    if (registry) {
      document.fontSize(10).fillColor('#102A43').text(registry)
      document.moveDown(0.8)
    }
    document.fontSize(11).text(`${data.parishName} xác nhận:`)
    document.moveDown(0.7)
    line(
      document,
      '(Tên thánh, họ và tên)',
      `${data.person.holyName || 'Chưa cập nhật'}, ${data.person.fullName}`,
    )
    line(document, 'Sinh ngày', formatDate(data.person.birthDate))
    if (input.type === 'marriage')
      line(document, 'Người phối ngẫu', data.source.spouseFullName || 'Chưa cập nhật')
    line(
      document,
      input.type === 'baptism' ? 'Đã nhận Bí tích Rửa tội ngày' : 'Đã nhận Bí tích ngày',
      formatDate(data.source.date),
    )
    line(document, 'Tại Nhà thờ', data.source.place || 'Chưa cập nhật')
    line(document, 'Do Linh mục', data.source.minister || 'Chưa cập nhật')
    document.moveDown(0.7)
    line(document, 'Người đỡ đầu', data.source.sponsor || 'Chưa cập nhật')
    if (registry)
      line(document, input.type === 'baptism' ? 'Số Rửa tội số' : 'Số Thêm sức số', registry)
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
