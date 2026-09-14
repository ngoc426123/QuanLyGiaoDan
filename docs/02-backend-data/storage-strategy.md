# Chiến lược lưu trữ cục bộ

> **Quyết định**: Dùng **SQLite** thông qua thư viện **`better-sqlite3`**.
> Quyết định đã chốt — mục 1 nêu lý do ngắn gọn để không phải tranh luận lại. Các mục còn lại là **luật bắt buộc** khi viết code.

---

## 1. Quyết định và lý do

**Chọn SQLite qua `better-sqlite3`.**

Ba yêu cầu quyết định lựa chọn này — cả ba đều **không thể chắp vá về sau**:

| Yêu cầu | JSON thuần | LowDB | **better-sqlite3** |
|---|:---:|:---:|:---:|
| Không mất dữ liệu khi app bị kill (transaction ACID) | Không | Yếu | **Có** |
| Truy vấn có lọc/sắp xếp trên hàng chục nghìn bản ghi | Phải nạp hết vào RAM | Duyệt mảng O(n) | **Có index** |
| Ràng buộc toàn vẹn giữa các bảng (khoá ngoại) | Không | Thủ công | **Có sẵn** |
| Tìm kiếm toàn văn | Thủ công | Thủ công | **FTS5** |
| Cần biên dịch native | Không | Không | **Có** |

Chi phí "cần biên dịch native" ở bảng trên **không còn đúng từ `better-sqlite3` v12**: gói npm kèm sẵn prebuild **Node-API**, nạp thẳng dưới Electron mà không cần build lại theo ABI ([project-structure.md §6.1](../01-architecture/project-structure.md)). Đổi lại có transaction, index, ràng buộc toàn vẹn và tìm kiếm toàn văn ngay từ ngày đầu, không cần toolchain C++ trên máy dev.

> `node-sqlite3` (API bất đồng bộ) bị loại vì chậm hơn và rườm rà hơn, trong khi tính bất đồng bộ không mang lại lợi ích — truy vấn cục bộ tính bằng mili-giây và chạy ở Main Process, không chặn UI.

---

## 2. Phân vai các kho lưu trữ

Không phải mọi thứ đều nhét vào SQLite. Phân chia rõ:

| Loại dữ liệu | Nơi lưu | Lý do |
|---|---|---|
| Dữ liệu nghiệp vụ (mọi thực thể của domain) | **SQLite** | Cần truy vấn, quan hệ, toàn vẹn |
| Cấu hình người dùng (theme, ngôn ngữ, cỡ chữ) | Bảng `settings` trong SQLite | Gom một chỗ, dễ backup cùng dữ liệu |
| Trạng thái cửa sổ (vị trí, kích thước, maximized) | File JSON riêng `window-state.json` | Cần đọc **trước khi** mở DB; mất cũng không sao |
| File đính kèm (ảnh, tài liệu) | Thư mục `attachments/` trên đĩa; DB chỉ lưu **đường dẫn tương đối** + metadata | Không nhồi binary vào DB, giữ file DB nhẹ |
| Log ứng dụng | File `.log` xoay vòng theo ngày trong `logs/` | Không làm phình DB |
| Cache tạm | RAM hoặc thư mục temp | Xoá được tự do |

---

## 3. Vị trí lưu trữ trên đĩa

Gốc lưu trữ là `app.getPath('userData')`:

| Hệ điều hành | Đường dẫn |
|---|---|
| Windows | `C:\Users\<user>\AppData\Roaming\<AppName>\` |
| macOS | `~/Library/Application Support/<AppName>/` |
| Linux | `~/.config/<AppName>/` |

Cấu trúc bên trong:

```
<userData>/
├── data/
│   ├── app.db              # File SQLite chính
│   ├── app.db-wal          # Write-Ahead Log (SQLite tự quản)
│   └── app.db-shm          # Shared memory (SQLite tự quản)
├── attachments/
│   └── 2026/09/<uuid>.png  # Phân thư mục theo năm/tháng, tránh 1 thư mục quá nhiều file
├── backups/
│   └── app-2026-09-11T08-00-00.db
├── logs/
│   └── main-2026-09-11.log
└── window-state.json
```

**Quy tắc:**

- **Không bao giờ** hardcode đường dẫn. Luôn lấy qua `app.getPath('userData')`.
- Ở chế độ development dùng thư mục userData riêng (đặt qua `app.setPath` hoặc biến môi trường) để không làm bẩn dữ liệu thật.
- Cho phép người dùng mở nhanh thư mục dữ liệu từ menu (`shell.openPath`) để tiện hỗ trợ kỹ thuật.

---

## 4. Cấu hình kết nối bắt buộc

Ngay sau khi mở kết nối, thiết lập các pragma sau:

| Pragma | Giá trị | Lý do |
|---|---|---|
| `journal_mode` | `WAL` | Cho phép đọc và ghi đồng thời; khôi phục tốt khi crash. **Quan trọng nhất.** |
| `foreign_keys` | `ON` | SQLite **mặc định TẮT** khoá ngoại. Không bật thì mọi `REFERENCES` chỉ là trang trí. |
| `synchronous` | `NORMAL` | Cân bằng an toàn/tốc độ khi đã bật WAL. |
| `busy_timeout` | `5000` | Chờ 5 giây thay vì ném lỗi ngay khi DB bận. |
| `temp_store` | `MEMORY` | Bảng tạm nằm trong RAM, nhanh hơn. |

Ngoài ra:

- Mở kết nối **một lần duy nhất** lúc khởi động, tái sử dụng suốt vòng đời app (singleton). Không mở/đóng theo từng truy vấn.
- Đóng kết nối tường minh trong `before-quit`.
- Chạy `PRAGMA optimize` trước khi đóng, và `VACUUM` định kỳ (ví dụ mỗi 30 ngày hoặc khi người dùng bấm "Dọn dẹp dữ liệu").

---

## 5. Chiến lược Migration

### 5.1. Nguyên tắc

1. Mỗi thay đổi schema là **một file SQL mới**, đánh số tăng dần, **không bao giờ sửa file cũ đã phát hành**.
2. Phiên bản schema hiện tại lưu bằng `PRAGMA user_version`.
3. Migration chạy **tự động** lúc khởi động, **trước** khi mở cửa sổ.
4. Mỗi migration chạy trong **một transaction**: thành công thì commit và tăng `user_version`, lỗi thì rollback toàn bộ.
5. **Luôn sao lưu file DB trước khi migrate** (copy sang `backups/`). Nếu migration hỏng, người dùng vẫn còn đường lui.

### 5.2. Quy ước đặt tên

```
backend/src/db/migrations/
├── 001_init.sql                    # Tạo bảng nền
├── 002_add_tags.sql                # Thêm bảng mới + bảng nối
├── 003_add_fts.sql                 # Thêm bảng ảo FTS5
└── 004_add_priority.sql            # Thêm một cột
```

Tên file: `<số thứ tự 3 chữ số>_<mô tả kebab-case>.sql`

### 5.3. Luồng chạy

```
Khởi động app
  |
  +-> Đọc PRAGMA user_version  (ví dụ: 2)
  |
  +-> Quét thư mục migrations, lọc các file có số > 2
  |
  +-> Nếu có file cần chạy:
  |      +-> Backup app.db sang backups/
  |      +-> Với từng file, theo thứ tự tăng dần:
  |             BEGIN TRANSACTION
  |             chạy nội dung SQL
  |             PRAGMA user_version = <số của file>
  |             COMMIT   (lỗi -> ROLLBACK, dừng, hiện dialog, thoát app)
  |
  +-> Mở cửa sổ chính
```

### 5.4. Chặn hạ cấp phiên bản (Downgrade Protection) — BẮT BUỘC

Luồng ở mục 5.3 mới xử lý trường hợp `user_version` **nhỏ hơn** số migration hiện có. Còn trường hợp ngược lại thì sao?

> Người dùng đang dùng app v2.0 (schema version 7). Vì lý do nào đó họ gỡ ra và cài lại bản v1.0 cũ (chỉ có 4 migration).
>
> App v1.0 đọc `user_version = 7`, thấy không có file migration nào số > 7, kết luận "không cần migrate" và **mở DB bình thường**.
>
> Nhưng schema trên đĩa có những cột và bảng mà code v1.0 không biết. Code cũ ghi đè lên dữ liệu mới → **hỏng dữ liệu vĩnh viễn, không có cách phục hồi**.

**Luật:**

```
Đọc user_version từ file DB
        |
   userVersion > số migration cao nhất trong bản build này?
        |
       CÓ ──▶ DỪNG NGAY. Hiện dialog:
        |       "Dữ liệu của bạn được tạo bởi phiên bản mới hơn (vX).
        |        Vui lòng cài lại phiên bản mới nhất để tránh mất dữ liệu."
        |       -> app.quit(). TUYỆT ĐỐI không mở kết nối ghi.
        |
      KHÔNG ──▶ Chạy migration như bình thường
```

Ba điểm bắt buộc:

1. Kiểm tra này chạy **trước khi mở kết nối ghi**, ngay sau khi đọc được `user_version`.
2. Thoát app là hành vi **đúng**. Chạy tiếp với dữ liệu không đọc nổi tệ hơn nhiều so với việc người dùng phải cài lại.
3. Áp dụng cả cho luồng **khôi phục từ backup** ở mục 6 — file backup có thể mới hơn app đang chạy.

### 5.5. Luật viết migration

| Luật | Lý do |
|---|---|
| Migration **không được import code ứng dụng** (Service, Repository, model) | Code ứng dụng thay đổi theo thời gian. Migration số 3 chạy trên máy người dùng năm sau sẽ gọi vào Service đã bị viết lại → hành vi khác hoàn toàn. Migration phải **tự chứa**, chỉ dùng SQL thuần |
| Migration chỉ được giả định schema **ở đúng version liền trước nó** | Không giả định gì về schema hiện tại của code |
| Migration cần biến đổi dữ liệu phức tạp → viết file `.js` đi kèm, cùng quy ước đánh số | Một số phép chuyển đổi không viết được bằng SQL thuần. File JS đó cũng phải tự chứa |
| **Không bao giờ** sửa file migration đã phát hành | Máy người dùng đã chạy bản cũ. Sửa file = hai máy có schema khác nhau cùng một `user_version` |
| Cần sửa một migration sai đã phát hành → viết migration **mới** để vá | Chỉ có cách này mới đảm bảo mọi máy hội tụ về cùng trạng thái |
| Migration phải test trên **bản sao dữ liệu thật**, không chỉ trên DB rỗng | Migration chạy đúng trên DB rỗng nhưng gãy vì ràng buộc dữ liệu thật là chuyện thường gặp |

### 5.6. Giới hạn của SQLite cần lưu ý

SQLite **không hỗ trợ đầy đủ** `ALTER TABLE` (không đổi kiểu cột, không xoá ràng buộc). Khi cần thay đổi lớn, dùng mẫu **12 bước "table rebuild"** rút gọn:

```
1. Tạo bảng mới với cấu trúc mong muốn:  <bảng>_new
2. INSERT INTO <bảng>_new SELECT ... FROM <bảng>   (kèm chuyển đổi dữ liệu)
3. DROP TABLE <bảng>
4. ALTER TABLE <bảng>_new RENAME TO <bảng>
5. Tạo lại toàn bộ index và trigger của bảng
```

Tất cả đặt trong một transaction, và **tắt `foreign_keys` trong lúc rebuild** rồi bật lại sau.

---

## 6. Sao lưu và khôi phục

| Cơ chế | Mô tả |
|---|---|
| **Backup tự động trước migration** | Bắt buộc. Giữ tối đa 5 bản gần nhất. |
| **Backup định kỳ** | Tuỳ chọn trong Cài đặt: hằng ngày/tuần. Dùng API backup của SQLite (an toàn khi DB đang mở), **không** copy file thô bằng `fs`. |
| **Xuất dữ liệu** | Cho phép xuất ra JSON/CSV — phục vụ người dùng mang dữ liệu đi nơi khác (R6). |
| **Khôi phục** | Người dùng chọn file `.db` → app kiểm tra `user_version` tương thích → thay thế file → khởi động lại. |

**Quy tắc dọn dẹp**: Giới hạn số bản backup (theo số lượng hoặc dung lượng), tự xoá bản cũ nhất, để không âm thầm chiếm đầy ổ đĩa người dùng.

---

## 7. Bảo mật dữ liệu

- Mặc định **không mã hoá**. Dữ liệu nằm trong hồ sơ người dùng, đã được OS bảo vệ ở mức tài khoản.
- Nếu về sau có yêu cầu mã hoá toàn bộ DB: cân nhắc SQLCipher — nhưng đây là quyết định **một chiều**, phải chốt trước khi phát hành.
- Thông tin nhạy cảm riêng lẻ (token, mật khẩu dịch vụ ngoài nếu có) **không lưu trong DB**, mà dùng `safeStorage` của Electron (dựa vào keychain/DPAPI của hệ điều hành).

---

## Tài liệu liên quan

- [Quy ước cơ sở dữ liệu](./database-conventions.md)
- [Quy tắc tầng Service](./data-services.md)
- [Tổng quan kiến trúc](../01-architecture/overview.md)
