# Quy tắc giao tiếp IPC

> **Phạm vi**: Cách Renderer và Main Process trao đổi dữ liệu. Đây là **hợp đồng (contract)** giữa hai tầng — mọi thay đổi ở đây phải được cập nhật đồng thời ở cả 3 nơi: `shared/channels.js`, handler ở Main, và preload.

---

## 1. Ba kiểu giao tiếp và khi nào dùng

| Kiểu | Cơ chế | Chiều | Dùng khi |
|---|---|---|---|
| **Request / Response** | `ipcRenderer.invoke` ↔ `ipcMain.handle` | Renderer → Main → Renderer | **Mặc định cho 95% trường hợp.** Mọi thao tác CRUD, đọc cấu hình, mở dialog. |
| **Broadcast / Event** | `webContents.send` → `ipcRenderer.on` | Main → Renderer | Thông báo dữ liệu đã đổi, tiến độ tác vụ nền, trạng thái cập nhật. |
| **Fire-and-forget** | `ipcRenderer.send` → `ipcMain.on` | Renderer → Main | Chỉ dùng cho telemetry/log không cần phản hồi. **Hạn chế tối đa.** |

> **Cấm tuyệt đối**: `ipcRenderer.sendSync`. Nó block toàn bộ luồng render, gây treo giao diện.

---

## 2. Quy ước đặt tên kênh

### 2.1. Cú pháp

```
<domain>:<action>          // Request/Response
event:<domain>-<event>     // Broadcast từ Main
```

- `domain`: danh từ số ít, kebab-case — `invoice`, `customer`, `line-item`, `app`, `setting`.
- `action`: động từ, camelCase — `list`, `getById`, `create`, `update`, `remove`, `reorder`.
- Event dùng **quá khứ / trạng thái đã xảy ra**: `event:invoice-changed`, `event:import-progress`.

### 2.2. Ví dụ đúng / sai

| Đúng | Sai | Vì sao sai |
|---|---|---|
| `invoice:list` | `getInvoices` | Thiếu namespace, dễ đụng tên |
| `invoice:create` | `invoice:createInvoice` | Lặp lại domain |
| `customer:remove` | `customer:delete` | `delete` là từ khoá JS, tránh dùng |
| `event:invoice-changed` | `invoiceChanged` | Không phân biệt được với kênh request |
| `line-item:add` | `lineItem:add` | Domain phải kebab-case |

### 2.3. Nguồn chân lý duy nhất

Mọi tên kênh **phải** được khai báo tập trung tại `shared/channels.js` (gốc repo) dưới dạng hằng số. Main, preload và (nếu cần) Renderer đều import từ đây.

**Cấm viết chuỗi tên kênh trực tiếp (magic string) ở bất kỳ đâu khác.** Lý do: gõ sai một ký tự sẽ tạo ra lỗi im lặng rất khó truy vết.

Cấu trúc đề xuất của file hằng số:

```
CHANNELS = {
  INVOICE:  { LIST, GET_BY_ID, CREATE, UPDATE, REMOVE },
  CUSTOMER: { LIST, GET_BY_ID, CREATE, UPDATE, REMOVE },
  APP:      { GET_VERSION, GET_PATHS, OPEN_EXTERNAL, SHOW_OPEN_DIALOG },
  SETTING:  { GET_ALL, SET },
  EVENTS:   { INVOICE_CHANGED, CUSTOMER_CHANGED, IMPORT_PROGRESS, UPDATE_STATUS },
}
```

---

## 3. Định dạng dữ liệu chuẩn (Envelope)

**Mọi** handler `invoke` phải trả về đúng một trong hai hình dạng sau. Không bao giờ throw xuyên qua ranh giới IPC (Electron sẽ nuốt stack trace và Renderer nhận được thông báo vô nghĩa).

### 3.1. Thành công

```
{
  ok: true,
  data: <kết quả>,
  meta: { total: 128, page: 1, pageSize: 50 }   // tuỳ chọn, dùng cho danh sách phân trang
}
```

### 3.2. Thất bại

```
{
  ok: false,
  error: {
    code: "VALIDATION_ERROR",         // mã máy đọc được, xem bảng mục 6
    message: "Tên không được để trống",            // thông điệp hiển thị được cho người dùng
    details: { field: "name" }        // tuỳ chọn, phục vụ hiển thị lỗi theo trường
  }
}
```

### 3.3. Quy tắc kèm theo

1. `message` phải viết bằng tiếng Việt, dùng được trực tiếp trên UI. Không đưa stack trace vào đây.
2. Stack trace chỉ ghi vào log của Main Process, **không gửi sang Renderer** ở bản production.
3. Renderer **không được** tự đoán lỗi từ `message`. Muốn xử lý theo loại lỗi thì so sánh `error.code`.

---

## 4. Ràng buộc dữ liệu truyền qua IPC

IPC dùng Structured Clone: function, class instance, `Symbol` và tham chiếu vòng đều không truyền được.

**Quy ước dự án:**

- **Mốc thời gian**: chuỗi ISO 8601 UTC. **Ngày trên lịch**: chuỗi `YYYY-MM-DD`. Không truyền object `Date`.
- **Số thập phân nhạy cảm**: số nguyên đơn vị nhỏ nhất.
- **Payload tối đa ~1MB**. File/ảnh truyền **đường dẫn**, không truyền binary.
- Danh sách **luôn phân trang**: `pageSize` mặc định 50, tối đa 200.

---

---

## 4b. Chống mất dữ liệu khi cập nhật chồng chéo (Lost Update)

Vấn đề này xuất hiện ngay khi ứng dụng có **hai cửa sổ**, hoặc khi người dùng mở form sửa rồi để đó một lúc lâu:

```
[10:00]  Cửa sổ A mở form sửa bản ghi X (mô tả = "bản gốc")
[10:01]  Cửa sổ B sửa bản ghi X, lưu  ->  mô tả = "đã cập nhật bởi B"
[10:05]  Cửa sổ A bấm Lưu, gửi lên toàn bộ form đang giữ trong bộ nhớ
         ->  Ghi đè mất thay đổi của B, KHÔNG có cảnh báo nào
```

Không ai gặp lỗi, không có exception — dữ liệu chỉ đơn giản biến mất. Đây là loại lỗi rất khó truy vết về sau.

### 4b.1. Giải pháp — kiểm tra phiên bản lạc quan (Optimistic Concurrency)

| Bước | Việc |
|---|---|
| 1 | Mọi kênh `*:update` **bắt buộc** nhận thêm trường `expectedUpdatedAt` — là giá trị `updatedAt` của bản ghi tại thời điểm Renderer đọc nó |
| 2 | Service so sánh `expectedUpdatedAt` với `updated_at` hiện tại trong DB |
| 3 | Khác nhau → ném `AppError` mã **`CONFLICT`**, kèm `details.currentRecord` là bản ghi mới nhất |
| 4 | Việc so sánh và ghi phải nằm **trong cùng một transaction**, nếu không vẫn còn khe hở |

### 4b.2. Renderer xử lý `CONFLICT` thế nào

| Tình huống | Cách xử lý |
|---|---|
| Hai bên sửa **khác trường** nhau | Tự động gộp, lưu lại. Không làm phiền người dùng |
| Hai bên sửa **cùng một trường** | Hiển thị hộp thoại so sánh, để người dùng chọn: giữ bản của tôi / lấy bản mới / gộp thủ công |
| **Tuyệt đối cấm** | Âm thầm ghi đè, hoặc âm thầm huỷ thay đổi của người dùng |

### 4b.3. Phạm vi áp dụng

| Áp dụng | Không áp dụng |
|---|---|
| Sửa nội dung có ý nghĩa: tên, mô tả, ngày tháng | Đổi trạng thái bật/tắt đơn giản — thao tác cuối cùng thắng là chấp nhận được |
| Bất kỳ form nào người dùng có thể mở lâu | Sắp xếp lại thứ tự (`sort_order`) |

> **Lưu ý**: Nếu bỏ qua quy tắc này ở Phase 4 thì đến Phase 8 (đa cửa sổ) sẽ phải sửa lại toàn bộ các kênh `update` cùng schema của chúng. Thêm một trường ngay từ đầu rẻ hơn nhiều.

---

## 5. Nhóm kênh hạ tầng — giống nhau ở mọi dự án

> Danh mục kênh **nghiệp vụ** của dự án nằm ở `project/ipc-channels.md`.
> Hai nhóm dưới đây thuộc template, có ở mọi dự án.

### 5.1. Nhóm `app:*`

| Kênh | Payload vào | Dữ liệu trả về |
|---|---|---|
| `app:getVersion` | — | `{ app, electron, node, chrome }` |
| `app:getPaths` | — | `{ userData, dbFile, logs }` |
| `app:openExternal` | `{ url }` | `{ opened: boolean }` — **bắt buộc kiểm tra whitelist giao thức `https:`** |
| `app:showOpenDialog` | `{ filters, properties }` | `{ canceled, filePaths }` |
| `app:showSaveDialog` | `{ defaultPath, filters }` | `{ canceled, filePath }` |

### 5.2. Nhóm `setting:*`

| Kênh | Payload vào | Dữ liệu trả về |
|---|---|---|
| `setting:getAll` | — | `Record<string, unknown>` |
| `setting:set` | `{ key, value }` | `{ key, value }` |

### 5.3. Sự kiện hạ tầng (Main → Renderer)

| Kênh | Payload | Khi nào phát |
|---|---|---|
| `event:import-progress` | `{ jobId, processed, total, phase }` | Trong lúc import dữ liệu |
| `event:update-status` | `{ status, version?, percent? }` | Auto-update |
| `event:app-error` | `{ code, message }` | Lỗi nền không gắn với request nào (ví dụ DB mất kết nối) |

### 5.4. Khuôn mẫu cho nhóm kênh nghiệp vụ

Mỗi thực thể nên có tối thiểu bộ kênh sau — chi tiết ghi ở `project/ipc-channels.md`:

| Kênh | Ghi chú |
|---|---|
| `<domain>:list` | Lọc và phân trang **ở tầng SQL**, không lọc ở Renderer |
| `<domain>:getById` | Trả `NOT_FOUND` nếu không tồn tại |
| `<domain>:create` | Renderer **không** gửi `id`. Phát broadcast event |
| `<domain>:update` | **Bắt buộc** `expectedUpdatedAt` — xem §4b. Phát event |
| `<domain>:remove` | Xoá mềm. Phát event |

> Thao tác có **nghiệp vụ riêng** thì tách thành kênh riêng (`<domain>:archive`,
> `<domain>:move`…), đừng nhồi vào `update` rồi phân nhánh bằng `if` trong Service.

---


## 6. Bảng mã lỗi chuẩn

| `code` | Ý nghĩa | Renderer nên làm gì |
|---|---|---|
| `VALIDATION_ERROR` | Payload không hợp lệ | Hiển thị lỗi ngay tại trường trong form (`details.field`) |
| `NOT_FOUND` | Bản ghi không tồn tại | Hiển thị trạng thái rỗng, điều hướng về danh sách |
| `CONFLICT` | Vi phạm ràng buộc duy nhất, **hoặc** bản ghi đã bị sửa bởi nơi khác | Trùng giá trị: yêu cầu đổi. Cập nhật chồng chéo: xử lý theo mục 4b.2 (`details.currentRecord` chứa bản mới nhất) |
| `FOREIGN_KEY_VIOLATION` | Xoá bản ghi đang được tham chiếu | Hỏi lại người dùng chọn chiến lược xoá |
| `DB_ERROR` | Lỗi tầng cơ sở dữ liệu | Toast lỗi chung + gợi ý thử lại |
| `IO_ERROR` | Lỗi đọc/ghi file | Toast lỗi kèm đường dẫn |
| `PERMISSION_DENIED` | Không đủ quyền hệ thống | Hướng dẫn người dùng cấp quyền |
| `UNKNOWN_ERROR` | Lỗi không phân loại được | Toast chung + ghi log |

> Mã lỗi khai báo tập trung ở `shared/errors.js` (gốc repo), không hardcode chuỗi rải rác.

---

## 7. Quy tắc viết Preload

Preload là **bề mặt tấn công lớn nhất** của ứng dụng Electron. Tuân thủ nghiêm ngặt:

### 7.1. Bắt buộc

1. Chỉ expose đúng **một** object gốc: `window.api`.
2. API được nhóm theo domain, phản chiếu 1-1 danh mục kênh:
   `window.api.invoice.list()`, `window.api.customer.create()`, `window.api.app.getVersion()`.
3. Mỗi hàm expose là một **wrapper cố định tên kênh**. Tên kênh do preload quyết định, **không** nhận từ tham số của Renderer.
4. Object expose phải được `Object.freeze`.
5. Hàm đăng ký listener phải **trả về hàm huỷ đăng ký** để React `useEffect` cleanup được.
6. Listener chỉ nhận `payload`, **không** truyền object `event` của Electron sang Renderer (nó chứa tham chiếu tới `sender`, rò rỉ quyền).

### 7.2. Cấm tuyệt đối

```
// SAI — cho phép Renderer gọi bất kỳ kênh nào, kể cả kênh nội bộ
contextBridge.exposeInMainWorld('api', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data)
})

// SAI — expose nguyên ipcRenderer
contextBridge.exposeInMainWorld('ipc', ipcRenderer)

// SAI — expose module Node
contextBridge.exposeInMainWorld('fs', require('fs'))
```

> Nếu bắt buộc phải có cơ chế động, thì vẫn phải kiểm tra `channel` nằm trong danh sách whitelist trước khi gọi.

---

## 8. Quy tắc viết Handler ở Main

Mỗi handler đi theo đúng 5 bước, không bỏ bước nào:

```
1. Nhận payload
2. VALIDATE bằng schema  -> sai thì trả VALIDATION_ERROR ngay
3. Gọi Service tương ứng (handler KHÔNG chứa nghiệp vụ)
4. Bọc kết quả vào envelope { ok: true, data }
5. Nếu là thao tác ghi -> phát broadcast event
```

**Yêu cầu bổ sung:**

- Toàn bộ thân handler nằm trong `try/catch`. `catch` chuyển exception thành envelope lỗi qua một hàm `toErrorEnvelope(err)` dùng chung.
- **Không tin payload từ Renderer** kể cả khi UI đã validate. Renderer có thể bị thao túng qua DevTools.
- Handler phải **idempotent** với thao tác xoá: xoá một `id` đã bị xoá vẫn trả `ok: true`.
- Mỗi kênh chỉ được `handle` **một lần**. Đăng ký trùng sẽ ném lỗi lúc khởi động — đây là hành vi mong muốn, không được bọc `try/catch` để giấu đi.

---

## 9. Xử lý sự kiện ở phía Renderer

| Quy tắc | Diễn giải |
|---|---|
| Luôn cleanup | `useEffect` phải gọi hàm huỷ đăng ký khi component unmount, nếu không sẽ rò rỉ listener sau mỗi lần hot-reload. |
| Đăng ký ở nơi cao nhất cần thiết | Đăng ký một lần ở tầng provider thay vì trong từng item của danh sách. |
| Event chỉ để **invalidate**, không để ghi đè state | Nhận `event:invoice-changed` thì làm mới dữ liệu từ nguồn, không tự vá state bằng payload của event. Tránh lệch dữ liệu. |
| Debounce event dồn dập | `event:import-progress` phát rất nhiều lần — gom lại, cập nhật UI tối đa ~10 lần/giây. |

---

## 10. Checklist khi thêm một kênh IPC mới

Khai báo hằng số kênh → viết schema validate → viết handler + đăng ký → viết hàm Service → expose trong preload → bổ sung vào bảng mục 5 → nếu là thao tác ghi thì thêm broadcast event và quy tắc invalidate ở Renderer → viết test cho Service.

---

## Tài liệu liên quan

- [Tổng quan kiến trúc](./overview.md)
- [Quy tắc tầng Service](../02-backend-data/data-services.md)
- [Quản lý state phía giao diện](../03-frontend/state-management.md)
