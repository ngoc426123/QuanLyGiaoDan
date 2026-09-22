import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'

export const USER_DATA_DIRECTORY_NAME = 'Quan Ly Giao Dan'
const LEGACY_USER_DATA_DIRECTORY_NAME = 'elecrusion'

/**
 * Đổi tên thư mục AppData sau khi ứng dụng đổi thương hiệu mà không tách dữ liệu cũ ra
 * khỏi bản mới. `renameSync` trên cùng ổ đĩa là thao tác nguyên tử.
 */
export function migrateLegacyUserDataDirectory(
  appDataDirectory: string,
  userDataDirectory: string,
) {
  const legacyDirectory = join(appDataDirectory, LEGACY_USER_DATA_DIRECTORY_NAME)
  if (existsSync(userDataDirectory) || !existsSync(legacyDirectory)) return false

  renameSync(legacyDirectory, userDataDirectory)
  return true
}
