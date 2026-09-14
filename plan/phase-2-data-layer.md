# Phase 2 — Tầng dữ liệu

> **Mục tiêu**: SQLite chạy thật, migration hoạt động, ba Repository + ba Service hoàn chỉnh,
> ghép được vào IPC.
>
> **Ước lượng**: 2–3 ngày · **Tiền đề**: Phase 1 đạt đủ Definition of Done

**Đọc trước**: `docs/02-backend-data/storage-strategy.md`, `docs/02-backend-data/data-services.md`,
`project/database-schema.md` §1, `docs/04-guidelines/coding-standards-backend.md` §3.

**Schema đích**: [00-domain-lock-in.md](./00-domain-lock-in.md) §4 — đọc trước khi viết `001_init.sql`.

---

## 2.1 — Cài `better-sqlite3`

| Việc           | Chi tiết                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Đặt ở          | **`backend/dependencies`** — native module, không bundle được                                                                                |
| Ghim phiên bản | **Chính xác**, không `^`, không `~` (`CLAUDE.md`, `security.md` §3)                                                                          |
| `postinstall`  | **Không đặt.** Đã kiểm chứng: v13.0.3 nạp thẳng dưới Electron 44 (ABI 149) nhờ prebuild Node-API trong gói npm (`project-structure.md` §6.1) |

Nếu có lệnh nào cố chạy `node-gyp` và báo `Could not find any Python installation` → đang rebuild
nhầm một gói Node-API. Kiểm tra `backend/node_modules/better-sqlite3/prebuilds/` trước khi đi cài
toolchain C++ (`project-structure.md` §6.1).

---

## 2.1b — Build thử một bản đóng gói NGAY

> **Không bỏ qua bước này.** Toàn bộ lỗi cấu hình build **không xuất hiện lúc `npm run dev`** —
> chỉ lộ ra ở bản đóng gói. Lúc này app còn đơn giản nên lỗi native module dễ khoanh vùng.
> Để tới Phase 7 mới build lần đầu thì mọi lỗi ập đến cùng lúc (`project-structure.md` §10).

Chạy đủ 4 bước build:

```
1. cd frontend && vite build           → đổ vào backend/renderer/
2. cd backend  && electron-vite build  → backend/out/main.js, preload.js
3. (bỏ qua — Node-API không cần rebuild; electron-builder.yml đặt npmRebuild: false)
4. electron-builder --win              → backend/release/*.exe
```

Checklist tối thiểu ở lần build này:

- [ ] Cài được trên máy Windows **chưa cài Node.js**
- [ ] Mở app không màn hình trắng
- [ ] `window.api` tồn tại
- [ ] **Đọc/ghi SQLite thành công** — chứng tỏ native module nạp được
- [ ] File DB nằm trong `%APPDATA%`, **không** nằm cạnh `.exe`
- [ ] Kích thước file cài 70–120MB (vượt 250MB → `electron` đang nằm nhầm ở `dependencies`)

Cấu hình tối thiểu cho `electron-builder.yml` ở bước này (hoàn thiện ở Phase 7):

| Khoá                 | Giá trị                                 | Sai thì sao                          |
| -------------------- | --------------------------------------- | ------------------------------------ |
| `files`              | `out/**`, `renderer/**`, `package.json` | Thiếu `renderer/**` → màn hình trắng |
| `asarUnpack`         | `"**/*.node"`                           | Crash: _Cannot find module ...node_  |
| `directories.output` | `release`                               |                                      |

---

## 2.2 — `backend/src/db/connection.js`

Singleton. Mở **một lần duy nhất** lúc khởi động, tái sử dụng suốt vòng đời app.
Đóng tường minh trong `before-quit`.

Năm pragma **bắt buộc**, đặt ngay sau khi mở kết nối (`storage-strategy.md` §4):

| Pragma         | Giá trị  | Lý do                                                                    |
| -------------- | -------- | ------------------------------------------------------------------------ |
| `journal_mode` | `WAL`    | Đọc–ghi đồng thời, khôi phục tốt khi crash. **Quan trọng nhất**          |
| `foreign_keys` | `ON`     | SQLite **mặc định TẮT**. Không bật thì mọi `REFERENCES` chỉ là trang trí |
| `synchronous`  | `NORMAL` | Cân bằng an toàn/tốc độ khi đã bật WAL                                   |
| `busy_timeout` | `5000`   | Chờ 5 giây thay vì ném lỗi ngay                                          |
| `temp_store`   | `MEMORY` | Bảng tạm trong RAM                                                       |

Vị trí file: `app.getPath('userData')/data/app.db` — **luôn** qua `app.getPath()` + `path.join()`,
không bao giờ hardcode.

> Ở chế độ dev dùng thư mục `userData` riêng (`app.setPath`) để không làm bẩn dữ liệu thật.
> Đặc biệt quan trọng khi dùng **git worktree** — xem `docs/05-git/worktree.md` §4.2.

---

## 2.3 — `backend/src/db/migrator.js`

Luồng khởi động **đúng thứ tự** (`CLAUDE.md`, `storage-strategy.md` §5.3–5.4):

```
1. app.requestSingleInstanceLock()   → không có lock thì quit NGAY
2. Đọc PRAGMA user_version
3. user_version > số migration cao nhất? → dialog + quit (CHẶN HẠ CẤP)
4. Backup app.db sang backups/ → chạy migration trong transaction
5. Mở kết nối + set pragma
6. Đăng ký IPC handler
7. Tạo cửa sổ (chỉ hiện khi 'ready-to-show')
```

**Bước 3 là bắt buộc, không được bỏ.** Nếu người dùng cài lại bản cũ lên DB mới:
code cũ không biết các cột mới, ghi đè lên → **hỏng dữ liệu vĩnh viễn, không phục hồi được**.
Thoát app là hành vi **đúng**.

Mỗi migration chạy trong **một transaction**: thành công → commit + tăng `user_version`;
lỗi → rollback toàn bộ, hiện dialog, thoát app, **DB cũ còn nguyên**.

Giữ tối đa **5 bản backup** gần nhất.

---

## 2.4 — `backend/src/db/migrations/001_init.sql`

> **Nội dung đầy đủ ở [00-domain-lock-in.md](./00-domain-lock-in.md) §4.** Không chép lại ở đây
> để tránh hai nguồn chân lý.

Thứ tự tạo bảng (theo chiều phụ thuộc khoá ngoại):

```
1. settings
2. zones
3. families        (FK → zones)
4. persons
5. family_members  (FK → families, persons)
6. toàn bộ index
```

**Bảng kiểm trước khi coi là xong** — đối chiếu checklist §6 của `project/database-schema.md`:

- [ ] Tên bảng **số nhiều**, snake_case
- [ ] Mọi bảng nghiệp vụ có đủ `id`, `created_at`, `updated_at`, `deleted_at`
- [ ] `id` là `TEXT PRIMARY KEY` chứa UUID v4 — **không** `INTEGER AUTOINCREMENT`
- [ ] Khai báo đầy đủ `NOT NULL`, `DEFAULT`, `CHECK`
- [ ] Mọi khoá ngoại có `ON DELETE` **tường minh** (mặc định dự án: `RESTRICT`)
- [ ] Có index cho **mọi** cột dùng trong `WHERE` / `ORDER BY` / `JOIN`
- [ ] Hai partial unique index của `family_members` đã tạo đúng: - `uq_family_members_current` — mỗi người 1 hộ hiện hành - `uq_family_members_head` — mỗi hộ 1 chủ hộ
- [ ] Ngày trên lịch dùng hậu tố `_date`, mốc thời gian dùng `_at`

**Luật viết migration** (`storage-strategy.md` §5.5):

| Luật                                                          | Lý do                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Migration **không được import code ứng dụng**                 | Code đổi theo thời gian; migration phải **tự chứa**, chỉ SQL thuần |
| Chỉ được giả định schema **ở đúng version liền trước**        |                                                                    |
| **Không bao giờ** sửa file migration đã phát hành             | Hai máy sẽ có schema khác nhau cùng một `user_version`             |
| Sửa migration sai đã phát hành → viết migration **mới** để vá |                                                                    |

---

## 2.5 — Seed

**File**: `backend/src/db/seed.js`

Chỉ seed bảng `settings` với giá trị mặc định ở [00-domain-lock-in.md](./00-domain-lock-in.md) §4.6.

**Không seed dữ liệu nghiệp vụ mẫu** — dữ liệu giáo dân là dữ liệu thật; bản ghi mẫu sẽ lẫn
vào danh sách và người dùng phải đi xoá. Màn hình trống dùng `EmptyState` để hướng dẫn.

Phải **idempotent** (`INSERT OR IGNORE`) — chạy lại nhiều lần không sinh dữ liệu trùng.

---

## 2.6 — Repository

**File**: `zone.repository.js`, `family.repository.js`, `person.repository.js`, `family-member.repository.js`

Repository là nơi **DUY NHẤT** viết SQL. Không có nghiệp vụ ở đây.

**Bộ phương thức chuẩn** (`data-services.md` §2.2) — mỗi Repository tối thiểu có:

| Phương thức         | Trả về                          | Ghi chú                          |
| ------------------- | ------------------------------- | -------------------------------- |
| `findById(id)`      | object hoặc `null`              | Không ném lỗi khi không tìm thấy |
| `findMany(filter)`  | mảng                            | **Luôn** có phân trang           |
| `count(filter)`     | số                              | Cho `meta.total`                 |
| `insert(record)`    | object vừa tạo                  |                                  |
| `update(id, patch)` | object sau cập nhật hoặc `null` |                                  |
| `softDelete(id)`    | boolean                         |                                  |
| `hardDelete(id)`    | boolean                         |                                  |
| `exists(id)`        | boolean                         | Rẻ hơn `findById`                |

**Phương thức riêng của domain này**:

| Repository      | Phương thức thêm                               | Mục đích                                       |
| --------------- | ---------------------------------------------- | ---------------------------------------------- |
| `family-member` | `findCurrentByPersonId(personId)`              | Hộ hiện hành của một người (`to_date IS NULL`) |
| `family-member` | `findByFamilyId(familyId, { includeHistory })` | Thành viên của hộ                              |
| `family-member` | `findHistoryByPersonId(personId)`              | Lịch sử chuyển hộ                              |
| `family-member` | `closeCurrent(personId, toDate)`               | Đóng dòng hiện hành — dùng cho `move`          |
| `family`        | `countMembers(familyId)`                       | Cho `memberCount`                              |
| `zone`          | `countFamiliesAndPersons(zoneId)`              | Cho `familyCount` / `personCount`              |

**Luật viết SQL** (`coding-standards-backend.md` §3):

| Luật                                                                              | Ghi chú                                                          |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Prepared statement** cho mọi truy vấn, chuẩn bị **một lần**, tái sử dụng        | Điểm mạnh hiệu năng lớn nhất của `better-sqlite3`                |
| Tham số hoá `?` luôn luôn                                                         |                                                                  |
| Ngoại lệ duy nhất được ghép chuỗi: `ORDER BY` — **phải đối chiếu whitelist cứng** |                                                                  |
| **Cấm `SELECT *`**                                                                | Liệt kê cột tường minh                                           |
| Mọi truy vấn danh sách có `LIMIT`                                                 |                                                                  |
| Mọi truy vấn đọc có `WHERE deleted_at IS NULL`                                    | Repository cung cấp sẵn hàm dựng query có điều kiện này mặc định |
| **Cấm truy vấn trong vòng lặp (N+1)**                                             | Lấy `familyName`/`zoneName` bằng `JOIN`, không lặp `findById`    |
| Repository **không** import `services/`                                           | ESLint cưỡng chế                                                 |

**Mapper `toDomain(row)`** (§2.3) — ranh giới chuyển `snake_case` ↔ `camelCase` **kết thúc ở đây**:

| Trong DB                     | Trong JS                                       |
| ---------------------------- | ---------------------------------------------- |
| `full_name_ascii`            | `fullNameAscii`                                |
| `zone_id: "uuid"`            | `zoneId: "uuid"`                               |
| `baptism_date: "1990-05-01"` | `baptismDate: "1990-05-01"` (giữ nguyên chuỗi) |
| `to_date: null`              | `toDate: null` → suy ra `isCurrent: true`      |

`toDomain` phải **chịu được dữ liệu lỗi**: không làm sập cả truy vấn vì một dòng hỏng.

---

## 2.7 — Service

**File**: `zone.service.js`, `family.service.js`, `person.service.js`, `family-member.service.js`

**Khuôn mẫu một phương thức Service** (`data-services.md` §3.1):

```
1. Kiểm tra tiền điều kiện nghiệp vụ
2. Chuẩn bị dữ liệu  (sinh id, gán created_at/updated_at, mặc định, chuẩn hoá chuỗi)
3. Thực thi          (gọi Repository — gói transaction nếu chạm nhiều bảng)
4. Xử lý phụ trợ     (ghi log, xoá file vật lý)
5. Trả về đối tượng domain hoàn chỉnh
```

**Chuẩn hoá đầu vào — bắt buộc trước mọi lần ghi** (§3.3):

1. `trim()` mọi chuỗi người dùng nhập
2. Chuỗi rỗng sau trim → `null` (với cột cho phép NULL). **Không** lưu `""`
3. **Chuẩn hoá Unicode về NFC** — quan trọng với tiếng Việt: cùng chữ "ế" có thể gõ bằng hai chuỗi mã khác nhau, gây lỗi so sánh và tìm kiếm
4. Ép kiểu số bằng kiểm tra tường minh
5. Cắt chuỗi vượt giới hạn thay vì để DB ném `CHECK`

**Nguyên tắc** (§3.2):

| Nguyên tắc                                              | Diễn giải                                                                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Không import `electron`**                             | Service phải chạy được bằng `node` thuần để unit test. Cần đường dẫn → **nhận qua tham số**, không gọi `app.getPath()` bên trong |
| Ném `AppError` có kiểu                                  | Không trả `null` mơ hồ để tầng trên tự đoán                                                                                      |
| Thời gian tập trung một chỗ                             | Một hàm `now()` dùng chung, để test giả lập thời gian được                                                                       |
| Service sinh `id` (UUID v4), `created_at`, `updated_at` | Renderer **không** gửi `id` khi tạo                                                                                              |

### 2.7.1 — Nghiệp vụ riêng của domain

| Service         | Quy tắc                                                                                                            | Mã lỗi khi vi phạm                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `person`        | `fullNameAscii` **luôn** sinh lại từ `fullName` mỗi lần ghi (NFC → bỏ dấu → lowercase). Renderer không gửi cột này | —                                  |
| `person`        | `deathDate` không được trước `birthDate`                                                                           | `VALIDATION_ERROR`                 |
| `person`        | Ngày bí tích không được sau `deathDate`, không được trước `birthDate`                                              | `VALIDATION_ERROR`                 |
| `person`        | `baptism ≤ firstCommunion ≤ confirmation` — **cảnh báo, không chặn** (sổ cũ hay thiếu dữ liệu)                     | trả `meta.warnings`                |
| `person`        | Xoá mềm người → xoá mềm dòng `family_members` hiện hành **trong cùng transaction**                                 | —                                  |
| `family`        | Xoá hộ còn thành viên hiện hành → **chặn**, kèm số thành viên                                                      | `CONFLICT` + `details.memberCount` |
| `zone`          | Xoá giáo họ còn hộ → **chặn**                                                                                      | `FOREIGN_KEY_VIOLATION`            |
| `family-member` | Thêm người đã có hộ hiện hành → **chặn**, gợi ý dùng `move`                                                        | `CONFLICT`                         |
| `family-member` | Gán `head` cho hộ đã có chủ hộ → **chặn**                                                                          | `CONFLICT`                         |
| `family-member` | `move`: đóng dòng cũ (`to_date = moveDate`) + mở dòng mới, **một transaction**                                     | —                                  |
| `family-member` | `moveDate` không được trước `from_date` của dòng đang đóng                                                         | `VALIDATION_ERROR`                 |

### 2.7.2 — Kiểm tra `expectedUpdatedAt`

Mọi kênh `*:update` **bắt buộc** nhận `expectedUpdatedAt` (`ipc-communication.md` §4b):

| Bước | Việc                                                                                          |
| ---- | --------------------------------------------------------------------------------------------- |
| 1    | Service so sánh `expectedUpdatedAt` với `updated_at` hiện tại trong DB                        |
| 2    | Khác nhau → ném `AppError` mã **`CONFLICT`**, kèm `details.currentRecord` là bản ghi mới nhất |
| 3    | Việc so sánh và ghi phải nằm **trong cùng một transaction** — nếu không vẫn còn khe hở        |

> Bỏ qua luật này bây giờ thì đến Phase 8 (đa cửa sổ) phải sửa lại toàn bộ kênh `update` cùng schema của chúng.

### 2.7.3 — Transaction

Bắt buộc dùng transaction khi (`data-services.md` §6.1):

- Ghi vào **nhiều hơn một bảng** (`person:create` có kèm `family`, `family-member:move`)
- Kiểm tra `expectedUpdatedAt` rồi ghi
- Xoá mềm kéo theo bản ghi liên quan

Transaction **thuộc tầng Service**, không phải Repository.
**Xoá file vật lý phải nằm sau commit** (`CLAUDE.md`).

---

## 2.8 — Ghép IPC

**File**: `zone.ipc.js`, `family.ipc.js`, `person.ipc.js`, `family-member.ipc.js` trong `backend/src/main/ipc/`,
đăng ký ở `ipc/index.js`.

**File schema**: `zone.schema.js`, `family.schema.js`, `person.schema.js`, `family-member.schema.js`
trong `backend/src/schemas/`.

Đúng 5 bước của handler (đã dựng ở Phase 1). Kiểm tra thêm:

- [ ] Mọi kênh `*:update` có `expectedUpdatedAt` trong schema
- [ ] Mọi thao tác ghi thành công phát broadcast event đúng kênh
- [ ] Danh sách phân trang: `pageSize` mặc định 50, **tối đa 200**
- [ ] `sortBy` đối chiếu whitelist ở Repository, không truyền thẳng vào SQL

---

## 2.9 — Test

**Chính sách test** (`coding-standards.md` §5b): Service và Repository là nơi **bắt buộc** có test.

**Runner**: `node:test` có sẵn trong Node 22 — **không thêm dependency** (quyết định P11).
Thêm `"test": "node --test"` vào `backend/package.json` **ở phase này**, khi đã có file test đầu tiên
(chạy `node --test` lúc chưa có file nào sẽ báo lỗi). Script gốc `npm run test` gọi xuống cả hai package.
Đổi sang Vitest khi Phase 4 cần test component — `describe`/`it`/`assert` viết gần như không khác.

| Loại       | Cách chạy                                                                |
| ---------- | ------------------------------------------------------------------------ |
| Repository | SQLite **in-memory** (`:memory:`), chạy `001_init.sql` lên rồi test thật |
| Service    | Mock Repository                                                          |

**Ca test tối thiểu của domain này**:

| #   | Ca                                                               | Kỳ vọng                                                                                |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Tạo người rồi gán vào hộ                                         | 1 dòng `family_members` với `to_date IS NULL`                                          |
| 2   | Gán người đã có hộ hiện hành vào hộ thứ hai                      | `CONFLICT`                                                                             |
| 3   | Ghi thẳng 2 dòng `to_date IS NULL` cho cùng `person_id` bằng SQL | DB chặn bằng `uq_family_members_current`                                               |
| 4   | Gán `head` thứ hai cho một hộ                                    | `CONFLICT` (và DB chặn bằng `uq_family_members_head`)                                  |
| 5   | `move` sang hộ khác                                              | Dòng cũ có `to_date = moveDate`, dòng mới `to_date IS NULL`, **đúng 1** dòng hiện hành |
| 6   | `move` thất bại giữa chừng                                       | Rollback — dòng cũ **vẫn** `to_date IS NULL`                                           |
| 7   | Xoá giáo họ còn hộ                                               | `FOREIGN_KEY_VIOLATION`                                                                |
| 8   | Xoá hộ còn thành viên                                            | `CONFLICT` kèm `memberCount`                                                           |
| 9   | Xoá mềm người                                                    | Dòng `family_members` hiện hành cũng bị xoá mềm                                        |
| 10  | `update` với `expectedUpdatedAt` cũ                              | `CONFLICT` + `details.currentRecord`                                                   |
| 11  | Tên `"  Nguyễn Văn An  "`                                        | Lưu thành `"Nguyễn Văn An"`, `full_name_ascii = "nguyen van an"`                       |
| 12  | Tên gõ bằng tổ hợp Unicode khác (NFD)                            | Sau chuẩn hoá NFC, so sánh bằng với bản NFC                                            |
| 13  | `deathDate` trước `birthDate`                                    | `VALIDATION_ERROR`                                                                     |
| 14  | Ghi chú chứa dấu nháy đơn `'` và emoji                           | Lưu và đọc lại **nguyên vẹn**                                                          |

---

## Definition of Done

- [ ] App khởi động lần đầu tạo file DB đúng vị trí (`%APPDATA%/.../data/app.db`), chạy xong migration
- [ ] Khởi động lần hai **không** chạy lại migration
- [ ] Migration lỗi → hiện dialog, thoát an toàn, **DB cũ còn nguyên**
- [ ] Giả lập `user_version` cao hơn số migration → app hiện dialog và thoát, **không** mở kết nối ghi
- [ ] Backup được tạo trong `backups/` trước khi migrate
- [ ] Tạo/đọc/sửa/xoá giáo dân, hộ, giáo họ qua IPC thành công; dữ liệu còn sau khi tắt mở lại
- [ ] Xoá giáo họ còn hộ → bị chặn đúng thiết kế
- [ ] `PRAGMA foreign_keys` xác nhận **đang bật**
- [ ] Chuyển hộ chạy đúng: đúng 1 dòng hiện hành sau khi chuyển
- [ ] Bản đóng gói ở 2.1b đọc/ghi được SQLite trên máy sạch
- [ ] Toàn bộ test ở 2.9 pass
- [ ] Không có token/mật khẩu nào trong bảng dữ liệu (`security.md` §7)
- [ ] `npm run lint` + `npm run format:check` sạch

---

## Cạm bẫy của phase này

| Cạm bẫy                                             | Hệ quả                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Quên `PRAGMA foreign_keys = ON`                     | Mọi `REFERENCES` chỉ là trang trí — dữ liệu mồ côi âm thầm        |
| Bỏ bước chặn hạ cấp (2.3 bước 3)                    | Cài lại bản cũ → **hỏng dữ liệu vĩnh viễn**                       |
| Kiểm tra `expectedUpdatedAt` **ngoài** transaction  | Vẫn còn khe hở mất dữ liệu                                        |
| Truy vấn `findById` trong vòng lặp để lấy tên hộ    | N+1 — chậm dần theo số bản ghi                                    |
| Quên `WHERE deleted_at IS NULL` ở một truy vấn      | Bản ghi đã xoá hiện lại trên UI                                   |
| Ghép chuỗi `ORDER BY` từ payload mà không whitelist | SQL injection                                                     |
| "Làm sạch" dấu nháy trước khi lưu                   | Hỏng tên `O'Brien` — tham số hoá đã xử lý xong (`security.md` §6) |
| Bỏ qua 2.1b                                         | Mọi lỗi đóng gói dồn tới Phase 7                                  |

---

## Docs phải cập nhật trong phase này

| Thay đổi                                     | File                                           |
| -------------------------------------------- | ---------------------------------------------- |
| Bảng / cột / index thực tế khác với thiết kế | `project/database-schema.md`                   |
| Kênh IPC phát sinh                           | `docs/01-architecture/ipc-communication.md` §5 |
| Quan hệ dữ liệu mới                          | `docs/03-frontend/state-management.md` §3.1    |
| Thuật ngữ nghiệp vụ mới                      | `project/glossary.md`                          |

**Xong → [phase-3-ui-shell.md](./phase-3-ui-shell.md)**
