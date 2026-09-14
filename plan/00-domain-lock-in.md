# Tiền đề — Chốt domain "Quản lý giáo dân giáo xứ"

> **Phải xong trước Phase 0.** Đây không phải một phase của `docs/04-guidelines/phase-framework.md`.
> Việc này đóng **Q01** ở `project/decisions.md` §2 — quyết định đang chặn toàn bộ dự án.
>
> **Chỉ sửa docs. Không viết code.** Thứ tự bắt buộc của `recipes.md`: _Docs → Shared → Backend → Frontend → Test_.

**Đọc trước**: `docs/04-guidelines/recipes.md` (Công thức 8), `docs/00-meta/agent-rules.md` §7.

---

## 1. Bối cảnh

`diagrams.jpg` ở gốc repo là bản vẽ ER do người dùng cung cấp: hệ thống quản lý
giáo dân cho giáo xứ. Bản vẽ dùng cú pháp MySQL (`INT(10)`, `VARCHAR(50)`,
`DATETIME`) nên phải dịch sang quy ước SQLite của dự án trước khi dùng được.

Toàn bộ `docs/` hiện đang viết theo domain mẫu **Task Manager**. Việc của bước
này là thay phần domain-cụ-thể, **giữ nguyên** mọi quy ước kỹ thuật.

---

## 2. Bốn quyết định đã chốt

| #   | Câu hỏi          | Chọn                                                                                          | Hệ quả                                                                                                         |
| --- | ---------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Phạm vi bí tích  | **Giữ đúng diagram** — 5 cột ngày phẳng trên `persons`                                        | Không có bảng `sacraments`. **Không in được chứng thư.** Muốn in sau này phải migration rebuild bảng `persons` |
| 2   | Giáo họ          | **Theo gia đình** — bỏ `person_zone` và `family_zone`, thay bằng FK `zone_id` trên `families` | Giáo họ của một người suy ra qua hộ hiện hành. Không thể mâu thuẫn                                             |
| 3   | Tên người        | **`full_name` + `given_name`** + `full_name_ascii` bỏ dấu                                     | Hợp với tên tiếng Việt, sắp xếp theo tên gọi, tìm kiếm không dấu                                               |
| 4   | Quan hệ người–hộ | **Bảng nối + `from_date`/`to_date`**, đúng 1 hộ hiện hành                                     | Ghi được lịch sử chuyển hộ (lấy chồng, chuyển xứ)                                                              |

---

## 3. Bảng ánh xạ diagram → schema dự án

Dùng bảng này để kiểm chứng: mọi ô trong `diagrams.jpg` phải có đúng một dòng ở đây.

| Trong diagram           | Trong dự án                              | Ghi chú                                                                                                    |
| ----------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `PERSON`                | `persons`                                | Số nhiều, snake_case (§1.1)                                                                                |
| `FAMILY`                | `families`                               |                                                                                                            |
| `ZONE`                  | `zones`                                  |                                                                                                            |
| `person_family`         | `family_members`                         | Thêm `from_date`/`to_date`                                                                                 |
| `person_zone`           | **bỏ**                                   | Suy ra qua `family_members` → `families.zone_id`                                                           |
| `family_zone`           | **bỏ**                                   | Thay bằng cột `families.zone_id`                                                                           |
| `options`               | `settings`                               | Đã đặc tả sẵn ở `project/database-schema.md` §3.7. Diagram để `key` 10 ký tự / `value` 30 ký tự — quá ngắn |
| `history`               | **hoãn**                                 | Xem §7. Thiết kế lại thành `activity_logs` ở Phase 6                                                       |
| `PID` `INT(10)`         | `id TEXT PRIMARY KEY` (UUID v4)          | D03. `INT(10)` là display-width MySQL, vô nghĩa trong SQLite                                               |
| `FID` / `ZID`           | `family_id` / `zone_id`                  | FK đặt `<bảng số ít>_id` (§1.1)                                                                            |
| `VARCHAR(n)`            | `TEXT` + `CHECK (length(col) <= n)`      | SQLite không cưỡng chế độ dài                                                                              |
| `gender INIT(1)`        | `gender TEXT CHECK IN ('male','female')` | `INIT` là lỗi gõ của `INT`                                                                                 |
| `date_of_birth DATE`    | `birth_date`                             | Hậu tố `_date` (§1.2b)                                                                                     |
| `date_RT`               | `baptism_date`                           | Rửa tội                                                                                                    |
| `date_RL`               | `first_communion_date`                   | Rước lễ lần đầu                                                                                            |
| `date_TS`               | `confirmation_date`                      | Thêm sức                                                                                                   |
| `date_HP`               | `marriage_date`                          | Hôn phối                                                                                                   |
| `date_Dead`             | `death_date`                             | Qua đời                                                                                                    |
| `history.time DATETIME` | `created_at TEXT` ISO UTC                | `DATETIME` không phải kiểu SQLite                                                                          |
| _(không có)_            | `created_at`, `updated_at`, `deleted_at` | **Bắt buộc trên mọi bảng nghiệp vụ** (§1.4). Thiếu thì `expectedUpdatedAt` không có gì để so               |
| _(không có)_            | Toàn bộ index                            | Checklist §6: index cho mọi cột `WHERE`/`ORDER BY`/`JOIN`                                                  |

---

## 4. Schema đích — nội dung điền vào `project/database-schema.md`

Mọi bảng nghiệp vụ đều có `id` / `created_at` / `updated_at` / `deleted_at` theo
`database-conventions.md` §1.4 — không lặp lại bên dưới.

### 4.1. `zones` — Giáo họ

| Cột         | Kiểu | Ràng buộc                     | Mô tả            |
| ----------- | ---- | ----------------------------- | ---------------- |
| `name`      | TEXT | NOT NULL, CHECK(length 1–100) | Tên giáo họ      |
| `holy_name` | TEXT | NULL, CHECK(length ≤ 75)      | Bổn mạng giáo họ |
| `note`      | TEXT | NULL                          |                  |

**Index**

| Tên                    | Cột                                      | Mục đích                |
| ---------------------- | ---------------------------------------- | ----------------------- |
| `idx_zones_deleted_at` | `deleted_at`                             | Lọc bản ghi còn sống    |
| `uq_zones_name`        | `name` UNIQUE `WHERE deleted_at IS NULL` | Không trùng tên giáo họ |

### 4.2. `families` — Gia đình / hộ

| Cột       | Kiểu | Ràng buộc                                     | Mô tả                          |
| --------- | ---- | --------------------------------------------- | ------------------------------ |
| `zone_id` | TEXT | NOT NULL, FK → `zones(id)` ON DELETE RESTRICT | Giáo họ chứa hộ này            |
| `name`    | TEXT | NOT NULL, CHECK(length 1–120)                 | Tên hộ, thường theo tên chủ hộ |
| `address` | TEXT | NULL, CHECK(length ≤ 255)                     |                                |
| `note`    | TEXT | NULL                                          |                                |

**Index**

| Tên                       | Cột                   | Mục đích                                 |
| ------------------------- | --------------------- | ---------------------------------------- |
| `idx_families_zone_id`    | `zone_id, deleted_at` | Lọc hộ theo giáo họ — truy vấn nóng nhất |
| `idx_families_deleted_at` | `deleted_at`          |                                          |

### 4.3. `persons` — Giáo dân

| Cột                    | Kiểu | Ràng buộc                            | Mô tả                                  |
| ---------------------- | ---- | ------------------------------------ | -------------------------------------- |
| `full_name`            | TEXT | NOT NULL, CHECK(length 1–120)        | Nguyên văn như trên giấy tờ            |
| `given_name`           | TEXT | NULL, CHECK(length ≤ 50)             | Tên gọi, dùng để sắp xếp               |
| `full_name_ascii`      | TEXT | NOT NULL                             | Service sinh: NFC → bỏ dấu → lowercase |
| `holy_name`            | TEXT | NULL, CHECK(length ≤ 75)             | Tên thánh                              |
| `gender`               | TEXT | NULL, CHECK IN (`'male'`,`'female'`) |                                        |
| `birth_date`           | TEXT | NULL                                 | `YYYY-MM-DD`                           |
| `baptism_date`         | TEXT | NULL                                 | Ngày rửa tội                           |
| `first_communion_date` | TEXT | NULL                                 | Ngày rước lễ lần đầu                   |
| `confirmation_date`    | TEXT | NULL                                 | Ngày thêm sức                          |
| `marriage_date`        | TEXT | NULL                                 | Ngày hôn phối                          |
| `death_date`           | TEXT | NULL                                 | `NULL` = còn sống                      |
| `phone`                | TEXT | NULL, CHECK(length ≤ 20)             |                                        |
| `note`                 | TEXT | NULL                                 |                                        |

**Index**

| Tên                           | Cột                                                                | Mục đích                  |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------- |
| `idx_persons_full_name_ascii` | `full_name_ascii, deleted_at`                                      | Tìm kiếm không dấu        |
| `idx_persons_deleted_at`      | `deleted_at`                                                       |                           |
| `idx_persons_birth_date`      | `birth_date` `WHERE birth_date IS NOT NULL AND deleted_at IS NULL` | Danh sách sinh nhật       |
| `idx_persons_death_date`      | `death_date` `WHERE death_date IS NOT NULL AND deleted_at IS NULL` | Lọc còn sống / đã qua đời |

**Ràng buộc nghiệp vụ (tầng Service)**

1. `full_name_ascii` **luôn** do Service sinh lại từ `full_name` mỗi lần ghi. Renderer không gửi cột này.
2. `death_date` không được **trước** `birth_date`.
3. Các ngày bí tích không được **sau** `death_date` và không được **trước** `birth_date`.
4. Thứ tự tự nhiên `baptism_date` ≤ `first_communion_date` ≤ `confirmation_date` — **cảnh báo**, không chặn (sổ cũ hay thiếu dữ liệu).

### 4.4. `family_members` — Thành viên hộ

| Cột            | Kiểu | Ràng buộc                                        | Mô tả                     |
| -------------- | ---- | ------------------------------------------------ | ------------------------- |
| `family_id`    | TEXT | NOT NULL, FK → `families(id)` ON DELETE RESTRICT |                           |
| `person_id`    | TEXT | NOT NULL, FK → `persons(id)` ON DELETE RESTRICT  |                           |
| `relationship` | TEXT | NOT NULL, CHECK IN danh sách §4.5                | Quan hệ với chủ hộ        |
| `from_date`    | TEXT | NOT NULL                                         | `YYYY-MM-DD`, ngày vào hộ |
| `to_date`      | TEXT | NULL                                             | `NULL` = đang ở hộ này    |
| `note`         | TEXT | NULL                                             |                           |

**Index**

| Tên                            | Cột                                                                                         | Mục đích                          |
| ------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------- |
| `idx_family_members_family_id` | `family_id, deleted_at`                                                                     | Lấy danh sách thành viên của hộ   |
| `idx_family_members_person_id` | `person_id, deleted_at`                                                                     | Lấy lịch sử hộ của một người      |
| `uq_family_members_current`    | `person_id` UNIQUE `WHERE to_date IS NULL AND deleted_at IS NULL`                           | **Mỗi người đúng 1 hộ hiện hành** |
| `uq_family_members_head`       | `family_id` UNIQUE `WHERE relationship = 'head' AND to_date IS NULL AND deleted_at IS NULL` | **Mỗi hộ đúng 1 chủ hộ**          |

> Hai index `uq_*` đưa ràng buộc nghiệp vụ xuống tầng DB. Service vẫn phải kiểm tra
> trước để trả `CONFLICT` với thông điệp tiếng Việt dễ hiểu, nhưng DB là lưới an toàn cuối.

**Ngoại lệ có chủ ý so với `project/database-schema.md` §1.1 và §1.5**

| Sai lệch                                               | Lý do                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Tên là `family_members`, không phải `families_persons` | Đây là **thực thể** có thuộc tính và vòng đời riêng, không phải bảng nối thuần |
| Có đủ 4 cột audit (bảng nối bình thường xoá cứng)      | Cần `updated_at` cho `expectedUpdatedAt`, cần `deleted_at` cho thùng rác       |
| Có `id` riêng thay vì khoá chính kép                   | Một người có thể vào–ra cùng một hộ nhiều lần                                  |

→ **Phải ghi ngoại lệ này vào `project/decisions.md`** (agent-rules §2: "Bỏ qua một luật trong docs vì trường hợp đặc biệt — ngoại lệ phải được ghi nhận, không được im lặng").

### 4.5. Giá trị `relationship`

| Giá trị       | Hiển thị   |
| ------------- | ---------- |
| `head`        | Chủ hộ     |
| `spouse`      | Vợ/Chồng   |
| `child`       | Con        |
| `parent`      | Cha/Mẹ     |
| `grandparent` | Ông/Bà     |
| `grandchild`  | Cháu       |
| `sibling`     | Anh/Chị/Em |
| `relative`    | Họ hàng    |
| `other`       | Khác       |

### 4.6. `settings` — khoá riêng của dự án

Cấu trúc bảng là chuẩn template (`database-conventions.md` §2). Khoá riêng của dự án:

| Key                       | Mặc định        | Mô tả                                              |
| ------------------------- | --------------- | -------------------------------------------------- |
| `ui.theme`                | `"system"`      | giữ                                                |
| `ui.density`              | `"comfortable"` | giữ                                                |
| `ui.sidebarWidth`         | `260`           | giữ                                                |
| `general.language`        | `"vi"`          | giữ                                                |
| `general.parishName`      | `""`            | **mới** — tên giáo xứ, hiện trên tiêu đề và bản in |
| `general.startOfWeek`     | `1`             | giữ                                                |
| `data.autoBackup`         | `true`          | giữ                                                |
| `data.backupIntervalDays` | `7`             | giữ                                                |
| `data.trashRetentionDays` | `30`            | giữ                                                |

### 4.7. ERD

```
┌──────────────┐            ┌──────────────┐
│    zones     │ 1        N │   families   │
│──────────────│───────────▶│──────────────│
│ id      (PK) │            │ id      (PK) │
│ name  UNIQUE │            │ zone_id   FK │
│ holy_name    │            │ name         │
│ note         │            │ address      │
└──────────────┘            └──────┬───────┘
                                   │ 1
                                   │
                                   │ N
                            ┌──────▼──────────┐        ┌──────────────┐
                            │ family_members  │ N    1 │   persons    │
                            │─────────────────│───────▶│──────────────│
                            │ id         (PK) │        │ id      (PK) │
                            │ family_id   FK  │        │ full_name    │
                            │ person_id   FK  │        │ given_name   │
                            │ relationship    │        │ full_name_   │
                            │ from_date       │        │   ascii      │
                            │ to_date  (NULL  │        │ holy_name    │
                            │   = hiện hành)  │        │ gender       │
                            └─────────────────┘        │ birth_date   │
                                                       │ baptism_date │
              ┌──────────────┐                         │ first_commu- │
              │   settings   │                         │  nion_date   │
              │──────────────│                         │ confirmation_│
              │ key     (PK) │                         │  date        │
              │ value        │                         │ marriage_date│
              │ updated_at   │                         │ death_date   │
              └──────────────┘                         │ phone        │
                                                       └──────────────┘
```

**Tóm tắt quan hệ**

| Quan hệ                | Kiểu               | Ghi chú                                                                                   |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `zones` → `families`   | 1–N                | Mỗi hộ thuộc **đúng một** giáo họ (`zone_id` NOT NULL)                                    |
| `families` ↔ `persons` | N–N theo thời gian | Qua `family_members`. Mỗi người **đúng một** hộ hiện hành                                 |
| `zones` → `persons`    | _(suy ra)_         | `persons` → `family_members` (hiện hành) → `families.zone_id`. **Không có cột trực tiếp** |

### 4.8. Ma trận quyền xoá

| Xoá bản ghi                         | Hành vi               | Xử lý ở Service                                                                          |
| ----------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `zones` còn hộ                      | **Chặn** (`RESTRICT`) | Trả `FOREIGN_KEY_VIOLATION`. UI yêu cầu chuyển hộ sang giáo họ khác trước                |
| `families` còn thành viên hiện hành | **Chặn**              | Trả `CONFLICT` kèm số thành viên. UI yêu cầu chuyển người sang hộ khác trước             |
| `persons` đang thuộc một hộ         | Cho phép              | Xoá mềm người → xoá mềm dòng `family_members` hiện hành theo, **trong cùng transaction** |
| `family_members`                    | Cho phép              | Xoá mềm. Nếu là `head` → cảnh báo hộ đang không có chủ hộ                                |

### 4.9. Seed

Idempotent (`INSERT OR IGNORE`):

1. Toàn bộ `settings` với giá trị mặc định ở §4.6.
2. **Không seed dữ liệu nghiệp vụ mẫu.** Khác với domain Task Manager — dữ liệu giáo dân là
   dữ liệu thật, chèn bản ghi mẫu sẽ lẫn vào danh sách và người dùng phải đi xoá.
   Màn hình trống dùng `EmptyState` để hướng dẫn thay cho seed.

---

## 5. Danh mục kênh IPC — nội dung điền vào `project/ipc-channels.md`

`app:*` và `setting:*` là kênh hạ tầng, đã có sẵn ở `docs/01-architecture/ipc-communication.md` §5.

### 5.1. Nhóm `zone:*`

| Kênh           | Payload vào                                    | Trả về                                               |
| -------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `zone:list`    | `{ search?, page, pageSize, sortBy, sortDir }` | `Zone[]` (kèm `familyCount`, `personCount`) + `meta` |
| `zone:getById` | `{ id }`                                       | `Zone`                                               |
| `zone:create`  | `{ name, holyName?, note? }`                   | `Zone`                                               |
| `zone:update`  | `{ id, expectedUpdatedAt, patch }`             | `Zone`                                               |
| `zone:remove`  | `{ id }`                                       | `{ id }`                                             |

### 5.2. Nhóm `family:*`

| Kênh             | Payload vào                                             | Trả về                                              |
| ---------------- | ------------------------------------------------------- | --------------------------------------------------- |
| `family:list`    | `{ zoneId?, search?, page, pageSize, sortBy, sortDir }` | `Family[]` (kèm `memberCount`, `zoneName`) + `meta` |
| `family:getById` | `{ id }`                                                | `Family` kèm danh sách thành viên hiện hành         |
| `family:create`  | `{ zoneId, name, address?, note? }`                     | `Family`                                            |
| `family:update`  | `{ id, expectedUpdatedAt, patch }`                      | `Family`                                            |
| `family:remove`  | `{ id }`                                                | `{ id }`                                            |

### 5.3. Nhóm `person:*`

| Kênh             | Payload vào                                                                                            | Trả về                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `person:list`    | `{ zoneId?, familyId?, gender?, isAlive?, search?, page, pageSize, sortBy, sortDir }`                  | `Person[]` (kèm `familyName`, `zoneName`) + `meta` |
| `person:getById` | `{ id }`                                                                                               | `Person` kèm hộ hiện hành + lịch sử hộ             |
| `person:create`  | `{ fullName, givenName?, holyName?, gender?, birthDate?, <các ngày bí tích>, phone?, note?, family? }` | `Person`                                           |
| `person:update`  | `{ id, expectedUpdatedAt, patch }`                                                                     | `Person`                                           |
| `person:remove`  | `{ id }`                                                                                               | `{ id }`                                           |

> `person:create` nhận thêm `family?: { familyId, relationship, fromDate }` — tuỳ chọn, cho phép
> tạo người và gán vào hộ trong **một transaction**. Bỏ trống thì tạo người chưa thuộc hộ nào.

### 5.4. Nhóm `family-member:*`

| Kênh                   | Payload vào                                        | Trả về               | Ghi chú                                                                               |
| ---------------------- | -------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `family-member:add`    | `{ familyId, personId, relationship, fromDate }`   | `FamilyMember`       | Chặn nếu người đã có hộ hiện hành                                                     |
| `family-member:update` | `{ id, expectedUpdatedAt, patch }`                 | `FamilyMember`       | Đổi `relationship` hoặc `note`                                                        |
| `family-member:move`   | `{ personId, toFamilyId, relationship, moveDate }` | `{ closed, opened }` | **Nghiệp vụ riêng**: đóng dòng cũ (`to_date = moveDate`) + mở dòng mới, 1 transaction |
| `family-member:remove` | `{ id }`                                           | `{ id }`             | Xoá mềm                                                                               |

### 5.5. Nhóm sự kiện

| Kênh                   | Payload                     | Khi nào phát                                             |
| ---------------------- | --------------------------- | -------------------------------------------------------- |
| `event:zone-changed`   | `{ action, id }`            | Sau mọi thao tác ghi lên `zones`                         |
| `event:family-changed` | `{ action, id, zoneId? }`   | Sau mọi thao tác ghi lên `families`                      |
| `event:person-changed` | `{ action, id, familyId? }` | Sau mọi thao tác ghi lên `persons` hoặc `family_members` |

Giữ nguyên `event:import-progress`, `event:update-status`, `event:app-error`.

---

## 6. Bản đồ màn hình — nội dung điền vào `project/screen-map.md`

| Route           | Màn hình         | Mô tả                                                   | Ưu tiên |
| --------------- | ---------------- | ------------------------------------------------------- | ------- |
| `/`             | Tổng quan        | Tổng số giáo dân / hộ / giáo họ, phân bố theo giáo họ   | P0      |
| `/persons`      | Giáo dân         | Danh sách, lọc theo giáo họ / hộ / giới tính / còn sống | P0      |
| `/persons/:id`  | Hồ sơ giáo dân   | Thông tin + bí tích + hộ hiện hành + lịch sử hộ         | P0      |
| `/families`     | Gia đình         | Danh sách hộ, lọc theo giáo họ                          | P0      |
| `/families/:id` | Chi tiết hộ      | Thông tin hộ + danh sách thành viên                     | P0      |
| `/zones`        | Giáo họ          | Danh sách giáo họ kèm số hộ / số người                  | P1      |
| `/zones/:id`    | Chi tiết giáo họ | Danh sách hộ thuộc giáo họ                              | P1      |
| `/search?q=`    | Tìm kiếm         | Tìm không dấu trên người và hộ                          | P1      |
| `/trash`        | Thùng rác        | Bản ghi đã xoá mềm                                      | P2      |
| `/settings`     | Cài đặt          | Giao diện / Dữ liệu / Phím tắt / Giới thiệu             | P1      |

Mục điều hướng trên Sidebar: Tổng quan · Giáo dân · Gia đình · Giáo họ · ──── · Cài đặt.

Phím tắt chung đã có ở `docs/03-frontend/ui-structure.md` §7. Phần riêng của domain:
`Ctrl+N` đổi mô tả thành "Thêm giáo dân mới" và bỏ `Space` (không có khái niệm hoàn thành).

---

## 7. Bảng `history` của diagram — hoãn, không bỏ

Diagram có `history (ID, type, name, content, time)`. Đây là nhật ký thay đổi.

**Vấn đề của thiết kế trong diagram**: `type` + `name` không trỏ được về bản ghi cụ thể nào,
nên không trả lời được câu hỏi "hồ sơ ông A đã bị sửa những gì".

**Quyết định**: hoãn sang **Phase 6**, thiết kế lại thành:

```
activity_logs (id, entity_type, entity_id, action, changes, created_at)
```

`changes` là JSON `{ field: [cũ, mới] }`. Bảng **append-only**, xoá cứng theo
`data.trashRetentionDays`. Không có `updated_at`/`deleted_at`.

> Không nhầm với luật "log ra file, không bao giờ ghi nội dung người dùng nhập"
> (`CLAUDE.md`, `data-services.md` §8). Luật đó áp cho **log chẩn đoán ghi ra `.log`**.
> `activity_logs` là **dữ liệu nghiệp vụ** người dùng xem được trên UI — khác bản chất.

**Cần xác nhận trước Phase 6**: giáo xứ có thật sự cần xem lịch sử sửa đổi không?
Nếu không → bỏ hẳn, đừng làm.

---

## 8. Các bước thực hiện

Theo **Công thức 8** của `recipes.md`. Sau khi tách template, **chỉ điền vào `project/`** —
`docs/` là template dùng chung, **không đụng tới**.

| #   | File                          | Việc                                                                                                                 | Xong |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | :--: |
| 1   | `project/decisions.md`        | Đổi trạng thái Q01 §2 thành đã chốt kèm ngày. Kiểm tra P01–P06 §3 và ngoại lệ §4 đã khớp với §2 và §4.4 của file này |  ☑   |
| 2   | `project/database-schema.md`  | Điền §1 (ERD), §2 (bảng), §3 (ma trận xoá), §4 (seed), §5 (khoá `settings`), §6 (ngoại lệ) — lấy từ §4 của file này  |  ☑   |
| 3   | `project/ipc-channels.md`     | Điền §1 (nhóm kênh nghiệp vụ) và §3 (sự kiện) — lấy từ §5 của file này                                               |  ☑   |
| 4   | `project/screen-map.md`       | Điền §1 (bản đồ màn hình), §2 (sidebar), §3 (phím tắt riêng) — lấy từ §6 của file này                                |  ☑   |
| 5   | `project/invalidate-rules.md` | Điền bảng quy tắc — lấy từ §9 của file này                                                                           |  ☑   |
| 6   | `project/glossary.md`         | Điền §1 (thuật ngữ) và §2 (giá trị enum) — lấy từ §10 của file này                                                   |  ☑   |
| 7   | `project/roadmap.md`          | Điền §3 (rủi ro riêng) — lấy từ §11 của file này. Kiểm tra §2 (sai lệch) đã đủ                                       |  ☑   |
| 8   | `CLAUDE.md`                   | Xoá dòng "Domain nghiệp vụ thật" khỏi bảng "Quyết định còn bỏ ngỏ" ở cuối file                                       |  ☑   |
| 9   | `plan/README.md`              | Đổi trạng thái tiền đề thành ☑                                                                                       |  ☑   |

> **Không sửa file nào trong `docs/`.** Nếu phát hiện một luật template thật sự sai hoặc thiếu,
> đó là việc riêng — dừng, báo, sửa ở repo template rồi tăng `docs/TEMPLATE_VERSION`.

---

## 9. Bảng invalidate — nội dung điền vào `project/invalidate-rules.md`

| Hành động                            | Invalidate key                                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Tạo giáo dân                         | `personKeys.lists` + `familyKeys.lists` + `zoneKeys.lists` (đổi số đếm)                                                                         |
| Sửa giáo dân                         | `personKeys.lists` + `personKeys.detail(id)`                                                                                                    |
| Xoá giáo dân                         | `personKeys.lists` + `familyKeys.lists` + `zoneKeys.lists` + **`removeQueries`** `personKeys.detail(id)`                                        |
| Tạo/sửa/xoá hộ                       | `familyKeys.all` + `personKeys.lists` + `zoneKeys.lists`                                                                                        |
| Tạo/sửa/xoá giáo họ                  | `zoneKeys.all` + `familyKeys.lists`                                                                                                             |
| Thêm thành viên vào hộ               | `familyKeys.detail(familyId)` + `personKeys.detail(personId)` + `personKeys.lists` + `familyKeys.lists`                                         |
| **Chuyển hộ** (`family-member:move`) | `familyKeys.detail(hộ cũ)` + `familyKeys.detail(hộ mới)` + `personKeys.detail(id)` + `personKeys.lists` + `familyKeys.lists` + `zoneKeys.lists` |
| Đổi cài đặt                          | `settingKeys.all`                                                                                                                               |

> Chuyển hộ chạm nhiều key nhất. Nguyên tắc §3.2: **invalidate rộng còn hơn thiếu.**

---

## 10. Thuật ngữ — nội dung điền vào `project/glossary.md`

| Khái niệm            | Định danh code       | Hiển thị trên UI     | Không dùng                            |
| -------------------- | -------------------- | -------------------- | ------------------------------------- |
| Giáo dân             | `person`             | Giáo dân             | `member`, `user`, `people`, "Tín hữu" |
| Gia đình             | `family`             | Gia đình             | `household`, `home`, "Hộ khẩu"        |
| Giáo họ              | `zone`               | Giáo họ              | `area`, `group`, `parish`, "Khu"      |
| Thành viên hộ        | `familyMember`       | Thành viên           | `membership`, `personFamily`          |
| Chủ hộ               | `head`               | Chủ hộ               | `owner`, `leader`                     |
| Tên thánh            | `holyName`           | Tên thánh            | `saintName`, `christianName`          |
| Họ và tên            | `fullName`           | Họ và tên            | `name`, `firstName` + `lastName`      |
| Tên gọi              | `givenName`          | Tên gọi              | `shortName`, `nickName`               |
| Ngày sinh            | `birthDate`          | Ngày sinh            | `dob`, `dateOfBirth`                  |
| Ngày rửa tội         | `baptismDate`        | Ngày rửa tội         | `dateRT`                              |
| Ngày rước lễ lần đầu | `firstCommunionDate` | Ngày rước lễ lần đầu | `dateRL`                              |
| Ngày thêm sức        | `confirmationDate`   | Ngày thêm sức        | `dateTS`                              |
| Ngày hôn phối        | `marriageDate`       | Ngày hôn phối        | `dateHP`, `weddingDate`               |
| Ngày qua đời         | `deathDate`          | Ngày qua đời         | `dateDead`, `diedAt`                  |
| Tên giáo xứ          | `parishName`         | Tên giáo xứ          | `churchName`                          |

**Giá trị `relationship`**: xem bảng §4.5.
**Giá trị `gender`**: `male` → "Nam" · `female` → "Nữ".

---

## 11. Rủi ro đã nhận diện — ghi vào `project/roadmap.md` §3

| Rủi ro                                                                                        | Mức        | Phòng ngừa                                                                                                                             |
| --------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Nhập liệu ban đầu** vài nghìn giáo dân bằng tay lớn hơn toàn bộ Phase 4                     | **Cao**    | Hỏi giáo xứ có sẵn Excel không. Nếu có → kéo import CSV/Excel từ Phase 8 lên Phase 5                                                   |
| Dữ liệu nhạy cảm (tôn giáo, quan hệ gia đình, địa chỉ) trên máy dùng chung                    | Trung bình | Xem lại **Q04 (mã hoá DB)** sớm hơn Phase 7. Đây là **quyết định một chiều**. `security.md` §5 khuyến nghị BitLocker thay vì SQLCipher |
| Giả định "một người dùng" của `security.md` §6 có thể sai nếu cha xứ và thư ký dùng chung máy | Thấp       | Xác nhận với giáo xứ. Nếu cần phân quyền thật → phải sửa `security.md`, không tự thêm                                                  |
| Không in được chứng thư vì chọn bí tích phẳng                                                 | Trung bình | Đã biết trước và chấp nhận (§2). Nếu phát sinh yêu cầu → migration rebuild `persons` theo `storage-strategy.md` §5.6                   |

---

## 12. Kiểm chứng

Không có code để chạy. Đối chiếu bằng tay:

| #   | Kiểm tra                           | Cách làm                                                                                                                     |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`docs/` không bị đụng tới**      | `git status docs/` không có thay đổi nào. Template là dùng chung                                                             |
| 2   | Không còn ô trống trong `project/` | `grep -rn "chưa điền" project/` → không còn kết quả                                                                          |
| 3   | Q01 đã đóng đúng quy trình         | `project/decisions.md` §2 ghi Q01 là **Hiệu lực** kèm ngày; `CLAUDE.md` không còn dòng "Domain nghiệp vụ thật" ở bảng bỏ ngỏ |
| 4   | Mọi bảng qua checklist             | Đối chiếu `docs/02-backend-data/database-conventions.md` §4 cho từng bảng ở `project/database-schema.md`                     |
| 5   | Kênh ↔ invalidate khớp nhau        | Mỗi kênh **ghi** ở `project/ipc-channels.md` có đúng một dòng ở `project/invalidate-rules.md`                                |
| 6   | Route ↔ kênh khớp nhau             | Mỗi route ở `project/screen-map.md` gọi được ít nhất một kênh đã khai báo                                                    |
| 7   | Ánh xạ diagram đầy đủ              | Mọi ô trong `diagrams.jpg` có đúng một dòng ở §3 — kể cả những ô bị bỏ, phải ghi rõ lý do                                    |
| 8   | Ngoại lệ đã ghi nhận               | `project/decisions.md` §4 có đủ 3 sai lệch của `family_members`                                                              |
| 9   | Không lẫn domain mẫu               | `grep -rniE "\btask\|\blabel\b" project/` → không còn kết quả                                                                |

**Xong bước này mới sang [phase-0-bootstrap.md](./phase-0-bootstrap.md).**
