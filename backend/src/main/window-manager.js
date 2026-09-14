import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const DEFAULT_SIZE = { width: 1280, height: 800 }
const MIN_SIZE = { width: 940, height: 600 }

function intersects(bounds, area) {
  return (
    bounds.x < area.x + area.width &&
    bounds.x + bounds.width > area.x &&
    bounds.y < area.y + area.height &&
    bounds.y + bounds.height > area.y
  )
}

function fitBounds(bounds, area) {
  const width = Math.round(Math.min(Math.max(bounds.width, MIN_SIZE.width), area.width))
  const height = Math.round(Math.min(Math.max(bounds.height, MIN_SIZE.height), area.height))
  return {
    width,
    height,
    x: Math.round(Math.min(Math.max(bounds.x, area.x), area.x + area.width - width)),
    y: Math.round(Math.min(Math.max(bounds.y, area.y), area.y + area.height - height)),
  }
}

/** Kẹp cửa sổ vào màn hình hiện có, kể cả màn hình có toạ độ âm.
 * @param {object | null} saved Trạng thái đọc từ JSON, không tin cậy
 * @param {{ workArea: object }[]} displays Danh sách từ screen.getAllDisplays()
 * @param {{ workArea: object }} primary Màn hình chính
 * @returns {object} Bounds và trạng thái phóng to an toàn
 */
export function restoreWindowState(saved, displays, primary) {
  const valid =
    saved &&
    ['x', 'y', 'width', 'height'].every((key) => Number.isFinite(saved[key])) &&
    saved.width > 0 &&
    saved.height > 0
  const target = valid && displays.find(({ workArea }) => intersects(saved, workArea))
  if (target)
    return { ...fitBounds(saved, target.workArea), isMaximized: saved.isMaximized === true }
  const area = primary.workArea
  const centered = {
    ...DEFAULT_SIZE,
    x: area.x + (area.width - DEFAULT_SIZE.width) / 2,
    y: area.y + (area.height - DEFAULT_SIZE.height) / 2,
  }
  return { ...fitBounds(centered, area), isMaximized: false }
}

/** Đọc trước khi mở DB. JSON thiếu/hỏng không được ngăn app khởi động.
 * @param {string} filePath Đường dẫn từ app.getPath('userData')
 * @returns {object | null}
 */
export function readWindowState(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

/** Ghi nguyên tử file JSON nhỏ lúc đóng; không lưu trạng thái thu nhỏ.
 * @param {string} filePath Đường dẫn đích
 * @param {object} state Bounds bình thường và isMaximized
 * @returns {void}
 */
export function saveWindowState(filePath, state) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath + '.tmp', JSON.stringify(state), 'utf8')
  renameSync(filePath + '.tmp', filePath)
}
