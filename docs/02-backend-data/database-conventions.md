# Quy ước cơ sở dữ liệu

> **Hệ quản trị**: SQLite (xem lý do tại [storage-strategy.md](./storage-strategy.md))
>
> File này là **template** — quy ước áp cho **mọi** bảng, không phụ thuộc domain.
> Schema thật của dự án nằm ở `project/database-schema.md`.
> Ví dụ một schema đã điền đầy đủ: [`../examples/sample-domain.md`](../examples/sample-domain.md).

---

## 1. Quy ước chung (áp dụng cho MỌI bảng)

### 1.1. Đặt tên

| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| Tên bảng | `snake_case`, **số nhiều** | `invoices`, `line_items` |
| Tên cột | `snake_case`, **số ít** | `customer_id`, `created_at` |
| Khoá chính | luôn là `id` | `id` |
| Khoá ngoại | `<bảng số ít>_id` | `customer_id`, `invoice_id` |
| Bảng nối N-N | `<bảng1>_<bảng2>` theo thứ tự alphabet | `invoice_tags` |
| Index | `idx_<bảng>_<cột>[_<cột>]` | `idx_invoices_customer_id` |
| Cột boolean | tiền tố `is_` / `has_` | `is_archived`, `has_attachment` |
| Cột thời gian | hậu tố `_at` | `created_at`, `due_at` |

### 1.2. Kiểu dữ liệu

SQLite chỉ có 5 kiểu lưu trữ. Quy ước ánh xạ:

| Dữ liệu logic | Kiểu SQLite | Ghi chú |
|---|---|---|
| Định danh (ID) | `TEXT` | Dùng **UUID v4** (hoặc ULID), **không** dùng `INTEGER AUTOINCREMENT`. Lý do ở mục 1.3. |
| Chuỗi | `TEXT` | |
| Số nguyên | `INTEGER` | |
| Số thập phân | `INTEGER` | Lưu theo đơn vị nhỏ nhất (ví dụ: số xu), tránh sai số `REAL` |
| Boolean | `INTEGER` | `0` = false, `1` = true. Kèm `CHECK (col IN (0,1))` |
| Thời gian | `TEXT` | Chuỗi ISO 8601 UTC: `2026-09-11T14:30:00.000Z`. So sánh chuỗi = so sánh thời gian |
| JSON | `TEXT` | Chỉ dùng cho dữ liệu **không cần truy vấn**, ví dụ `metadata` |
| Nhị phân | *(không lưu)* | Lưu ra file, DB chỉ giữ đường dẫn |

### 1.2b. Hai loại "thời gian" — phân biệt rõ, nếu không sẽ sinh bug hàng loạt

Đây là nguồn lỗi phổ biến nhất trong mọi ứng dụng có ngày tháng. Có **hai khái niệm hoàn toàn khác nhau**, không được trộn lẫn:

| Khái niệm | Là gì | Hậu tố cột | Lưu thế nào | Ví dụ |
|---|---|---|---|---|
| **Mốc thời gian** (instant) | Một điểm chính xác trên trục thời gian toàn cầu | `_at` | ISO 8601 **UTC** | `created_at`, `completed_at`, `started_at` |
| **Ngày trên lịch** (date-only) | Một ô trong cuốn lịch, không gắn với giờ nào | `_date` | Chuỗi `YYYY-MM-DD`, **không có múi giờ** | `due_date` |

**Vì sao phải tách:**

> Người dùng ở Việt Nam (UTC+7) đặt hạn chót là **"ngày 11/09"**.
> Nếu lưu thành mốc thời gian `2026-09-11T00:00:00+07:00` → quy về UTC là `2026-09-10T17:00:00Z`.
>
> Đến khi màn hình lọc "hôm nay" tính theo UTC, bản ghi này hiện ra **từ ngày 10/09** — sai một ngày.
> Nếu người dùng đi công tác đổi múi giờ, hạn chót tự nhảy sang ngày khác.

**Luật bắt buộc:**

1. `due_date` là **date-only**, lưu chuỗi `YYYY-MM-DD`. Nếu tính năng cần cả giờ hẹn thì tách thành hai cột: `due_date` + `due_time` (`HH:mm`), **không** gộp thành một mốc UTC.
2. Mọi cột hậu tố `_at` là mốc thời gian, **luôn** lưu UTC, **luôn** do Backend sinh (không nhận từ Renderer).
3. Mọi phép so sánh "hôm nay", "quá hạn", "tuần này" phải tính theo **lịch địa phương của người dùng**, không theo UTC.
4. Renderer chịu trách nhiệm đổi mốc UTC sang giờ địa phương khi hiển thị. Backend **không bao giờ** định dạng thời gian để hiển thị.

> **Lưu ý cho bảng ở mục 3**: cột `due_at` trong bản phác thảo domain mẫu phải được đổi thành `due_date` khi chốt domain thật, trừ khi nghiệp vụ thực sự cần độ chính xác tới giờ.

### 1.2c. Cột chữ tiếng Việt: sắp xếp và tìm kiếm phải đi qua cột phụ bỏ dấu

Đây là nguồn lỗi thứ hai hay gặp sau chuyện múi giờ, và nó **không báo lỗi** — chỉ lặng lẽ cho ra thứ tự sai.

SQLite chỉ có ba collation dựng sẵn: `BINARY`, `NOCASE`, `RTRIM`. Cả ba so theo **byte UTF-8**:

```
ORDER BY given_name  ->  Bé, Cường, Ánh, Đức      SAI
                         ^^            ^^^^
         byte đầu của 'B' là 0x42, của 'Á' là 0xC3 — nên 'B' đứng trước 'Á'

thứ tự đúng          ->  Ánh, Bé, Cường, Đức
```

`NOCASE` cũng không cứu được: nó chỉ hạ chữ thường cho A–Z, không đụng tới chữ có dấu — nên `'Ánh'` và `'ánh'` vẫn là hai giá trị khác nhau khi so sánh. SQLite **không** kèm ICU; muốn có collation tiếng Việt thật phải biên dịch thêm extension, việc này không làm được với bản prebuild của `better-sqlite3`.

**Luật bắt buộc:**

1. Mọi cột chữ **cần sắp xếp hoặc tìm kiếm** phải có một cột phụ đã bỏ dấu, hậu tố `_ascii`:

   | Cột gốc      | Cột phụ            | Dùng để                            |
   | ------------ | ------------------ | ---------------------------------- |
   | `full_name`  | `full_name_ascii`  | Tìm kiếm không dấu bằng `LIKE`     |
   | `given_name` | `given_name_ascii` | `ORDER BY` theo bảng chữ cái       |

2. Cột phụ do **Service sinh lại từ cột gốc mỗi lần ghi**: NFC → bỏ dấu → lowercase. Renderer **không bao giờ** gửi cột này lên ([data-services.md §3.3](./data-services.md)).
3. `đ` và `Đ` **không** phân rã được bằng NFD — phải thay tay, nếu không "Đức" ra `"uc"`.
4. Từ khoá tìm kiếm phải đi qua **đúng hàm bỏ dấu đó** trước khi so. Quên bước này thì không bao giờ khớp, mà cũng không có lỗi nào để lần ra.
5. Cột phụ cần index riêng, và whitelist `sortBy` phải trỏ vào **cột phụ**, không trỏ vào cột gốc ([coding-standards-backend.md §3.1](../04-guidelines/coding-standards-backend.md)).
6. Cột gốc `NULL` thì cột phụ cũng `NULL`, không phải chuỗi rỗng — theo đúng luật "chuỗi rỗng → `null`".

> **Quyết định lúc thiết kế bảng, đừng để phát hiện sau.** Thêm cột phụ vào một bảng đã phát hành nghĩa là viết migration `ALTER TABLE` **kèm backfill toàn bộ dữ liệu cũ** — trong khi lúc đầu nó chỉ là một dòng trong `CREATE TABLE`.

> Luật này viết cho tiếng Việt vì template đặt chuỗi hiển thị bằng tiếng Việt, nhưng áp được cho mọi ngôn ngữ có dấu.

### 1.3. Vì sao dùng UUID thay vì số tự tăng?

1. **Xuất / nhập / gộp dữ liệu** giữa hai máy hoặc hai file backup không bị đụng ID.
2. ID **ổn định vĩnh viễn** — không đổi khi rebuild bảng lúc migration (xem [storage-strategy.md §5.6](./storage-strategy.md)). Với `AUTOINCREMENT`, thao tác rebuild có thể đánh số lại và làm hỏng mọi tham chiếu.
3. ID không lộ thông tin về số lượng bản ghi.

Đánh đổi: tốn thêm dung lượng và index chậm hơn một chút — không đáng kể ở quy mô ứng dụng desktop cá nhân.

> ### Ai sinh ID?
>
> **Tầng Service ở Backend sinh ID**, không phải Renderer. Xem [data-services.md §1.1](./data-services.md).
>
> Renderer **không được** tự sinh và gửi `id` lên khi tạo bản ghi mới. Lý do: nếu Renderer quyết định ID thì Backend buộc phải kiểm tra trùng, kiểm tra định dạng, và xử lý trường hợp ID bị tiêm từ DevTools — phức tạp hơn nhiều so với lợi ích thu được.
>
> Chống bấm nút hai lần (double-submit) được xử lý ở tầng giao diện bằng cách khoá nút khi mutation đang chạy, xem [coding-standards-frontend.md §6.4](../04-guidelines/coding-standards-frontend.md) — **không** giải quyết bằng ID do client sinh.

### 1.4. Cột bắt buộc trên mọi bảng nghiệp vụ

| Cột | Kiểu | Ràng buộc | Ý nghĩa |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | UUID v4 |
| `created_at` | `TEXT` | `NOT NULL` | Thời điểm tạo, ISO UTC |
| `updated_at` | `TEXT` | `NOT NULL` | Thời điểm sửa gần nhất |
| `deleted_at` | `TEXT` | `NULL` | **Soft delete**. `NULL` = còn sống |

### 1.5. Quy tắc xoá mềm (Soft delete)

- Thao tác "xoá" của người dùng chỉ gán `deleted_at = <thời điểm hiện tại>`.
- **Mọi** truy vấn đọc phải có điều kiện `WHERE deleted_at IS NULL`. Để tránh quên, tầng Repository cung cấp sẵn hàm dựng câu truy vấn có điều kiện này mặc định.
- Xoá vật lý chỉ xảy ra khi: người dùng bấm "Dọn thùng rác", hoặc tác vụ dọn dẹp tự động xoá các bản ghi đã `deleted_at` quá 30 ngày.
- Ngoại lệ: bảng nối (`invoice_tags`) và bảng cấu hình (`settings`) **xoá cứng**, không cần soft delete.

### 1.6. Quy tắc khoá ngoại

- **Bắt buộc** `PRAGMA foreign_keys = ON` (SQLite mặc định tắt).
- Chính sách mặc định: `ON DELETE RESTRICT` — không cho xoá bản ghi cha khi còn con, buộc tầng Service xử lý tường minh.
- Ngoại lệ dùng `ON DELETE CASCADE`: các bảng nối và bảng phụ thuộc hoàn toàn vào cha (`invoice_tags`, `attachments`, `line_items`).

---
---

## 2. Bảng `settings` — có ở mọi dự án

Cấu trúc cố định, **không đổi giữa các dự án**. Chỉ danh sách khoá là riêng —
khai báo ở `project/database-schema.md`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `key` | `TEXT` | PK | Khoá dạng namespace: `ui.theme`, `general.language` |
| `value` | `TEXT` | NOT NULL | Luôn lưu dạng **chuỗi JSON** để giữ đúng kiểu khi đọc ra |
| `updated_at` | `TEXT` | NOT NULL | |

Bảng này **xoá cứng**, không có `deleted_at`.

**Khoá nền — nên có ở mọi dự án:**

| Key | Giá trị mặc định | Mô tả |
|---|---|---|
| `ui.theme` | `"system"` | `light` / `dark` / `system` |
| `ui.density` | `"comfortable"` | `compact` / `comfortable` |
| `ui.sidebarWidth` | `260` | px |
| `general.language` | `"vi"` | |
| `general.startOfWeek` | `1` | 1 = Thứ Hai |
| `data.autoBackup` | `true` | |
| `data.backupIntervalDays` | `7` | |
| `data.trashRetentionDays` | `30` | Số ngày giữ bản ghi đã xoá mềm |

---

## 3. Tìm kiếm toàn văn (FTS5)

Dùng module **FTS5** của SQLite. Quy ước áp cho mọi bảng ảo tìm kiếm:

| Luật | Chi tiết |
|---|---|
| Đặt tên | `<bảng gốc>_fts` |
| Bản chất | **Bảng ảo**, không lưu dữ liệu gốc, chỉ giữ `rowid` trỏ về bảng gốc |
| Đồng bộ | Bằng **trigger** trên bảng gốc: `AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE` |
| Tokenizer | `unicode61 remove_diacritics 2` — để gõ không dấu vẫn tìm được tiếng Việt |
| Sắp xếp | Theo hàm `rank` sẵn có của FTS5 |
| Khi nào thêm | **Migration riêng**, không nhồi vào `001_init.sql` — xem `storage-strategy.md` §5 |

> Quên trigger `AFTER UPDATE` là lỗi phổ biến nhất: sửa nội dung xong, tìm kiếm vẫn ra bản cũ.

---
## 4. Checklist khi thêm bảng mới

- [ ] Tên bảng số nhiều, snake_case
- [ ] Có đủ `id`, `created_at`, `updated_at`, `deleted_at` (trừ bảng nối/cấu hình)
- [ ] Khai báo đầy đủ `NOT NULL`, `DEFAULT`, `CHECK`
- [ ] Khoá ngoại có chính sách `ON DELETE` tường minh
- [ ] Có index cho **mọi** cột dùng trong `WHERE` / `ORDER BY` / `JOIN`
- [ ] Ghi vào file migration mới, không sửa migration cũ
- [ ] Cập nhật ERD và bảng mô tả trong tài liệu này
- [ ] Bổ sung Repository tương ứng

---
---

## Tài liệu liên quan

- [Chiến lược lưu trữ](./storage-strategy.md) — pragma, migration, backup
- [Quy tắc tầng Service](./data-services.md)
- [Quy chuẩn code — Backend](../04-guidelines/coding-standards-backend.md) §3 — luật viết SQL
- `project/database-schema.md` — schema thật của dự án
