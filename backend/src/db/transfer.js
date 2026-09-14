import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { AppError, ERROR_CODES } from '@shared/errors.js'
import { closeDatabase } from './connection.js'
import { LATEST_VERSION } from './migrations/index.js'

/**
 * Xuất và nhập **toàn bộ file cơ sở dữ liệu** — nguyên thuỷ ở tầng vòng đời DB, cùng tầng
 * với `migrator.js` và `bootstrap.js`. Không import `electron`: mọi đường dẫn nhận qua tham số.
 *
 * Đây là thao tác **phá huỷ**: nhập một file là thay trọn dữ liệu hiện có. Mọi lớp kiểm tra
 * ở đây tồn tại để một cú bấm nhầm không xoá sổ dữ liệu của giáo xứ.
 */

/** Năm bảng bắt buộc phải có thì file mới được coi là DB của ứng dụng này. */
const REQUIRED_TABLES = Object.freeze([
  'families',
  'family_members',
  'persons',
  'settings',
  'zones',
])

const SIDECAR_SUFFIXES = Object.freeze(['-wal', '-shm'])

/**
 * Soi một file `.db` mà **không** mở kết nối ghi. Dùng trước khi nhập, và cũng dùng để
 * hiển thị thông tin file cho người dùng xem trước khi quyết định.
 *
 * @param {string} filePath
 * @returns {{ schemaVersion: number, tables: string[], sizeBytes: number, recordCounts: Record<string, number> }}
 */
export function inspectDatabaseFile(filePath) {
  if (!existsSync(filePath)) {
    throw new AppError(ERROR_CODES.IO_ERROR, 'Không tìm thấy file dữ liệu đã chọn', { filePath })
  }

  let probe

  try {
    probe = new Database(filePath, { readonly: true, fileMustExist: true })
  } catch (cause) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'File đã chọn không phải là file dữ liệu của Elecrusion',
      { reason: cause.message },
    )
  }

  // SQLite mở file **lười**: `new Database()` trên một file rác vẫn thành công, lỗi
  // "file is not a database" chỉ nổ ở truy vấn đầu tiên. Nên mọi lỗi lạ từ đây trở xuống
  // đều phải quy về "file không hợp lệ", không để `SqliteError` thô lọt ra ngoài.
  try {
    const integrity = probe.pragma('integrity_check', { simple: true })

    if (integrity !== 'ok') {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'File dữ liệu đã chọn bị hỏng', {
        integrity,
      })
    }

    const tables = probe
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((row) => row.name)
      .sort()

    const missing = REQUIRED_TABLES.filter((table) => !tables.includes(table))

    if (missing.length > 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'File đã chọn không phải là file dữ liệu của Elecrusion (thiếu bảng ' +
          missing.join(', ') +
          ')',
        { missing },
      )
    }

    const recordCounts = {}
    for (const table of ['zones', 'families', 'persons']) {
      recordCounts[table] = probe
        .prepare('SELECT COUNT(*) AS total FROM ' + table + ' WHERE deleted_at IS NULL')
        .get().total
    }

    return {
      schemaVersion: probe.pragma('user_version', { simple: true }),
      tables,
      sizeBytes: statSync(filePath).size,
      recordCounts,
    }
  } catch (cause) {
    if (cause instanceof AppError) throw cause

    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'File đã chọn không phải là file dữ liệu của Elecrusion',
      { reason: cause.message },
    )
  } finally {
    probe.close()
  }
}

/**
 * Xuất ra file bằng **API backup của SQLite** — an toàn ngay cả khi DB đang mở và đang có
 * giao dịch chạy. Copy file thô bằng `fs` lúc DB đang mở sẽ ra bản sao hỏng
 * (`storage-strategy.md` §6).
 *
 * @param {import('better-sqlite3').Database} db Kết nối đang mở
 * @param {string} targetPath
 * @returns {Promise<{ filePath: string, sizeBytes: number }>}
 */
export async function exportDatabase(db, targetPath) {
  mkdirSync(dirname(targetPath), { recursive: true })

  try {
    await db.backup(targetPath)
  } catch (cause) {
    throw new AppError(ERROR_CODES.IO_ERROR, 'Không ghi được file dữ liệu ra vị trí đã chọn', {
      filePath: targetPath,
      reason: cause.message,
    })
  }

  return { filePath: targetPath, sizeBytes: statSync(targetPath).size }
}

/**
 * Thay file DB hiện tại bằng file nguồn.
 *
 * Đóng kết nối trước, chép sang file tạm rồi mới đổi tên đè — để nếu đứt giữa chừng thì
 * file cũ hoặc còn nguyên, hoặc đã có bản sao an toàn do tầng trên tạo trước đó.
 * Hai file `-wal` / `-shm` **phải** bị xoá theo, nếu không SQLite sẽ ghép WAL của DB cũ
 * vào DB mới và làm hỏng dữ liệu vừa nhập.
 *
 * @param {{ dbFile: string, sourcePath: string }} options
 */
export function replaceDatabaseFile({ dbFile, sourcePath }) {
  const incoming = dbFile + '.incoming'

  closeDatabase()

  try {
    copyFileSync(sourcePath, incoming)
  } catch (cause) {
    rmSync(incoming, { force: true })

    throw new AppError(ERROR_CODES.IO_ERROR, 'Không chép được file dữ liệu đã chọn', {
      reason: cause.message,
    })
  }

  try {
    rmSync(dbFile, { force: true })
    for (const suffix of SIDECAR_SUFFIXES) rmSync(dbFile + suffix, { force: true })

    renameSync(incoming, dbFile)
  } catch (cause) {
    throw new AppError(
      ERROR_CODES.IO_ERROR,
      'Không thay được file dữ liệu. Hãy đóng ứng dụng rồi thử lại; bản sao an toàn vẫn nằm trong thư mục backups.',
      { reason: cause.message },
    )
  }
}

export { LATEST_VERSION }

/** Ba bảng nghiệp vụ đem ra đối chiếu. Danh sách cứng — không nhận từ bên ngoài. */
const COMPARED_TABLES = Object.freeze(['zones', 'families', 'persons'])

/**
 * Đối chiếu dữ liệu **hiện tại** với dữ liệu trong file sắp nhập.
 *
 * Dùng cho tình huống 2–3 người mỗi người một máy: nhập là **thay trọn**, nên người dùng
 * cần biết chính xác họ sắp mất gì trước khi bấm đồng ý. Hai con số quan trọng nhất:
 *
 * - `onlyInCurrent` — bản ghi chỉ có ở máy này, nhập xong là **biến mất**
 * - `newerInCurrent` — bản ghi cả hai bên đều có nhưng máy này sửa sau, nhập xong bị **lùi về bản cũ**
 *
 * Mở file nguồn bằng kết nối **chỉ đọc** rồi `ATTACH` file hiện tại vào — kết nối readonly
 * thì database đính kèm cũng readonly, nên không có đường nào ghi nhầm vào dữ liệu thật.
 *
 * @param {{ dbFile: string, sourcePath: string }} options
 */
export function compareDatabases({ dbFile, sourcePath }) {
  const probe = new Database(sourcePath, { readonly: true, fileMustExist: true })

  try {
    probe.prepare('ATTACH DATABASE ? AS present').run(dbFile)

    const counts = (schema) => {
      const result = {}
      for (const table of COMPARED_TABLES) {
        result[table] = probe
          .prepare(
            'SELECT COUNT(*) AS total FROM ' + schema + '.' + table + ' WHERE deleted_at IS NULL',
          )
          .get().total
      }
      return result
    }

    const lastUpdatedAt = (schema) => {
      let latest = null
      for (const table of COMPARED_TABLES) {
        const value = probe
          .prepare('SELECT MAX(updated_at) AS latest FROM ' + schema + '.' + table)
          .get().latest
        if (value && (latest === null || value > latest)) latest = value
      }
      return latest
    }

    const onlyInCurrent = {}
    const newerInCurrent = {}

    for (const table of COMPARED_TABLES) {
      onlyInCurrent[table] = probe
        .prepare(
          'SELECT COUNT(*) AS total FROM present.' +
            table +
            ' c' +
            ' WHERE c.deleted_at IS NULL' +
            ' AND NOT EXISTS (SELECT 1 FROM main.' +
            table +
            ' i WHERE i.id = c.id)',
        )
        .get().total

      newerInCurrent[table] = probe
        .prepare(
          'SELECT COUNT(*) AS total FROM present.' +
            table +
            ' c' +
            ' JOIN main.' +
            table +
            ' i ON i.id = c.id' +
            ' WHERE c.deleted_at IS NULL AND c.updated_at > i.updated_at',
        )
        .get().total
    }

    const sum = (record) => Object.values(record).reduce((total, value) => total + value, 0)

    return {
      current: { ...counts('present'), lastUpdatedAt: lastUpdatedAt('present') },
      incoming: { ...counts('main'), lastUpdatedAt: lastUpdatedAt('main') },
      onlyInCurrent: { ...onlyInCurrent, total: sum(onlyInCurrent) },
      newerInCurrent: { ...newerInCurrent, total: sum(newerInCurrent) },
      currentIsNewer:
        Boolean(lastUpdatedAt('present')) &&
        (lastUpdatedAt('main') === null || lastUpdatedAt('present') > lastUpdatedAt('main')),
    }
  } finally {
    try {
      probe.prepare('DETACH DATABASE present').run()
    } catch {
      // Kết nối sắp đóng ngay sau đây, DETACH hỏng cũng không để lại hậu quả gì.
    }
    probe.close()
  }
}
