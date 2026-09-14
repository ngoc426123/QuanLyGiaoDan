import { AppError, ERROR_CODES } from '@shared/errors.js'
import * as settingRepository from '#/repositories/setting.repository.js'
import { now } from './clock.js'

/** Đọc cấu hình đã seed.
 * @returns {Record<string, unknown>}
 */
export function getAll() {
  return settingRepository.getAll()
}

/** Lưu lựa chọn giao diện, thao tác cuối cùng thắng theo hợp đồng setting:set.
 * @param {{ key: string, value: unknown }} input Payload đã validate ở biên IPC
 * @returns {{ key: string, value: unknown }}
 * @throws {AppError} Khi khoá không tồn tại
 */
export function setValue({ key, value }) {
  if (!settingRepository.setValue({ key, value, updatedAt: now() })) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Không tìm thấy khoá cài đặt')
  }
  return { key, value }
}
