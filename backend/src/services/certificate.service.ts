import { createWriteStream, existsSync } from 'node:fs'
import PDFDocument from 'pdfkit'
import * as certificateRepository from '#/repositories/certificate.repository.ts'
import * as marriageRepository from '#/repositories/marriage.repository.ts'
import * as personRepository from '#/repositories/person.repository.ts'
import * as sacramentRepository from '#/repositories/sacrament.repository.ts'
import * as settingRepository from '#/repositories/setting.repository.ts'
import * as personParentRepository from '#/repositories/person-parent.repository.ts'
import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { now } from './clock.ts'
import { newId, pageMeta } from './service-helpers.ts'

const titles = Object.freeze({
  baptism: 'CHỨNG THƯ RỬA TỘI',
  confirmation: 'CHỨNG THƯ THÊM SỨC',
  marriage: 'CHỨNG THƯ HÔN PHỐI',
})

const CERTIFICATE_MARGINS = Object.freeze({ top: 22, right: 22, bottom: 22, left: 22 })

function formatDate(value: string | null) {
  if (!value) return 'Chưa cập nhật'
  const [year, month, day] = value.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

function requireCertificateData(input: any) {
  const attachParents = (value: any) => {
    if (!value) return value
    const rows = personParentRepository.findByChildId(value.id)
    return {
      ...value,
      fatherName:
        value.personType === 'external'
          ? value.fatherName
          : (rows.find((row) => row.role === 'father')?.fullName ?? null),
      motherName:
        value.personType === 'external'
          ? value.motherName
          : (rows.find((row) => row.role === 'mother')?.fullName ?? null),
    }
  }
  const person = attachParents(personRepository.findById(input.personId))
  if (!person) throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy giáo dân')
  const sacramentRecords = sacramentRepository.findByPersonId(person.id)
  const marriageHistory =
    input.type === 'marriage' ? marriageRepository.findManyByPersonId(person.id) : []
  const source =
    input.type === 'marriage'
      ? input.marriageId
        ? marriageHistory.find((record: any) => record.id === input.marriageId)
        : marriageHistory[0]
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
        ? attachParents(personRepository.findById(source.spouseId))
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

function textAt(
  document: any,
  value: string,
  x: number,
  y: number,
  width = 500,
  size = 12,
  align: 'left' | 'center' | 'right' = 'left',
) {
  const layout = document.marriageCoordinateLayout
  const targetX = layout ? layout.x(x) : x
  const targetWidth = layout ? layout.width(width) : width
  document
    .fontSize(size)
    .fillColor('#111')
    .text(value || '', targetX, y, { width: targetWidth, align, lineBreak: false })
}

function labelAt(
  document: any,
  value: string,
  x: number,
  y: number,
  width: number,
  align: 'left' | 'center' | 'right' = 'left',
) {
  font(document, 'timesbd.ttf')
  textAt(document, value, x, y, width, 12, align)
  font(document, 'times.ttf')
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
  labelAt(document, '(Tên thánh, họ và tên)', 36, 235, 150)
  textAt(document, personName(data), 190, 235, 365, 12)
  drawRule(document, 190, 252, 520)
  labelAt(document, 'Sinh ngày:', 36, 256, 90)
  textAt(document, formatDate(data.person.birthDate), 110, 256, 165, 12)
  drawRule(document, 110, 273, 250)
  textAt(document, `tại ${data.person.birthPlace || '(tỉnh/thành phố)'}`, 292, 256, 150, 12)
  drawRule(document, 430, 273, 520)
  labelAt(document, 'Con ông (tên thánh, họ tên):', 36, 277, 180)
  textAt(document, data.person.fatherName || '', 190, 277, 330, 12)
  drawRule(document, 190, 294, 520)
  labelAt(document, 'và bà (tên thánh, họ tên):', 36, 300, 180)
  textAt(document, data.person.motherName || '', 190, 300, 330, 12)
  drawRule(document, 190, 317, 520)
  labelAt(document, 'Đã nhận Bí tích Rửa tội ngày:', 36, 323, 210)
  textAt(document, formatDate(data.source.date), 270, 323, 75, 12)
  drawRule(document, 270, 338, 345)
  textAt(document, 'tại Nhà thờ', 350, 323, 90, 12)
  textAt(document, data.source.place || '', 430, 323, 90, 12)
  drawRule(document, 430, 338, 520)
  labelAt(document, 'Do Linh mục:', 36, 346, 100)
  textAt(document, data.source.minister || '', 145, 346, 375, 12)
  drawRule(document, 145, 363, 520)
  labelAt(document, 'Người đỡ đầu (tên thánh, họ tên):', 36, 369, 235)
  textAt(document, data.source.sponsor || '', 285, 369, 235, 12)
  drawRule(document, 285, 386, 520)
  labelAt(document, 'Số Rửa tội số:', 36, 392, 110)
  textAt(document, registryLine(input), 155, 392, 365, 12)
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
    304,
    500,
    216,
    12,
    'center',
  )
  labelAt(document, 'Linh mục quản xứ', 304, 524, 216, 'center')
  font(document, 'timesi.ttf')
  textAt(document, '(ký tên, đóng dấu)', 304, 539, 216, 12, 'center')
  font(document, 'times.ttf')
  textAt(document, data.parishPriestName || '', 304, 643, 216, 12, 'center')
}

function drawConfirmationTemplate(document: any, input: any, data: any) {
  sampleHeader(document, data)
  sampleTitle(document, 'CHỨNG CHỈ THÊM SỨC')
  font(document, 'times.ttf')
  labelAt(document, '(Tên thánh, họ và tên)', 36, 235, 150)
  textAt(document, personName(data), 190, 235, 365, 12)
  drawRule(document, 190, 252, 520)
  labelAt(document, 'Sinh ngày:', 36, 256, 90)
  textAt(document, formatDate(data.person.birthDate), 110, 256, 165, 12)
  drawRule(document, 110, 271, 250)
  textAt(document, `tại ${data.person.birthPlace || '(tỉnh/thành phố)'}`, 292, 256, 150, 12)
  drawRule(document, 430, 271, 520)
  labelAt(document, 'Con ông (tên thánh, họ tên):', 36, 277, 180)
  textAt(document, data.person.fatherName || '', 190, 277, 330, 12)
  drawRule(document, 190, 292, 520)
  labelAt(document, 'và bà (tên thánh, họ tên):', 36, 300, 180)
  textAt(document, data.person.motherName || '', 190, 300, 330, 12)
  drawRule(document, 190, 317, 520)
  labelAt(document, 'Đã nhận Bí tích Rửa tội ngày:', 36, 323, 210)
  textAt(document, formatDate(data.baptismSource?.date), 270, 323, 75, 12)
  drawRule(document, 270, 338, 345)
  textAt(document, 'tại Nhà thờ', 350, 323, 90, 12)
  textAt(document, data.baptismSource?.place || '', 430, 323, 90, 12)
  drawRule(document, 430, 338, 520)
  labelAt(document, 'Đã nhận Bí tích Thêm sức ngày:', 36, 346, 220)
  textAt(document, formatDate(data.source.date), 270, 346, 75, 12)
  drawRule(document, 270, 361, 345)
  textAt(document, 'tại Nhà thờ', 350, 346, 90, 12)
  textAt(document, data.source.place || '', 430, 346, 90, 12)
  drawRule(document, 430, 361, 520)
  labelAt(document, 'Do TGM/ĐGM/LM:', 36, 369, 145)
  textAt(document, data.source.minister || '', 145, 369, 375, 12)
  drawRule(document, 145, 386, 520)
  labelAt(document, 'Người đỡ đầu (tên thánh, họ tên):', 36, 392, 235)
  textAt(document, data.source.sponsor || '', 285, 392, 235, 12)
  drawRule(document, 285, 409, 520)
  labelAt(document, 'Số Thêm sức số:', 36, 415, 125)
  textAt(document, registryLine(input), 155, 415, 365, 12)
  drawRule(document, 155, 432, 520)
  drawRule(document, 36, 459, 520)
  textAt(
    document,
    `Giáo xứ ${parishLabel(data.parishName)}, ngày ${formatDate(now())}`,
    304,
    500,
    216,
    12,
    'center',
  )
  labelAt(document, 'Linh mục quản xứ', 304, 524, 216, 'center')
  font(document, 'timesi.ttf')
  textAt(document, '(ký tên, đóng dấu)', 304, 539, 216, 12, 'center')
  font(document, 'times.ttf')
  textAt(document, data.parishPriestName || '', 304, 643, 216, 12, 'center')
}

function marriagePersonByGender(data: any, gender: 'male' | 'female', fallback: any) {
  const people = [data.person, data.spouse].filter(Boolean)
  const matchesGender = (person: any) => {
    const value = String(person.gender || '').trim().toLowerCase()
    return gender === 'male' ? value === 'male' || value === 'nam' : value === 'female' || value === 'nữ'
  }
  return people.find(matchesGender) ?? fallback
}

function marriageBirthParish(person: any, parishName: string) {
  if (person?.personType === 'external') return String(person.parishName || '').trim()
  return String(parishName || '').trim()
}

function sacramentFor(person: any, records: any[], type: string) {
  if (!person) return null
  const record = records.find((item: any) => item.type === type)
  if (record) return record

  // Người phối ngẫu ngoài giáo xứ không có hồ sơ bí tích riêng; thông tin này được
  // lưu cùng hôn phối để vẫn có thể hiện trên chứng thư.
  const isBaptism = type === 'baptism'
  const date = isBaptism ? person.baptismDate : person.confirmationDate
  const place = isBaptism ? person.baptismPlace : person.confirmationPlace
  return date || place ? { date, place } : null
}

const MARRIAGE_BODY_SIZE = 12
const MARRIAGE_TOP_MARGIN = 22
const MARRIAGE_BOTTOM_MARGIN = 22
const MARRIAGE_LINE_SPACING_SCALE = 0.96

function marriageY(document: any, value: number) {
  const sourceTop = 50
  return MARRIAGE_TOP_MARGIN + (value - sourceTop) * MARRIAGE_LINE_SPACING_SCALE
}

function marriageSignatureY(document: any) {
  return document.page.height - MARRIAGE_BOTTOM_MARGIN - MARRIAGE_BODY_SIZE * 1.2
}

function marriageHeaderY(line: number) {
  return MARRIAGE_TOP_MARGIN + line * 15
}

function dottedRule(document: any, x1: number, y: number, x2: number) {
  const layout = document.marriageCoordinateLayout
  const startX = layout ? layout.x(x1) : x1
  const endX = layout ? layout.x(x2) : x2
  document
    .save()
    .strokeColor('#444')
    .lineWidth(0.55)
    .dash(1.2, { space: 1.8 })
    .moveTo(startX, y)
    .lineTo(endX, y)
    .stroke()
    .undash()
    .restore()
}

function marriageField(document: any, label: string, value: string, y: number, options: any = {}) {
  const labelWidth = options.labelWidth ?? 112
  const valueX = options.valueX ?? 150
  const valueWidth = options.valueWidth ?? 370
  font(document, 'timesbd.ttf')
  textAt(document, label, 54, y, labelWidth, MARRIAGE_BODY_SIZE)
  font(document, 'times.ttf')
  textAt(document, value || '', valueX, y, valueWidth, MARRIAGE_BODY_SIZE)
  dottedRule(document, valueX, y + 16, options.ruleX2 ?? 520)
}

function marriageRegistryLine(input: any) {
  if (![input.registerBook, input.registerPage, input.registerEntry].some(Boolean)) return ''
  return `Quyển: ${input.registerBook || '—'}     Tờ: ${input.registerPage || '—'}     STT: ${input.registerEntry || '—'}`
}

function drawMarriageTemplate(document: any, input: any, data: any) {
  const sourceLeft = 36
  const sourceRight = 550
  const availableWidth = document.page.width - CERTIFICATE_MARGINS.left - CERTIFICATE_MARGINS.right
  const scaleX = availableWidth / (sourceRight - sourceLeft)
  document.marriageCoordinateLayout = {
    x: (value: number) => CERTIFICATE_MARGINS.left + (value - sourceLeft) * scaleX,
    width: (value: number) => value * scaleX,
  }
  const y = (value: number) => marriageY(document, value)
  const selectedIsFemale = ['female', 'nữ'].includes(String(data.person.gender || '').trim().toLowerCase())
  const male = marriagePersonByGender(data, 'male', selectedIsFemale ? data.spouse : data.person)
  const female = marriagePersonByGender(data, 'female', selectedIsFemale ? data.person : data.spouse)
  const maleSacraments = male === data.person ? data.sacramentRecords : data.spouseSacraments
  const femaleSacraments = female === data.person ? data.sacramentRecords : data.spouseSacraments
  const maleBaptism = sacramentFor(male, maleSacraments, 'baptism')
  const maleConfirmation = sacramentFor(male, maleSacraments, 'confirmation')
  const femaleBaptism = sacramentFor(female, femaleSacraments, 'baptism')
  const femaleConfirmation = sacramentFor(female, femaleSacraments, 'confirmation')

  font(document, 'timesbd.ttf')
  textAt(document, data.dioceseName || '', 54, marriageHeaderY(0), 155, MARRIAGE_BODY_SIZE)
  font(document, 'times.ttf')
  textAt(
    document,
    `Giáo hạt: ${data.deaneryName || ''}`,
    54,
    marriageHeaderY(1),
    155,
    MARRIAGE_BODY_SIZE,
  )
  textAt(
    document,
    `Giáo xứ: ${data.parishName || ''}`,
    54,
    marriageHeaderY(2),
    155,
    MARRIAGE_BODY_SIZE,
  )
  textAt(
    document,
    `Địa chỉ: ${data.parishAddress || ''}`,
    54,
    marriageHeaderY(3),
    190,
    MARRIAGE_BODY_SIZE,
  )
  font(document, 'timesbd.ttf')
  textAt(document, 'CHỨNG THƯ HÔN PHỐI', 245, y(62), 305, 20, 'center')
  font(document, 'times.ttf')
  textAt(document, 'Tôi, Linh mục:', 54, y(182), 90, MARRIAGE_BODY_SIZE)
  textAt(document, data.parishPriestName || '', 150, y(182), 370, MARRIAGE_BODY_SIZE)
  dottedRule(document, 150, y(199), 520)

  font(document, 'timesbd.ttf')
  textAt(document, 'CHỨNG NHẬN', 36, y(214), 484, 19, 'center')
  font(document, 'times.ttf')
  marriageField(document, 'Bên Nam', personName({ person: male }), y(251))
  marriageField(document, 'Sinh ngày', formatDate(male?.birthDate), y(272))
  textAt(
    document,
    `tại ${marriageBirthParish(male, data.parishName)}`,
    315,
    y(272),
    205,
    MARRIAGE_BODY_SIZE,
  )
  marriageField(document, 'Rửa tội ngày', formatDate(maleBaptism?.date), y(293))
  marriageField(document, 'Thêm sức ngày', formatDate(maleConfirmation?.date), y(314))
  marriageField(document, 'Cha', male?.fatherName || '', y(335))
  marriageField(document, 'Mẹ', male?.motherName || '', y(356))
  marriageField(document, 'Thuộc Giáo họ', male?.zoneName || '', y(377))
  textAt(document, 'Giáo xứ', 320, y(377), 65, MARRIAGE_BODY_SIZE)
  textAt(document, male?.parishName || data.parishName || '', 386, y(377), 134, MARRIAGE_BODY_SIZE)
  textAt(document, `tại ${maleBaptism?.place || ''}`, 315, y(293), 205, MARRIAGE_BODY_SIZE)
  textAt(document, `tại ${maleConfirmation?.place || ''}`, 315, y(314), 205, MARRIAGE_BODY_SIZE)

  marriageField(document, 'Bên Nữ', personName({ person: female }), y(405))
  marriageField(document, 'Sinh ngày', formatDate(female?.birthDate), y(426))
  textAt(
    document,
    `tại ${marriageBirthParish(female, data.parishName)}`,
    315,
    y(426),
    205,
    MARRIAGE_BODY_SIZE,
  )
  marriageField(document, 'Rửa tội ngày', formatDate(femaleBaptism?.date), y(447))
  marriageField(document, 'Thêm sức ngày', formatDate(femaleConfirmation?.date), y(468))
  marriageField(document, 'Cha', female?.fatherName || '', y(489))
  marriageField(document, 'Mẹ', female?.motherName || '', y(510))
  marriageField(document, 'Thuộc Giáo họ', female?.zoneName || '', y(531))
  textAt(document, 'Giáo xứ', 320, y(531), 65, MARRIAGE_BODY_SIZE)
  textAt(
    document,
    female?.parishName || data.parishName || '',
    386,
    y(531),
    134,
    MARRIAGE_BODY_SIZE,
  )
  textAt(document, `tại ${femaleBaptism?.place || ''}`, 315, y(447), 205, MARRIAGE_BODY_SIZE)
  textAt(document, `tại ${femaleConfirmation?.place || ''}`, 315, y(468), 205, MARRIAGE_BODY_SIZE)

  font(document, 'timesbd.ttf')
  textAt(document, 'ĐÃ CỬ HÀNH BÍ TÍCH HÔN PHỐI', 36, y(561), 484, 15, 'center')
  font(document, 'times.ttf')
  marriageField(document, 'Vào ngày', formatDate(data.source.date), y(586))
  marriageField(document, 'Tại', data.source.place || '', y(607))
  marriageField(document, 'Trước mặt người chứng hôn', data.source.minister || '', y(628), {
    labelWidth: 220,
    valueX: 275,
    valueWidth: 245,
  })
  marriageField(document, 'Người chứng thứ nhất', data.source.witnessOne || '', y(649), {
    labelWidth: 220,
    valueX: 275,
    valueWidth: 245,
  })
  marriageField(document, 'Người chứng thứ hai', data.source.witnessTwo || '', y(670), {
    labelWidth: 220,
    valueX: 275,
    valueWidth: 245,
  })
  const registry = marriageRegistryLine(input)
  marriageField(document, 'Trích sổ Hôn phối Giáo xứ', registry, y(691), {
    labelWidth: 220,
    valueX: 275,
    valueWidth: 245,
  })
  textAt(
    document,
    `Giáo xứ ${parishLabel(data.parishName)}, ngày ${formatDate(now())}`,
    304,
    y(718),
    216,
    MARRIAGE_BODY_SIZE,
    'center',
  )
  font(document, 'timesbd.ttf')
  textAt(document, 'Linh mục quản xứ', 304, y(742), 216, MARRIAGE_BODY_SIZE, 'center')
  font(document, 'timesi.ttf')
  textAt(document, '(ký tên, đóng dấu)', 304, y(758), 216, MARRIAGE_BODY_SIZE, 'center')
  font(document, 'times.ttf')
  textAt(
    document,
    data.parishPriestName || '',
    304,
    marriageSignatureY(document),
    216,
    MARRIAGE_BODY_SIZE,
    'center',
  )
  delete document.marriageCoordinateLayout
}

async function writePdf(filePath: string, input: any, data: any) {
  await new Promise<void>((resolve, reject) => {
    const document = new PDFDocument({
      size: 'A4',
      margins: CERTIFICATE_MARGINS,
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
    snapshotJson: JSON.stringify({
      person: data.person,
      spouse: data.spouse,
      source: data.source,
      sacramentRecords: data.sacramentRecords,
      spouseSacraments: data.spouseSacraments,
    }),
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
