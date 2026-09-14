# Phase 6 — Độ tin cậy

> **Đã làm sớm ở Phase 2**: xuất / nhập toàn bộ file dữ liệu (`backup:export`, `backup:import`)
> kèm chặn hạ cấp và sao lưu an toàn trước khi thay — quyết định P16. Phase này chỉ còn phần
> **sao lưu định kỳ tự động** và dọn bản backup cũ.

> **Mục tiêu**: Ứng dụng không làm mất dữ liệu, và khi lỗi thì người dùng hiểu chuyện gì xảy ra.
>
> **Ước lượng**: 2–3 ngày · **Tiền đề**: Phase 5 đạt đủ Definition of Done

**Đọc trước**: `docs/02-backend-data/storage-strategy.md` §6, `docs/02-backend-data/data-services.md` §8–§9.

> Với domain này, sổ giáo dân là **dữ liệu không tái tạo được**. Nếu hỏng thì phải nhập lại
> từ sổ giấy — nếu sổ giấy còn. Phase này đáng đầu tư hơn nhiều so với một app thông thường.

---

## 6.1 — Log ra file

**File**: `backend/src/main/logger.js`

| Việc                                 | Chi tiết                            |
| ------------------------------------ | ----------------------------------- |
| Vị trí                               | `userData/logs/main-YYYY-MM-DD.log` |
| Xoay vòng                            | Theo ngày, giữ **7 ngày**           |
| Dùng logger, **không** `console.log` | ESLint đã chặn từ Phase 0           |

**Luật quan trọng nhất** (`CLAUDE.md`, `data-services.md` §8):

> **Không bao giờ ghi nội dung người dùng nhập vào log.** Chỉ ghi `id` + metadata.

Với domain này luật đó **đặc biệt quan trọng**: log không được chứa họ tên, địa chỉ,
số điện thoại, tên thánh, ghi chú. Log là file người dùng hay gửi đi nhờ hỗ trợ kỹ thuật.

| Được ghi                                                        | Không được ghi                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| `person:update id=abc-123 fields=[fullName,phone] duration=4ms` | `person:update fullName="Nguyễn Văn An" phone="0901234567"` |
| `import: 3000 rows, 12 errors at rows [4,18,...]`               | Nội dung dòng lỗi                                           |

---

## 6.2 — Bắt lỗi toàn cục

**Lưới an toàn cấp ứng dụng** (`data-services.md` §5.5):

| Việc                                 | Chi tiết                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `process.on('uncaughtException')`    | Ghi log, hiện dialog, thoát có kiểm soát                                                                                                    |
| `process.on('unhandledRejection')`   | Ghi log                                                                                                                                     |
| `render-process-gone`                | Ghi log kèm `details.reason`, hiện dialog "Ứng dụng gặp sự cố" với hai lựa chọn Tải lại / Thoát                                             |
| `unresponsive` / `responsive`        | Sau ngưỡng chờ thì **hỏi** người dùng có tải lại không — **không tự reload**, có thể mất dữ liệu đang nhập dở. `responsive` thì đóng dialog |
| `preload-error` (trên `webContents`) | Ghi log. Đây là lỗi nghiêm trọng: `window.api` không tồn tại, app coi như không dùng được                                                   |
| `event:app-error`                    | Lỗi nền không gắn với request nào — đẩy sang Renderer để hiện toast                                                                         |

---

## 6.3 — Sao lưu

| Cơ chế              | Chi tiết                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Trước migration** | **Bắt buộc**, đã làm ở Phase 2. Giữ tối đa 5 bản                                                                      |
| **Định kỳ**         | Theo `data.autoBackup` + `data.backupIntervalDays`. Dùng **API backup của SQLite**, **không** copy file thô bằng `fs` |
| **Thủ công**        | Nút trong Cài đặt → tab Dữ liệu                                                                                       |
| **Dọn dẹp**         | Giới hạn theo số lượng hoặc dung lượng, tự xoá bản cũ nhất — không âm thầm chiếm đầy ổ đĩa                            |

> **Cảnh báo trong UI khi người dùng gửi backup đi nhờ hỗ trợ** (`security.md` §2):
> file backup là bản sao **đầy đủ** dữ liệu giáo dân. Mọi luật áp cho `app.db` đều áp cho backup.

---

## 6.4 — Khôi phục từ backup

Luồng: người dùng chọn file `.db` → app kiểm tra `user_version` **tương thích** → thay file → khởi động lại.

**Chặn hạ cấp áp cả ở đây** (`storage-strategy.md` §5.4 điểm 3): file backup có thể **mới hơn**
app đang chạy. `user_version` của file > số migration cao nhất trong build → **từ chối, không mở**.

---

## 6.5 — Tác vụ dọn dẹp

| Tác vụ                                                                       | Khi nào                                                               |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Xoá cứng bản ghi trong thùng rác quá `data.trashRetentionDays` (mặc định 30) | Lúc khởi động                                                         |
| `PRAGMA optimize`                                                            | Trước khi đóng kết nối                                                |
| `VACUUM`                                                                     | Định kỳ (ví dụ mỗi 30 ngày) hoặc khi người dùng bấm "Dọn dẹp dữ liệu" |

**Thứ tự xoá cứng phải đúng chiều khoá ngoại**: `family_members` → `persons` / `families` → `zones`.
Sai thứ tự sẽ vướng `RESTRICT`.

---

## 6.6 — Menu Trợ giúp

Mở thư mục dữ liệu · mở thư mục log (`shell.openPath`) · xem phiên bản.
Tiện cho việc hỗ trợ kỹ thuật từ xa.

---

## 6.7 — `activity_logs` _(có điều kiện)_

> Đây là bảng `history` trong `diagrams.jpg`, đã hoãn từ bước tiền đề
> ([00-domain-lock-in.md](./00-domain-lock-in.md) §7).
>
> **Hỏi trước khi làm**: giáo xứ có thật sự cần xem lịch sử sửa đổi không?
> Nếu không → **bỏ hẳn**, đừng làm cho có.

Nếu làm — **migration mới**, không sửa file cũ:

```
activity_logs (id, entity_type, entity_id, action, changes, created_at)
```

| Cột           | Ghi chú                                        |
| ------------- | ---------------------------------------------- |
| `entity_type` | `person` / `family` / `zone` / `family_member` |
| `entity_id`   | Trỏ về bản ghi cụ thể — điểm diagram gốc thiếu |
| `action`      | `created` / `updated` / `removed` / `restored` |
| `changes`     | JSON `{ field: [cũ, mới] }`                    |
| `created_at`  | ISO UTC                                        |

**Append-only**: không có `updated_at`, không có `deleted_at`. Xoá cứng theo `data.trashRetentionDays`.
Index trên `(entity_type, entity_id, created_at)`.

> Đây là **dữ liệu nghiệp vụ** người dùng xem được trên UI — khác với log chẩn đoán ở 6.1,
> nên **được phép** chứa giá trị người dùng nhập.

---

## 6.8 — Kiểm thử

| Loại              | Phạm vi                                     |
| ----------------- | ------------------------------------------- |
| Bổ sung unit test | Các luồng quan trọng còn thiếu từ Phase 4–5 |
| E2E (Playwright)  | **3 kịch bản chính**                        |

Ba kịch bản E2E đề xuất cho domain này:

| #   | Kịch bản                                                                            |
| --- | ----------------------------------------------------------------------------------- |
| 1   | Tạo giáo họ → tạo hộ → tạo giáo dân và gán vào hộ → kiểm tra hồ sơ hiển thị đúng    |
| 2   | Chuyển một người sang hộ khác → kiểm tra hộ cũ không còn, hộ mới có, lịch sử ghi đủ |
| 3   | Xoá một giáo dân → khôi phục từ thùng rác → dữ liệu trở về nguyên vẹn               |

---

## 6.9 — Rà soát hiệu năng

| Việc                                             | Cách làm                                                                           |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `EXPLAIN QUERY PLAN` cho truy vấn nóng           | `person:list` có lọc theo giáo họ · `family:getById` kèm thành viên · tìm kiếm FTS |
| Xác nhận **không có `SCAN TABLE`** trên bảng lớn | Nếu có → thiếu index                                                               |
| Kiểm tra rò rỉ listener                          | Thao tác liên tục 30 phút, đếm số listener                                         |
| Đo trước khi tối ưu                              | `agent-rules.md` §8 — không tối ưu theo cảm tính                                   |

---

## Definition of Done

- [ ] Kill tiến trình giữa lúc ghi dữ liệu → mở lại DB **không hỏng** (nhờ WAL + transaction)
- [ ] Backup và khôi phục thành công trên **dữ liệu thật**
- [ ] Khôi phục file backup có `user_version` cao hơn → bị từ chối, không mở
- [ ] Mọi lỗi đều để lại dấu vết trong log
- [ ] Ba sự kiện của `overview.md` §6.3 đều có handler: giết tiến trình Renderer bằng tay → hiện dialog, không treo cửa sổ trắng
- [ ] **Đọc toàn bộ file log: không có họ tên / địa chỉ / số điện thoại nào lọt vào**
- [ ] Bản ghi trong thùng rác quá 30 ngày bị xoá cứng đúng thứ tự khoá ngoại
- [ ] Không còn rò rỉ listener sau 30 phút thao tác liên tục
- [ ] `EXPLAIN QUERY PLAN` không còn `SCAN TABLE` trên `persons` / `families`
- [ ] 3 kịch bản E2E pass
- [ ] `npm run lint` + `npm run format:check` sạch

---

## Cạm bẫy của phase này

| Cạm bẫy                                      | Hệ quả                                                     |
| -------------------------------------------- | ---------------------------------------------------------- |
| Copy file `.db` thô bằng `fs` khi DB đang mở | Bản backup hỏng — phải dùng API backup của SQLite          |
| Ghi nội dung người dùng vào log              | Rò rỉ dữ liệu cá nhân khi người dùng gửi log đi nhờ hỗ trợ |
| Quên chặn hạ cấp ở luồng khôi phục backup    | Mở file mới hơn bằng code cũ → hỏng dữ liệu                |
| Xoá cứng sai thứ tự khoá ngoại               | Vướng `RESTRICT`, tác vụ dọn dẹp thất bại im lặng          |
| Làm `activity_logs` khi không ai cần         | Bảng phình mãi, thêm việc bảo trì, không ai xem            |
| Tối ưu trước khi đo                          | Nhắm sai chỗ                                               |

---

## Docs phải cập nhật trong phase này

| Thay đổi                              | File                                          |
| ------------------------------------- | --------------------------------------------- |
| Bảng `activity_logs` (nếu làm)        | `project/database-schema.md`                  |
| Cơ chế backup/restore thực tế         | `docs/02-backend-data/storage-strategy.md` §6 |
| Quyết định làm hay bỏ `activity_logs` | `project/decisions.md`                        |

**Xong → [phase-7-packaging.md](./phase-7-packaging.md)**
