import { ipcMain } from 'electron'
import { broadcast } from './broadcast.ts'
import { ok, toErrorEnvelope } from './envelope.ts'
import { appHandlers } from './app.ipc.ts'
import { backupHandlers } from './backup.ipc.ts'
import { dashboardHandlers } from './dashboard.ipc.ts'
import { familyHandlers } from './family.ipc.ts'
import { familyMemberHandlers } from './family-member.ipc.ts'
import { personHandlers } from './person.ipc.ts'
import { marriageHandlers } from './marriage.ipc.ts'
import { reportHandlers } from './report.ipc.ts'
import { searchHandlers } from './search.ipc.ts'
import { trashHandlers } from './trash.ipc.ts'
import { importHandlers } from './import.ipc.ts'
import { zoneHandlers } from './zone.ipc.ts'
import { settingHandlers } from './setting.ipc.ts'
import { activityLogHandlers } from './activity-log.ipc.ts'
import { certificateHandlers } from './certificate.ipc.ts'

/**
 * Bộ đăng ký handler IPC — `docs/01-architecture/ipc-communication.md` §8.
 *
 * @typedef {object} IpcHandler
 * @property {string} channel Hằng số lấy từ `CHANNELS`, không bao giờ là chuỗi viết thẳng
 * @property {{ parse: (payload: unknown) => unknown }} schema Schema Zod của kênh
 * @property {(input: any) => unknown | Promise<unknown>} handle Gọi Service — KHÔNG chứa nghiệp vụ
 * @property {boolean} [withMeta] Service trả `{ data, meta }` thay vì trả thẳng dữ liệu
 * @property {(data: any, input: any) => { channel: string, payload: unknown } | null} [event]
 *   Chỉ thao tác ghi mới có. Trả `null` khi lần gọi này không cần phát sự kiện
 */

/**
 * Bọc một handler theo đúng 5 bước, không bỏ bước nào:
 *
 *   1. Nhận payload
 *   2. VALIDATE bằng schema      -> sai thì trả VALIDATION_ERROR ngay
 *   3. Gọi Service               (handler KHÔNG chứa nghiệp vụ)
 *   4. Bọc kết quả vào envelope  { ok: true, data }
 *   5. Nếu là thao tác ghi       -> phát broadcast event
 *
 * Toàn bộ thân handler nằm trong `try/catch`: **không bao giờ throw xuyên ranh giới IPC**.
 * Riêng lời gọi `ipcMain.handle` thì cố ý để trần — đăng ký trùng một kênh phải làm app
 * ném lỗi ngay lúc khởi động, đó là hành vi mong muốn.
 *
 * @param {IpcHandler} handler
 */
function register({ channel, schema, handle, withMeta, event }: any) {
  ipcMain.handle(channel, async (_ipcEvent, payload) => {
    try {
      const input = schema.parse(payload)
      const result = await handle(input)

      const data = withMeta ? result.data : result
      const envelope = withMeta ? ok(data, result.meta) : ok(data)

      const broadcastEvent = event?.(data, input)
      if (broadcastEvent) broadcast(broadcastEvent.channel, broadcastEvent.payload)

      return envelope
    } catch (err) {
      return toErrorEnvelope(err)
    }
  })
}

/**
 * Đăng ký toàn bộ handler. Gọi **sau** khi DB sẵn sàng và **trước** khi tạo cửa sổ —
 * `overview.md` §6.1, bước 6.
 */
export function registerIpcHandlers() {
  const groups = [
    settingHandlers,
    activityLogHandlers,
    appHandlers,
    backupHandlers,
    dashboardHandlers,
    zoneHandlers,
    familyHandlers,
    personHandlers,
    marriageHandlers,
    familyMemberHandlers,
    reportHandlers,
    certificateHandlers,
    searchHandlers,
    trashHandlers,
    importHandlers,
  ]

  for (const group of groups) {
    for (const handler of group) register(handler)
  }
}
