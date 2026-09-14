import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { getDatabase } from '#/db/connection.ts'
import { LATEST_VERSION, backupDatabase } from '#/db/migrator.ts'
import {
  compareDatabases,
  exportDatabase,
  inspectDatabaseFile,
  replaceDatabaseFile,
} from '#/db/transfer.ts'
import { now } from './clock.ts'

/**
 * Nghiệp vụ xuất / nhập toàn bộ dữ liệu.
 *
 * Đây là tầng Service nhưng **không có Repository tương ứng**: đối tượng thao tác là *chính
 * file cơ sở dữ liệu*, không phải một thực thể nghiệp vụ. Vì vậy nó gọi thẳng xuống `db/`
 * như `db/bootstrap.js` — ngoại lệ đã ghi ở `project/decisions.md` §4.
 *
 * Không import `electron`: hộp thoại chọn file do tầng `ipc/` lo, đường dẫn truyền vào đây.
 */

/**
 * Xuất toàn bộ dữ liệu ra một file `.db` do người dùng chọn.
 *
 * @param {{ targetPath: string }} options
 * @returns {Promise<{ filePath: string, sizeBytes: number, exportedAt: string }>}
 */
export async function exportToFile({ targetPath }: any) {
  const result = await exportDatabase(getDatabase(), targetPath)

  return { ...result, exportedAt: now() }
}

/**
 * Nhập dữ liệu từ một file `.db`.
 *
 * **Thay trọn dữ liệu hiện có.** Thứ tự dưới đây là bắt buộc, đổi chỗ là mất dữ liệu:
 *
 * ```
 * 1. Soi file nguồn bằng kết nối CHỈ ĐỌC — hỏng hoặc thiếu bảng thì dừng ngay
 * 2. Chặn hạ cấp: file mới hơn bản build đang chạy thì TỪ CHỐI (storage-strategy.md §5.4)
 * 3. Sao lưu dữ liệu HIỆN TẠI vào backups/ — đường lui duy nhất của người dùng
 * 4. Đóng kết nối, thay file
 * ```
 *
 * Sau bước 4 ứng dụng **phải khởi động lại** để mở kết nối mới và chạy migration nếu file
 * nhập vào có schema cũ hơn. Việc khởi động lại do tầng `ipc/` thực hiện.
 *
 * @param {{ dbFile: string, sourcePath: string, backupDir: string }} options
 * @returns {Promise<{ sourcePath: string, safetyBackup: string, schemaVersion: number, recordCounts: Record<string, number> }>}
 */
export async function importFromFile({ dbFile, sourcePath, backupDir }: any) {
  if (resolveSame(dbFile, sourcePath)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Bạn đang chọn đúng file dữ liệu mà ứng dụng đang dùng',
    )
  }

  const info = inspectDatabaseFile(sourcePath)

  if (info.schemaVersion > LATEST_VERSION) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'File dữ liệu này được tạo bởi một phiên bản ứng dụng mới hơn. ' +
        'Hãy cập nhật ứng dụng trước khi nhập, nếu không dữ liệu sẽ hỏng.',
      { schemaVersion: info.schemaVersion, supportedVersion: LATEST_VERSION },
    )
  }

  // Sao lưu dữ liệu đang có TRƯỚC khi đụng vào bất cứ thứ gì.
  const safetyBackup = await backupDatabase(getDatabase(), backupDir, now())

  replaceDatabaseFile({ dbFile, sourcePath })

  return {
    sourcePath,
    safetyBackup,
    schemaVersion: info.schemaVersion,
    recordCounts: info.recordCounts,
  }
}

/** So sánh đường dẫn không phân biệt hoa thường — Windows coi hai cách viết là một file. */
function resolveSame(left, right) {
  return left.toLowerCase() === right.toLowerCase()
}

/**
 * Soi file trước khi nhập và **đối chiếu với dữ liệu hiện có**.
 *
 * Mỗi người một máy nghĩa là hai bản dữ liệu chạy song song và luôn lệch nhau. Nhập là
 * thay trọn — quyết định đã chốt (P18) — nhưng người dùng phải thấy rõ mình sắp mất gì
 * trước khi đồng ý, chứ không chỉ thấy file mới có bao nhiêu bản ghi.
 *
 * @param {{ sourcePath: string, dbFile?: string }} options
 */
export function inspectFile({ sourcePath, dbFile }: any) {
  const info = inspectDatabaseFile(sourcePath)

  if (!dbFile) return info

  return { ...info, divergence: compareDatabases({ dbFile, sourcePath }) }
}

/** Một dòng đếm: "12 giáo họ · 340 hộ · 1204 giáo dân". */
function describeCounts(counts) {
  return counts.zones + ' giáo họ · ' + counts.families + ' hộ · ' + counts.persons + ' giáo dân'
}

/** Liệt kê theo bảng, bỏ bảng có 0 bản ghi: "2 hộ, 6 giáo dân". */
function describeBreakdown(record) {
  const labels = [
    ['zones', 'giáo họ'],
    ['families', 'hộ'],
    ['persons', 'giáo dân'],
  ]

  return labels
    .filter(([key]) => record[key] > 0)
    .map(([key, label]) => record[key] + ' ' + label)
    .join(', ')
}

/**
 * Nội dung cảnh báo trước khi thay dữ liệu — chuỗi hiển thị được trực tiếp, giống mọi
 * thông điệp lỗi khác của Backend.
 *
 * Đặt ở tầng Service chứ không ở `ipc/` vì đây là thứ **duy nhất** đứng giữa một cú bấm
 * nhầm và việc xoá mất công nhập liệu của người khác — nó phải có test, mà `ipc/` thì import
 * `electron` nên không chạy được bằng Node thuần.
 *
 * Mỗi người một máy nghĩa là hai bản dữ liệu luôn lệch nhau. Đây là thứ duy nhất đứng giữa
 * một cú bấm nhầm và việc xoá mất công nhập liệu của người khác, nên phải nói thẳng con số
 * chứ không nói chung chung.
 */
export function describeImportWarning(info) {
  const lines = ['File sắp nhập:   ' + describeCounts(info.recordCounts)]
  const divergence = info.divergence

  if (divergence) {
    lines.push('Dữ liệu máy này: ' + describeCounts(divergence.current))
    lines.push('')

    if (divergence.onlyInCurrent.total > 0) {
      lines.push(
        '⚠ ' +
          divergence.onlyInCurrent.total +
          ' bản ghi chỉ có trên máy này sẽ bị XOÁ (' +
          describeBreakdown(divergence.onlyInCurrent) +
          ').',
      )
    }

    if (divergence.newerInCurrent.total > 0) {
      lines.push(
        '⚠ ' +
          divergence.newerInCurrent.total +
          ' bản ghi trên máy này mới hơn sẽ bị LÙI VỀ bản trong file (' +
          describeBreakdown(divergence.newerInCurrent) +
          ').',
      )
    }

    if (divergence.currentIsNewer) {
      lines.push('⚠ Máy này có thay đổi mới hơn file bạn sắp nhập.')
    }

    if (divergence.onlyInCurrent.total === 0 && divergence.newerInCurrent.total === 0) {
      lines.push('Không có bản ghi nào trên máy này bị mất.')
    }
  }

  lines.push('')
  lines.push(
    'Dữ liệu hiện tại được sao lưu vào thư mục backups trước khi thay, và ứng dụng sẽ khởi động lại sau khi nhập xong.',
  )

  return lines.join('\n')
}
