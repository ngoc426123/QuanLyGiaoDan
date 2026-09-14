# Quy chuẩn code — Backend

> **Áp dụng cho**: Package `backend/` (Main Process — Node.js + SQLite).
> **Điều kiện tiên quyết**: [coding-standards.md](./coding-standards.md) (phần chung).
> **Phạm vi**: Chỉ **cách viết code**. Kiến trúc tầng, transaction, xử lý lỗi, log, kiểm thử nằm ở [data-services.md](../02-backend-data/data-services.md) — không chép lại ở đây.

---

## 1. Ranh giới

### Backend KHÔNG được phép

| Cấm | Lý do |
|---|---|
| Import bất cứ thứ gì từ `frontend/`, hoặc `react` / `react-dom` | Phá vỡ ranh giới tiến trình |
| Quyết định giao diện hiển thị thế nào (màu, nhãn, thứ tự cột) | Việc của Frontend |
| **Tin** payload từ Renderer dù UI đã validate | DevTools gọi `window.api` được với payload bất kỳ |
| Trả stack trace sang Renderer ở bản production | Rò rỉ thông tin nội bộ |
| Gửi dữ liệu không serializable qua IPC | Structured Clone làm mất function và class instance |
| Định dạng thời gian để hiển thị | Luôn trả ISO UTC, Frontend tự format |

---

## 2. Tổ chức file

```
backend/
├── package.json                  Manifest của app: main, dependencies
├── electron.vite.config.js       Build main + preload | alias @shared
├── electron-builder.yml
├── resources/
└── src/
    ├── main/
    │   ├── index.js              app lifecycle
    │   ├── window-manager.js
    │   ├── app-menu.js
    │   ├── security.js
    │   └── ipc/                  Tầng biên — chỉ điều phối
    ├── preload/
    │   └── index.js              Phải bundle thành MỘT file duy nhất
    ├── services/                 Nghiệp vụ — KHÔNG import electron
    ├── repositories/             Nơi DUY NHẤT viết SQL
    ├── schemas/                  Schema validate payload IPC
    └── db/
        ├── connection.js
        ├── migrator.js
        └── migrations/
```

> Hằng số dùng chung với Frontend (`channels.js`, `errors.js`) nằm ở `shared/` tại gốc repo, truy cập qua alias `@shared`.

### 2.1. Luật phụ thuộc — cưỡng chế bằng ESLint

```
ipc/  -->  services/  -->  repositories/  -->  db/
```

| Luật | Lý do |
|---|---|
| `services/` **không** import `electron` | Để unit test chạy bằng Node thuần |
| `repositories/` **không** import `services/` | Chặn phụ thuộc ngược chiều |
| `ipc/` **không** import `repositories/` | Không nhảy tầng |

Trách nhiệm từng tầng: xem [data-services.md §1](../02-backend-data/data-services.md).

### 2.2. Quy ước tên file

| Tầng | Mẫu tên | Ví dụ |
|---|---|---|
| IPC handler | `<domain>.ipc.js` | `invoice.ipc.js` |
| Service | `<domain>.service.js` | `invoice.service.js` |
| Repository | `<domain>.repository.js` | `invoice.repository.js` |
| Schema | `<domain>.schema.js` | `invoice.schema.js` |
| Migration | `<3 chữ số>_<mô-tả>.sql` | `001_init.sql` |

---

## 3. Luật viết SQL

| Luật | Lý do |
|---|---|
| **Cấm nối chuỗi SQL.** Luôn dùng tham số `?` | SQL injection — và quan trọng hơn: dấu nháy đơn trong tên người dùng làm vỡ câu lệnh ([security.md §5](../01-architecture/security.md)) |
| Prepared statement chuẩn bị **một lần**, tái sử dụng | Điểm mạnh hiệu năng lớn nhất của `better-sqlite3` |
| Cấm `SELECT *` | Thêm cột mới sẽ âm thầm đổi hình dạng dữ liệu trả về |
| Mọi truy vấn danh sách phải có `LIMIT` | Không bao giờ quét toàn bảng |
| Mọi truy vấn đọc phải có `WHERE deleted_at IS NULL` | Quy tắc soft delete |
| Cấm truy vấn trong vòng lặp (N+1) | Gom bằng `IN (...)` hoặc `JOIN` |
| Mọi cột dùng trong `WHERE`/`ORDER BY`/`JOIN` phải có index | Xác nhận bằng `EXPLAIN QUERY PLAN` |

### 3.1. Ngoại lệ duy nhất được ghép chuỗi: `ORDER BY`

Tên cột không tham số hoá được. Bắt buộc đối chiếu **whitelist cứng**:

```
ALLOWED_SORT_COLUMNS = ['created_at', 'updated_at', 'due_date', 'priority', 'title', 'sort_order']
ALLOWED_SORT_DIRECTIONS = ['ASC', 'DESC']
```

Giá trị ngoài whitelist → dùng mặc định, **không** ném lỗi ra người dùng.

> **Cột chữ tiếng Việt**: whitelist phải trỏ vào cột phụ đã bỏ dấu (`<cột>_ascii`),
> không trỏ vào cột gốc. Collation của SQLite so theo byte UTF-8 nên `ORDER BY` trên cột
> có dấu xếp "Bé" **trước** "Ánh" — sai mà không báo lỗi. Xem
> [database-conventions.md §1.2c](../02-backend-data/database-conventions.md).

### 3.2. Không "làm sạch" dữ liệu người dùng

Không loại bỏ dấu nháy, không escape thủ công trước khi lưu. Đó là cách sai, làm hỏng tên `O'Brien`. Tham số hoá đã xử lý xong — dữ liệu phải lưu **nguyên vẹn**.

---

## 4. Đường dẫn và file

| Luật | Lý do |
|---|---|
| **Không hardcode đường dẫn** — luôn qua `app.getPath()` | Khác nhau giữa OS và tài khoản |
| Luôn dùng `path.join()` / `path.resolve()` | Windows dùng `\`, POSIX dùng `/` |
| Lưu **đường dẫn tương đối** vào DB | Đường dẫn tuyệt đối hỏng khi người dùng đổi tên tài khoản |
| Tên file trên đĩa sinh bằng UUID, không dùng tên người dùng đặt | Chặn path traversal |
| Kiểm tra đường dẫn sau khi ghép vẫn nằm trong `userData` | Chặn ghi ra ngoài vùng cho phép |
| Ghi file quan trọng theo kiểu atomic: ghi file tạm rồi `rename` | Tránh file hỏng khi app bị kill giữa chừng |

---

## 5. Bảo mật

Cấu hình `BrowserWindow` bắt buộc: [overview.md §3](../01-architecture/overview.md).
Mô hình mối đe doạ và thứ tự ưu tiên: [security.md](../01-architecture/security.md).

Ba luật hay bị quên nhất khi viết code:

1. `app:openExternal` chỉ chấp nhận giao thức `https:`.
2. Thông tin nhạy cảm dùng `safeStorage`, **không** lưu plaintext trong DB.
3. Ngưỡng chấp nhận một dependency ở Backend khắt khe hơn Frontend — gói ở đây chạy với **toàn quyền hệ thống**.

---

## 6. Cấm tuyệt đối

```
// 1. Nối chuỗi SQL
const sql = `SELECT * FROM invoices WHERE name LIKE '%${keyword}%'`

// 2. Import electron trong Service
import { app } from 'electron'          // trong backend/src/services/*.js

// 3. Handler không try/catch — throw xuyên ranh giới IPC làm Renderer treo
ipcMain.handle('invoice:create', (e, p) => InvoiceService.create(p))

// 4. Viết SQL trong Service
// 5. Viết nghiệp vụ trong Repository

// 6. Hardcode đường dẫn
const dbPath = 'C:\\Users\\admin\\AppData\\Roaming\\app\\app.db'

// 7. Ghi nội dung người dùng vào log
logger.info('Tạo invoice', { name: payload.name })

// 8. Tin payload từ Renderer — không validate
ipcMain.handle('invoice:remove', (e, { id }) => repo.hardDelete(id))

// 9. console.log trong code sản phẩm — dùng logger
```

---

## 7. ESLint riêng cho `backend/`

| Luật | Mức | Ghi chú |
|---|---|---|
| `no-restricted-imports` (toàn `backend/src/**`) | error | Chặn `../../frontend/**`, `react`, `react-dom` |
| `no-restricted-imports` (`backend/src/services/**`) | error | Chặn `electron` |
| `no-restricted-imports` (`backend/src/repositories/**`) | error | Chặn `../services/**` |
| `no-restricted-syntax` | error | Chặn template literal chứa `SELECT`/`INSERT`/`UPDATE`/`DELETE` — bắt lỗi nối chuỗi SQL |
| `require-await` | error | Chặn `async` thừa (`better-sqlite3` là API đồng bộ) |
| `no-floating-promises` | error | Promise không được bỏ rơi |
| `no-console` | error | Bắt buộc dùng logger |
| `n/no-sync` | off | API đồng bộ của `better-sqlite3` là có chủ đích |

---

## 8. Checklist Pull Request — Backend

> Dùng **cộng thêm** checklist chung ở [coding-standards.md §8](./coding-standards.md).

- [ ] Không import từ `frontend/`, không import `react`; `services/` không import `electron`
- [ ] Không có SQL trong `services/`; không có nghiệp vụ trong `repositories/`
- [ ] Mọi câu SQL dùng tham số `?`; `ORDER BY` đối chiếu whitelist
- [ ] Truy vấn đọc có `WHERE deleted_at IS NULL` và có `LIMIT`
- [ ] Mọi cột dùng trong `WHERE`/`ORDER BY`/`JOIN` đã có index; không có N+1
- [ ] Handler mới có schema validate, bọc `try/catch`, trả đúng envelope
- [ ] Thao tác ghi có phát broadcast event
- [ ] Thao tác `update` có kiểm tra `expectedUpdatedAt` trong cùng transaction
- [ ] Thao tác chạm nhiều bảng đã bọc transaction; xoá file vật lý nằm **sau** commit
- [ ] Đường dẫn lấy qua `app.getPath()`, ghép bằng `path.join()`
- [ ] Không ghi dữ liệu người dùng vào log
- [ ] Migration mới: đánh số đúng, không sửa file cũ, đã test trên dữ liệu mẫu
- [ ] Nếu chạm `shared/`: đã cập nhật danh mục IPC và sửa cả FE trong cùng PR

---

## Tài liệu liên quan

- [Quy chuẩn code — Phần chung](./coding-standards.md)
- [Quy tắc tầng Service](../02-backend-data/data-services.md) — kiến trúc, transaction, lỗi, log, test
- [Quy ước cơ sở dữ liệu](../02-backend-data/database-conventions.md)
- [Mô hình bảo mật](../01-architecture/security.md)
