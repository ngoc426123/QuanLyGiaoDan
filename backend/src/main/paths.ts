import { join } from 'node:path'
import { app } from 'electron'

/**
 * Mọi đường dẫn trong `userData` — khai báo **một chỗ**.
 *
 * Trước đây ba nơi tự ghép `data/app.db`; lệch một chữ là app đọc một file còn chức năng
 * nhập dữ liệu ghi đè một file khác. Luôn qua `app.getPath()` + `path.join()`, không bao
 * giờ hardcode (`storage-strategy.md` §3).
 *
 * @returns {{ userData: string, dataDir: string, dbFile: string, backupDir: string, logs: string }}
 */
export function userDataPaths() {
  const userData = app.getPath('userData')
  const dataDir = join(userData, 'data')

  return {
    userData,
    dataDir,
    dbFile: join(dataDir, 'app.db'),
    backupDir: join(userData, 'backups'),
    logs: app.getPath('logs'),
  }
}
