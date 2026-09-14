# Quy tắc xử lý nghiệp vụ phía Backend (Node.js)

> **Phạm vi**: Mọi thứ chạy trong Main Process ở tầng dưới IPC handler — Service, Repository, validation, transaction, xử lý lỗi, tác vụ nền.

---

## 1. Kiến trúc phân tầng

```
ipc/          nhận payload -> validate theo schema -> gọi Service -> bọc envelope -> phát event
services/     toàn bộ nghiệp vụ, điều phối nhiều Repository, quản lý transaction, sinh id + timestamp
repositories/ nơi DUY NHẤT viết SQL; ánh xạ dòng DB <-> object JS (snake_case <-> camelCase)
db/           singleton kết nối, pragma, migration
```

**Dấu hiệu sai kiến trúc**: thấy `SELECT` trong file `.service.js`, hoặc thấy `if (invoice.status === 'paid')` trong file `.repository.js`.

### 1.1. Bảng "cái gì nằm ở đâu"

| Câu hỏi | Tầng chịu trách nhiệm |
|---|---|
| "Payload này có hợp lệ về mặt hình dạng không?" | Handler (qua schema) |
| "Không cho phép đóng bản ghi cha khi bản ghi con chưa xong" | Service |
| "Sinh UUID mới cho bản ghi" | Service |
| "Đặt `created_at` và `updated_at`" | Service |
| "SELECT ... WHERE customer_id = ? AND deleted_at IS NULL" | Repository |
| "Bọc 3 thao tác vào một transaction" | Service |
| "Kiểm tra `expectedUpdatedAt` để chặn ghi đè chồng chéo" | Service (trong cùng transaction với lệnh ghi) |
| "Đổi `INTEGER 0/1` thành `boolean` của JS" | Repository (tầng mapper) |
| "Phát `event:<domain>-changed` ra các cửa sổ" | Handler |

---

## 2. Quy tắc tầng Repository

### 2.1. Trách nhiệm

- Nhận tham số đã sạch, trả về dữ liệu đã ánh xạ.
- **Prepared statement** cho mọi câu truy vấn. Chuẩn bị **một lần**, tái sử dụng (đây là điểm mạnh hiệu năng lớn nhất của `better-sqlite3`).
- Không tự mở transaction (trừ khi phương thức tự nó là một thao tác gộp, phải đặt tên rõ như `replaceLabelsForTask`).

> Luật viết SQL (tham số hoá, whitelist `ORDER BY`, cấm `SELECT *`, index bắt buộc): [coding-standards-backend.md §3](../04-guidelines/coding-standards-backend.md).

### 2.2. Bộ phương thức chuẩn

Mỗi Repository nên có tối thiểu:

| Phương thức | Trả về | Ghi chú |
|---|---|---|
| `findById(id)` | object hoặc `null` | Không ném lỗi khi không tìm thấy |
| `findMany(filter)` | mảng | Luôn có phân trang |
| `count(filter)` | số | Dùng cho `meta.total` |
| `insert(record)` | object vừa tạo | |
| `update(id, patch)` | object sau cập nhật hoặc `null` | |
| `softDelete(id)` | boolean | |
| `hardDelete(id)` | boolean | |
| `exists(id)` | boolean | Rẻ hơn `findById` khi chỉ cần kiểm tra |

### 2.3. Tầng ánh xạ (Mapper)

DB và JS có kiểu khác nhau. Mỗi Repository có một hàm `toDomain(row)` riêng:

| Trong DB | Trong JS |
|---|---|
| `is_archived: 1` | `isArchived: true` |
| `customer_id: "uuid"` | `customerId: "uuid"` |
| `created_at: "2026-09-11T..."` | `createdAt: "2026-09-11T..."` (giữ nguyên chuỗi ISO) |
| `metadata: '{"a":1}'` | `metadata: { a: 1 }` |

> **Quy ước xuyên suốt**: DB dùng `snake_case`, JS và IPC payload dùng `camelCase`. Ranh giới chuyển đổi nằm **đúng ở Repository**, không nơi nào khác.
> `toDomain` phải chịu được dữ liệu lỗi: `metadata` là JSON hỏng thì trả `null`, không làm sập cả truy vấn.

---

## 3. Quy tắc tầng Service

### 3.1. Khuôn mẫu của một phương thức Service

```
1. Kiểm tra tiền điều kiện nghiệp vụ
     (bản ghi tồn tại? trạng thái cho phép? không vi phạm quy tắc?)
2. Chuẩn bị dữ liệu
     (sinh id, gán created_at/updated_at, áp giá trị mặc định, chuẩn hoá chuỗi)
3. Thực thi
     (gọi Repository — gói trong transaction nếu chạm nhiều bảng)
4. Xử lý phụ trợ
     (ghi log, xoá file vật lý, cập nhật cache)
5. Trả về đối tượng domain hoàn chỉnh
```

### 3.2. Nguyên tắc

| Nguyên tắc | Diễn giải |
|---|---|
| **Không import `electron`** | Service phải chạy được bằng `node` thuần để unit test. Cần đường dẫn thư mục thì **nhận qua tham số/inject**, không gọi `app.getPath()` bên trong. |
| **Ném lỗi có kiểu** | Service ném `AppError` (xem mục 5), không trả `null` mơ hồ để tầng trên tự đoán. |
| **Thời gian tập trung một chỗ** | Không rải `new Date().toISOString()` khắp nơi. Dùng một hàm `now()` dùng chung để test có thể giả lập thời gian. |
| **Không phụ thuộc UI** | Service không biết gì về màn hình, route hay component. |
| **Hàm nhỏ, một việc** | Một phương thức public có thể gọi các hàm private trong cùng file. |

### 3.3. Chuẩn hoá dữ liệu đầu vào (bắt buộc)

Trước khi ghi, Service luôn:

1. `trim()` mọi chuỗi do người dùng nhập.
2. Chuỗi rỗng sau khi trim → chuyển thành `null` (với cột cho phép NULL). **Không** lưu `""`.
3. Chuẩn hoá Unicode về **NFC** — quan trọng với tiếng Việt, vì cùng một chữ "ế" có thể được gõ bằng hai chuỗi mã khác nhau, gây lỗi so sánh và tìm kiếm.
4. Ép kiểu số bằng kiểm tra tường minh, không dựa vào ép ngầm của JS.
5. Cắt bớt chuỗi vượt giới hạn thay vì để DB ném lỗi `CHECK`.
6. Sinh lại cột phụ `<cột>_ascii` cho mọi cột chữ có tìm kiếm hoặc sắp xếp — bỏ dấu, lowercase. Renderer không gửi cột này ([database-conventions.md §1.2c](./database-conventions.md)).

---

## 4. Validation

### 4.1. Ba tầng kiểm tra — mỗi tầng một vai trò

| Tầng | Kiểm tra gì | Mục đích |
|---|---|---|
| **Renderer (UI)** | Trường bắt buộc, độ dài, định dạng cơ bản | Phản hồi tức thì cho người dùng. **Không được coi là bảo mật.** |
| **IPC Handler** | Hình dạng và kiểu của payload theo schema | Rào chắn thật sự. Chặn payload độc hại. |
| **Service** | Quy tắc nghiệp vụ cần truy vấn DB | Ví dụ: "bản ghi cha này có tồn tại không", "tên đã trùng chưa" |

> Kiểm tra ở UI **không thay thế** kiểm tra ở Handler. DevTools cho phép gọi thẳng `window.api` với payload bất kỳ.

### 4.2. Quy ước schema

- Mỗi kênh IPC có một schema tương ứng đặt tại `backend/src/schemas/<domain>.schema.js`.
- Thư viện đề xuất: **Zod** (khai báo gọn, sinh được thông điệp lỗi tiếng Việt, suy ra kiểu tự động).
- Schema phải `strict` — payload chứa trường lạ thì **từ chối**, không âm thầm bỏ qua.
- Thông điệp lỗi viết bằng tiếng Việt, hướng tới người dùng cuối:
  - Tốt: `"Tiêu đề không được để trống"`
  - Tệ: `"Expected string, received undefined at path title"`

### 4.3. Ánh xạ lỗi validation ra UI

Lỗi validation trả về `details.fieldErrors` dạng:

```
{
  ok: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Dữ liệu không hợp lệ",
    details: {
      fieldErrors: {
        title: "Tiêu đề không được để trống",
        dueAt: "Hạn chót không hợp lệ"
      }
    }
  }
}
```

Renderer dùng `fieldErrors` để gắn thông báo đúng vào từng ô nhập.

---

## 5. Xử lý lỗi

### 5.1. Lớp lỗi chuẩn

Định nghĩa một lớp `AppError` tại `shared/errors.js` (gốc repo) với 3 thuộc tính: `code`, `message`, `details`. Toàn bộ Service ném lỗi bằng lớp này.

### 5.2. Phân loại lỗi

| Loại | Nguồn | Cách xử lý |
|---|---|---|
| **Lỗi mong đợi** | Validation, không tìm thấy, vi phạm quy tắc nghiệp vụ | Ném `AppError` với `code` cụ thể → hiển thị cho người dùng |
| **Lỗi hạ tầng** | SQLite lỗi, đĩa đầy, file bị khoá | Bắt, ghi log đầy đủ, chuyển thành `DB_ERROR`/`IO_ERROR` với thông điệp chung |
| **Lỗi lập trình** | `undefined is not a function` | **Không** che giấu. Ghi log kèm stack trace, trả `UNKNOWN_ERROR`. Phải sửa, không phải bắt cho qua |

### 5.3. Ánh xạ mã lỗi SQLite

| Mã SQLite | `AppError.code` | Thông điệp hiển thị |
|---|---|---|
| `SQLITE_CONSTRAINT_UNIQUE` | `CONFLICT` | "Giá trị này đã tồn tại" |
| `SQLITE_CONSTRAINT_FOREIGNKEY` | `FOREIGN_KEY_VIOLATION` | "Không thể xoá vì dữ liệu đang được sử dụng" |
| `SQLITE_CONSTRAINT_CHECK` | `VALIDATION_ERROR` | "Dữ liệu không hợp lệ" |
| `SQLITE_BUSY` | `DB_ERROR` | "Cơ sở dữ liệu đang bận, vui lòng thử lại" |
| `SQLITE_READONLY` / `SQLITE_FULL` | `IO_ERROR` | "Không thể ghi dữ liệu, kiểm tra dung lượng ổ đĩa" |

### 5.4. Quy tắc bắt lỗi

```
// SAI — nuốt lỗi
try { doSomething() } catch (e) { }

// SAI — đánh mất ngữ cảnh
try { doSomething() } catch (e) { throw new Error('Lỗi') }

// ĐÚNG — ghi log, giữ nguyên nhân gốc, chuyển thành lỗi có mã
try {
  doSomething()
} catch (err) {
  logger.error('invoice.create thất bại', { err, payload })
  throw mapDbError(err)
}
```

### 5.5. Lưới an toàn cấp ứng dụng

Ở Main Process phải đăng ký `process.on('uncaughtException')` và `process.on('unhandledRejection')`:
ghi log → hiển thị dialog lỗi thân thiện → tuỳ mức nghiêm trọng mà tiếp tục hoặc thoát an toàn.
**Không bao giờ** để ứng dụng chết im lặng không dấu vết.

---

## 6. Transaction

### 6.1. Khi nào bắt buộc dùng

Bất cứ khi nào **một thao tác logic chạm nhiều câu lệnh ghi**:

- **Mọi thao tác `update`**: đọc `updated_at` hiện tại, so với `expectedUpdatedAt`, rồi mới ghi — cả ba bước phải trong **một** transaction, nếu không vẫn còn khe hở race condition (xem [ipc-communication.md §4b](../01-architecture/ipc-communication.md))
- Tạo bản ghi kèm gán quan hệ N–N (ghi bảng chính + nhiều dòng bảng nối)
- Sắp xếp lại thứ tự (cập nhật N dòng `sort_order`)
- Xoá bản ghi cha theo kiểu `cascade` (cập nhật cả bảng con và bảng cha)
- Import hàng loạt
- Mọi migration

### 6.2. Nguyên tắc

1. Transaction **thuộc về tầng Service**, không phải Repository. Service biết ranh giới của một đơn vị công việc.
2. `better-sqlite3` là API đồng bộ — **không** đặt `await` cho tác vụ khác bên trong transaction (đọc file, gọi mạng). Chuẩn bị hết dữ liệu **trước**, rồi mới mở transaction.
3. Transaction phải **ngắn**. Transaction dài giữ khoá ghi, chặn các thao tác khác.
4. Với ghi hàng loạt số lượng lớn (> 1000 dòng), chia lô (batch) khoảng 500 dòng mỗi transaction để tránh giữ khoá quá lâu.

### 6.3. Khuôn mẫu

```
Chuẩn bị dữ liệu (đọc file, gọi API, tính toán)   <- NGOÀI transaction
        |
   BEGIN
     ghi bảng A
     ghi bảng B
     ghi bảng C
   COMMIT  (lỗi bất kỳ -> ROLLBACK toàn bộ)
        |
Hậu xử lý (xoá file vật lý, phát event, ghi log)  <- NGOÀI transaction
```

> **Lưu ý**: Xoá file vật lý phải nằm **sau** commit. Nếu xoá file trước mà transaction rollback, DB vẫn còn bản ghi nhưng file đã mất — sinh dữ liệu hỏng không thể phục hồi.

---

## 7. Tác vụ nền và hiệu năng

### 7.1. Vấn đề

Main Process là **đơn luồng**. Một vòng lặp nặng ở Main sẽ làm treo cả IPC, khiến UI đơ dù Renderer chạy tiến trình khác.

### 7.2. Quy tắc

| Loại tác vụ | Thời lượng ước tính | Cách chạy |
|---|---|---|
| CRUD thông thường | < 50ms | Chạy thẳng ở Main |
| Truy vấn phức tạp, báo cáo | 50–300ms | Chạy thẳng, nhưng phải có index đầy đủ |
| Import/export, tính toán lớn | > 300ms | `worker_threads` hoặc `utilityProcess` |
| Dọn dẹp định kỳ, backup | nền | Hẹn giờ, chạy khi app rảnh |

### 7.3. Tác vụ chạy dài — yêu cầu bắt buộc

1. Trả **ngay** một `jobId` cho Renderer, không bắt UI chờ.
2. Báo tiến độ qua `event:import-progress` (có debounce, tối đa ~10 lần/giây).
3. Hỗ trợ **huỷ giữa chừng** — kiểm tra cờ huỷ giữa các lô xử lý.
4. Khi lỗi, báo rõ đã xử lý được bao nhiêu và dừng ở đâu.

### 7.4. Checklist hiệu năng

- [ ] Mọi cột xuất hiện trong `WHERE`/`ORDER BY`/`JOIN` đều có index
- [ ] Prepared statement được chuẩn bị một lần, không tạo lại trong vòng lặp
- [ ] Danh sách luôn phân trang, không bao giờ `SELECT *` toàn bảng
- [ ] Không có truy vấn trong vòng lặp (vấn đề N+1) — gom lại bằng `IN (...)` hoặc `JOIN`
- [ ] `EXPLAIN QUERY PLAN` cho các truy vấn nóng, xác nhận có dùng index

---

## 8. Ghi log

| Mức | Dùng khi | Ví dụ |
|---|---|---|
| `error` | Thao tác thất bại, cần điều tra | Migration lỗi, DB không mở được |
| `warn` | Bất thường nhưng vẫn chạy tiếp | File đính kèm mồ côi, cấu hình sai được thay bằng mặc định |
| `info` | Mốc quan trọng trong vòng đời | App khởi động, migration chạy xong, backup hoàn tất |
| `debug` | Chi tiết phục vụ phát triển | Câu truy vấn và thời gian thực thi — **chỉ bật ở dev** |

**Quy tắc:**

- Log ghi ra **file** trong `<userData>/logs/`, xoay vòng theo ngày, giữ tối đa 7 ngày.
- **Không bao giờ** ghi nội dung do người dùng nhập (tiêu đề, mô tả, ghi chú) vào log. Chỉ ghi `id` và metadata.
- Mỗi dòng log có ngữ cảnh: thời gian, mức, tên thao tác, id liên quan.
- Người dùng mở được thư mục log từ menu Trợ giúp để gửi khi cần hỗ trợ.

---

## 9. Kiểm thử

| Tầng | Loại test | Cách làm |
|---|---|---|
| Service | Unit test | Truyền Repository giả (mock). Không cần DB, không cần Electron. Tập trung vào quy tắc nghiệp vụ và các trường hợp biên. |
| Repository | Integration test | Dùng SQLite **in-memory** (`:memory:`), chạy migration thật, kiểm tra câu truy vấn trả đúng dữ liệu. |
| IPC Handler | Integration test | Gọi handler trực tiếp với payload giả, kiểm tra hình dạng envelope trả về. |
| Toàn luồng | E2E | Playwright điều khiển Electron. Chỉ viết cho các luồng quan trọng nhất. |

**Bắt buộc có test cho:**
- Mọi quy tắc nghiệp vụ đã liệt kê ở `project/database-schema.md` §2
- Mọi hàm có nhánh transaction
- Mọi hàm ánh xạ lỗi

---

## Tài liệu liên quan

- [Quy ước cơ sở dữ liệu](./database-conventions.md)
- [Chiến lược lưu trữ](./storage-strategy.md)
- [Quy tắc giao tiếp IPC](../01-architecture/ipc-communication.md)
- [Quy chuẩn code — Backend](../04-guidelines/coding-standards-backend.md)
- [Quy chuẩn code — Phần chung](../04-guidelines/coding-standards.md)
