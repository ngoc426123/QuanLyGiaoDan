# Cấu trúc cơ sở dữ liệu

> **Luật gốc**: `docs/02-backend-data/database-conventions.md` — quy ước đặt tên, ánh xạ kiểu,
> hai loại thời gian, cột bắt buộc, soft delete, khoá ngoại, checklist thêm bảng.
> File này chỉ chứa **schema riêng của domain**.

> Mọi bảng ở đây phải qua được checklist §4 của file luật gốc trước khi coi là xong.

Domain: **Quản lý giáo dân giáo xứ**. Nguồn đặc tả gốc là `diagrams.jpg` ở gốc repo;
bảng ánh xạ diagram → schema nằm ở `plan/00-domain-lock-in.md` §3.

> **P22 (2026-09-25):** `persons` là danh mục người dùng chung. `person_type = 'parish'`
> là giáo dân trong xứ; `person_type = 'external'` là người ngoài xứ. Chỉ giáo dân trong xứ
> được tham gia `family_members` và các báo cáo mục vụ. Bí tích, hôn phối và quan hệ cha/mẹ
> đều dùng một khoá ngoại `person_id`.

---

## 1. Sơ đồ quan hệ (ERD)

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
                            │ relationship    │        │ holy_name    │
                            │ from_date       │        │ birth_date   │
                            │ to_date  (NULL  │        │ death_date   │
                            │   = hiện hành)  │        │ phone        │
                            └─────────────────┘        └──────┬───────┘
                                                               │ 1
              ┌──────────────┐                                │
              │   settings   │                                │ N
              │──────────────│                         ┌──────▼───────┐
              │ key     (PK) │                         │  sacraments  │
              │ value        │                         │──────────────│
              │ updated_at   │                         │ person_id FK │
              └──────────────┘                         │ type         │
                                                       │ date         │
                                                       │ minister     │
                                                       │ place        │
                                                       └──────────────┘
```

**Tóm tắt quan hệ**

| Quan hệ                  | Kiểu               | Ghi chú                                                                                   |
| ------------------------ | ------------------ | ----------------------------------------------------------------------------------------- |
| `zones` → `families`     | 1–N                | Mỗi hộ thuộc **đúng một** giáo họ (`zone_id` NOT NULL)                                    |
| `families` ↔ `persons`   | N–N theo thời gian | Qua `family_members`. Mỗi người **đúng một** hộ hiện hành                                 |
| `persons` → `sacraments` | 1–N                | Mỗi người có tối đa một bản ghi còn hiệu lực cho mỗi loại bí tích                         |
| `persons` ↔ `marriages`  | N–N theo cặp       | Qua `marriage_participants`; mỗi hôn phối có đúng hai đương sự                            |
| `zones` → `persons`      | _(suy ra)_         | `persons` → `family_members` (hiện hành) → `families.zone_id`. **Không có cột trực tiếp** |

> Không có bảng `person_zone` / `family_zone`. Diagram gốc có cả hai đường dẫn tới giáo họ
> → hai nguồn sự thật, mâu thuẫn được. Quyết định P02 ở [`decisions.md`](./decisions.md) §3.

---

## 2. Định nghĩa chi tiết từng bảng

Mọi bảng nghiệp vụ đều có `id` / `created_at` / `updated_at` / `deleted_at` theo
`database-conventions.md` §1.4 — **không lặp lại** trong từng bảng dưới.

### 2.1. `zones` — Giáo họ

| Cột          | Kiểu | Ràng buộc                     | Mô tả                                                                      |
| ------------ | ---- | ----------------------------- | -------------------------------------------------------------------------- |
| `name`       | TEXT | NOT NULL, CHECK(length 1–100) | Tên giáo họ                                                                |
| `name_ascii` | TEXT | NOT NULL                      | Service sinh từ `name`: bỏ dấu, lowercase. Dùng để **sắp xếp và tìm kiếm** |
| `holy_name`  | TEXT | NULL, CHECK(length ≤ 75)      | Bổn mạng giáo họ                                                           |
| `note`       | TEXT | NULL                          | Ghi chú                                                                    |

**Index**

| Tên                    | Cột                                      | Mục đích                      |
| ---------------------- | ---------------------------------------- | ----------------------------- |
| `idx_zones_deleted_at` | `deleted_at`                             | Lọc bản ghi còn sống          |
| `uq_zones_name`        | `name` UNIQUE `WHERE deleted_at IS NULL` | Không trùng tên giáo họ       |
| `idx_zones_name_ascii` | `name_ascii, deleted_at`                 | Sắp xếp và tìm kiếm không dấu |

> `name_ascii` **luôn** do Service sinh lại từ `name` mỗi lần ghi. Renderer không gửi cột này.
> Lý do phải có cột này: `docs/02-backend-data/database-conventions.md` §1.2c.

### 2.2. `families` — Gia đình / hộ

| Cột          | Kiểu | Ràng buộc                                     | Mô tả                                     |
| ------------ | ---- | --------------------------------------------- | ----------------------------------------- |
| `zone_id`    | TEXT | NOT NULL, FK → `zones(id)` ON DELETE RESTRICT | Giáo họ chứa hộ này                       |
| `name`       | TEXT | NOT NULL, CHECK(length 1–120)                 | Tên hộ, thường theo tên chủ hộ            |
| `name_ascii` | TEXT | NOT NULL                                      | Service sinh từ `name`: bỏ dấu, lowercase |
| `address`    | TEXT | NULL, CHECK(length ≤ 255)                     | Địa chỉ                                   |
| `note`       | TEXT | NULL                                          | Ghi chú                                   |

**Index**

| Tên                       | Cột                      | Mục đích                                 |
| ------------------------- | ------------------------ | ---------------------------------------- |
| `idx_families_zone_id`    | `zone_id, deleted_at`    | Lọc hộ theo giáo họ — truy vấn nóng nhất |
| `idx_families_deleted_at` | `deleted_at`             | Lọc bản ghi còn sống                     |
| `idx_families_name_ascii` | `name_ascii, deleted_at` | Sắp xếp và tìm kiếm không dấu            |

### 2.3. `persons` — Danh mục người

| Cột                | Kiểu | Ràng buộc                             | Mô tả                                                                       |
| ------------------ | ---- | ------------------------------------- | --------------------------------------------------------------------------- |
| `full_name`        | TEXT | NOT NULL, CHECK(length 1–120)         | Nguyên văn như trên giấy tờ                                                 |
| `given_name`       | TEXT | NULL, CHECK(length ≤ 50)              | Tên gọi, dùng để sắp xếp                                                    |
| `full_name_ascii`  | TEXT | NOT NULL                              | Service sinh: NFC → bỏ dấu → lowercase                                      |
| `given_name_ascii` | TEXT | NULL                                  | Service sinh từ `given_name`: NFC → bỏ dấu → lowercase. Dùng để **sắp xếp** |
| `holy_name`        | TEXT | NULL, CHECK(length ≤ 75)              | Tên thánh                                                                   |
| `gender`           | TEXT | NULL, CHECK IN (`'male'`, `'female'`) | Giới tính                                                                   |
| `birth_date`       | TEXT | NULL                                  | `YYYY-MM-DD`                                                                |
| `death_date`       | TEXT | NULL                                  | `NULL` = còn sống                                                           |
| `phone`            | TEXT | NULL, CHECK(length ≤ 20)              | Số điện thoại                                                               |
| `email`            | TEXT | NULL, CHECK(length ≤ 254)             | Email cá nhân                                                               |
| `occupation`       | TEXT | NULL, CHECK(length ≤ 120)             | Nghề nghiệp; có thể để trống                                                |
| `secondary_phone`  | TEXT | NULL, CHECK(length ≤ 20)              | Số liên hệ thay thế                                                         |
| `residence_status` | TEXT | NULL, CHECK enum                      | `permanent` / `temporary` / `moved_away`                                    |
| `pastoral_status`  | TEXT | NULL, CHECK enum                      | `ordinary` / `catechism` / `catechist` / `needs_visit`                      |
| `pastoral_note`    | TEXT | NULL                                  | Ghi chú mục vụ; không đưa vào FTS                                           |
| `source`           | TEXT | NULL, CHECK enum                      | `manual` / `csv_import` / `transferred` / `restored`                        |
| `note`             | TEXT | NULL                                  | Ghi chú                                                                     |
| `person_type`      | TEXT | NOT NULL, CHECK enum                  | `parish` (giáo dân trong xứ) hoặc `external` (người ngoài xứ)               |
| `parish_name`      | TEXT | NULL, CHECK(length ≤ 120)             | Giáo xứ của người ngoài xứ                                                  |
| `diocese_name`     | TEXT | NULL, CHECK(length ≤ 120)             | Giáo phận của người ngoài xứ                                                |
| `father_name`      | TEXT | NULL, CHECK(length ≤ 120)             | Tên cha tự khai, dùng khi hồ sơ ngoài xứ chưa có liên kết                   |
| `mother_name`      | TEXT | NULL, CHECK(length ≤ 120)             | Tên mẹ tự khai, dùng khi hồ sơ ngoài xứ chưa có liên kết                    |

**Index**

| Tên                            | Cột                                                                | Mục đích                             |
| ------------------------------ | ------------------------------------------------------------------ | ------------------------------------ |
| `idx_persons_full_name_ascii`  | `full_name_ascii, deleted_at`                                      | Tìm kiếm không dấu                   |
| `idx_persons_deleted_at`       | `deleted_at`                                                       | Lọc bản ghi còn sống                 |
| `idx_persons_given_name_ascii` | `given_name_ascii, deleted_at`                                     | Sắp xếp danh sách theo tên gọi       |
| `idx_persons_birth_date`       | `birth_date` `WHERE birth_date IS NOT NULL AND deleted_at IS NULL` | Danh sách sinh nhật                  |
| `idx_persons_death_date`       | `death_date` `WHERE death_date IS NOT NULL AND deleted_at IS NULL` | Lọc còn sống / đã qua đời            |
| `idx_persons_type_deleted_at`  | `person_type, deleted_at`                                          | Phân biệt giáo dân và người ngoài xứ |

**Ràng buộc nghiệp vụ** _(thực thi ở tầng Service)_

1. `full_name_ascii` và `given_name_ascii` **luôn** do Service sinh lại mỗi lần ghi. Renderer không gửi hai cột này.
2. `death_date` không được **trước** `birth_date`.
3. Các ngày trong `sacraments` không được **sau** `death_date` và không được **trước** `birth_date`.
4. Thứ tự tự nhiên Rửa tội ≤ Rước lễ lần đầu ≤ Thêm sức — **cảnh báo**,
   không chặn (sổ cũ hay thiếu dữ liệu).
5. Người `external` không được tham gia `family_members`, giáo họ hay các báo cáo giáo dân.

### 2.3a. `sacraments` — Bí tích

| Cột         | Kiểu | Ràng buộc                    | Mô tả                                                                                |
| ----------- | ---- | ---------------------------- | ------------------------------------------------------------------------------------ |
| `person_id` | TEXT | NOT NULL, FK → `persons(id)` | Người nhận bí tích (trong xứ hoặc ngoài xứ)                                          |
| `type`      | TEXT | NOT NULL, CHECK enum         | `baptism` / `first_communion` / `confirmation`; `marriage` cũ chỉ còn để tương thích |
| `date`      | TEXT | NOT NULL                     | Ngày cử hành, `YYYY-MM-DD`                                                           |
| `minister`  | TEXT | NULL, CHECK(length ≤ 120)    | Linh mục cử hành                                                                     |
| `place`     | TEXT | NULL, CHECK(length ≤ 255)    | Nơi cử hành                                                                          |

Mỗi người chỉ có một bản ghi còn hiệu lực cho mỗi loại bí tích. Người ngoài xứ chỉ được nhập
Rửa tội và Thêm sức. Migration 006 chuyển bốn cột ngày cũ sang bảng này; những cột cũ chỉ còn
để tương thích DB đã phát hành, không còn được đọc/ghi.

### 2.3b. `marriages` và `marriage_participants` — Hôn phối

`marriages` lưu một lần thông tin cử hành: `date`, `minister`, `place`. `marriage_participants`
chỉ liên kết đúng hai người qua `marriage_id` và `person_id`; cả giáo dân lẫn người ngoài xứ đều
tham chiếu `persons`. Thông tin hồ sơ hiện hành là nguồn dữ liệu khi lập chứng thư; mỗi lần cấp
chứng thư sẽ ghi `snapshot_json` bất biến trong `certificate_issuances`.

Các dòng `sacraments.type = 'marriage'` có trước migration 008 được giữ nguyên như lịch sử cũ vì
chúng không có thông tin người phối ngẫu để tự chuyển đổi chính xác.

### 2.3c. `person_parents` — Liên kết cha/mẹ

| Cột                | Kiểu | Ràng buộc                    | Mô tả                                    |
| ------------------ | ---- | ---------------------------- | ---------------------------------------- |
| `child_person_id`  | TEXT | NOT NULL, FK → `persons(id)` | Người con                                |
| `role`             | TEXT | NOT NULL, CHECK enum         | `father` hoặc `mother`                   |
| `parent_person_id` | TEXT | NOT NULL, FK → `persons(id)` | Hồ sơ cha hoặc mẹ, trong xứ hay ngoài xứ |

Unique partial index trên `(child_person_id, role)` bảo đảm mỗi người con tối đa một cha và một mẹ
còn hiệu lực. Một người có thể là cha/mẹ của không giới hạn số người con.
DB cấm tự liên kết; Service không kiểm tra giới tính và kiểm tra hồ sơ cha/mẹ còn hoạt động.

### 2.4. `family_members` — Thành viên hộ

| Cột            | Kiểu | Ràng buộc                                        | Mô tả                     |
| -------------- | ---- | ------------------------------------------------ | ------------------------- |
| `family_id`    | TEXT | NOT NULL, FK → `families(id)` ON DELETE RESTRICT | Hộ                        |
| `person_id`    | TEXT | NOT NULL, FK → `persons(id)` ON DELETE RESTRICT  | Người                     |
| `relationship` | TEXT | NOT NULL, CHECK IN danh sách §2.5                | Quan hệ với chủ hộ        |
| `from_date`    | TEXT | NOT NULL                                         | `YYYY-MM-DD`, ngày vào hộ |
| `to_date`      | TEXT | NULL                                             | `NULL` = đang ở hộ này    |
| `note`         | TEXT | NULL                                             | Ghi chú                   |

**Index**

| Tên                            | Cột                                                                                         | Mục đích                          |
| ------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------- |
| `idx_family_members_family_id` | `family_id, deleted_at`                                                                     | Lấy danh sách thành viên của hộ   |
| `idx_family_members_person_id` | `person_id, deleted_at`                                                                     | Lấy lịch sử hộ của một người      |
| `uq_family_members_current`    | `person_id` UNIQUE `WHERE to_date IS NULL AND deleted_at IS NULL`                           | **Mỗi người đúng 1 hộ hiện hành** |
| `uq_family_members_head`       | `family_id` UNIQUE `WHERE relationship = 'head' AND to_date IS NULL AND deleted_at IS NULL` | **Mỗi hộ đúng 1 chủ hộ**          |

**Ràng buộc nghiệp vụ** _(thực thi ở tầng Service)_

1. Hai index `uq_*` đưa ràng buộc nghiệp vụ xuống tầng DB. Service **vẫn phải kiểm tra trước**
   để trả `CONFLICT` kèm thông điệp tiếng Việt dễ hiểu — DB là lưới an toàn cuối, không phải lớp đầu.
2. `to_date` không được **trước** `from_date`.
3. Chuyển hộ = đóng dòng cũ (`to_date = moveDate`) + mở dòng mới, **trong cùng một transaction**.

### 2.5. Giá trị `relationship`

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

### 2.6. `activity_logs` — Lịch sử chỉnh sửa

| Cột           | Kiểu | Ràng buộc                                      | Mô tả                                                |
| ------------- | ---- | ---------------------------------------------- | ---------------------------------------------------- |
| `id`          | TEXT | PK                                             | UUID v4                                              |
| `entity_type` | TEXT | `zone` / `family` / `person` / `family_member` | Loại bản ghi thay đổi                                |
| `entity_id`   | TEXT | NOT NULL                                       | ID bản ghi nghiệp vụ                                 |
| `action`      | TEXT | `created` / `updated` / `removed` / `restored` | Thao tác đã thực hiện                                |
| `changes`     | TEXT | JSON                                           | Với cập nhật: `{ field: [giá trị cũ, giá trị mới] }` |
| `created_at`  | TEXT | NOT NULL                                       | ISO 8601 UTC                                         |

`activity_logs` là append-only: không có `updated_at` hoặc `deleted_at`. Nhật ký hết hạn được
xóa cứng cùng chu kỳ `data.trashRetentionDays`. Index `(entity_type, entity_id, created_at DESC)`
phục vụ màn hình lịch sử của hồ sơ.

---

## 2.7. Chỉ mục tìm toàn văn FTS5

`persons_fts` lập chỉ mục `full_name`, `holy_name`, `note`; `families_fts` lập chỉ mục `name`,
`address`, `note`. Cả hai là bảng FTS5 external-content, dùng `rowid` của bảng gốc và tokenizer
`unicode61 remove_diacritics 2`. Trigger insert, update và delete giữ chỉ mục đồng bộ với dữ liệu
gốc; bản ghi xoá mềm không xuất hiện trong kết quả tìm kiếm.

## 3. Ma trận quyền xoá

| Xoá bản ghi                         | Hành vi mặc định      | Xử lý ở Service                                                                          |
| ----------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `zones` còn hộ                      | **Chặn** (`RESTRICT`) | Trả `FOREIGN_KEY_VIOLATION`. UI yêu cầu chuyển hộ sang giáo họ khác trước                |
| `families` còn thành viên hiện hành | **Chặn**              | Trả `CONFLICT` kèm số thành viên. UI yêu cầu chuyển người sang hộ khác trước             |
| `persons` đang thuộc một hộ         | Cho phép              | Xoá mềm người → xoá mềm dòng `family_members` hiện hành theo, **trong cùng transaction** |
| `family_members`                    | Cho phép              | Xoá mềm. Nếu là `head` → cảnh báo hộ đang không có chủ hộ                                |

---

## 4. Dữ liệu khởi tạo (Seed)

Seed phải **idempotent** (`INSERT OR IGNORE`) — chạy lại nhiều lần không sinh dữ liệu trùng.

1. Toàn bộ `settings` với giá trị mặc định ở §5.
2. **Không seed dữ liệu nghiệp vụ mẫu.** Dữ liệu giáo dân là dữ liệu thật; chèn bản ghi mẫu
   sẽ lẫn vào danh sách và người dùng phải đi xoá. Màn hình trống dùng `EmptyState` để hướng dẫn
   thay cho seed.

---

## 5. Bảng `settings` — khoá của dự án này

Cấu trúc bảng `settings` là chuẩn template (`database-conventions.md` §2).
Bảng dưới chỉ liệt kê **các khoá riêng** của dự án.

| Key                        | Giá trị mặc định | Mô tả                                                      |
| -------------------------- | ---------------- | ---------------------------------------------------------- |
| `ui.theme`                 | `"system"`       | Giao diện sáng / tối / theo hệ thống                       |
| `ui.density`               | `"comfortable"`  | Mật độ hiển thị danh sách                                  |
| `ui.sidebarWidth`          | `260`            | Độ rộng sidebar (px)                                       |
| `general.language`         | `"vi"`           | Ngôn ngữ hiển thị                                          |
| `general.parishName`       | `""`             | **Riêng dự án** — tên giáo xứ, hiện trên tiêu đề và bản in |
| `general.dioceseName`      | `""`             | Giáo phận quản lý giáo xứ, dùng trên chứng thư             |
| `general.parishPriestName` | `""`             | Linh mục chánh xứ, dùng trên chứng thư                     |
| `general.startOfWeek`      | `1`              | Ngày đầu tuần (1 = Thứ Hai)                                |
| `data.autoBackup`          | `true`           | Tự động sao lưu                                            |
| `data.backupIntervalDays`  | `7`              | Chu kỳ sao lưu (ngày)                                      |
| `data.trashRetentionDays`  | `30`             | Số ngày giữ bản ghi trong thùng rác                        |
| `data.lastVacuumAt`        | `null`           | Mốc chạy `VACUUM` gần nhất, nội bộ để dọn DB mỗi 30 ngày   |

---

## 6. Ngoại lệ so với quy ước chung

> Bỏ qua một luật trong `database-conventions.md` vì trường hợp đặc biệt → **phải ghi ở đây**,
> không được im lặng (`docs/00-meta/agent-rules.md` §2).

| Sai lệch                                                                | Lý do                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Bảng nối đặt tên `family_members`, không phải `families_persons` (§1.1) | Đây là **thực thể** có thuộc tính và vòng đời riêng, không phải bảng nối thuần |
| Bảng nối có đủ 4 cột audit, không xoá cứng (§1.5)                       | Cần `updated_at` cho `expectedUpdatedAt`, cần `deleted_at` cho thùng rác       |
| Bảng nối dùng `id` riêng thay vì khoá chính kép (§1.1)                  | Một người có thể vào–ra cùng một hộ nhiều lần                                  |

> Ba ngoại lệ này cũng được ghi ở [`decisions.md`](./decisions.md) §4 (quyết định P05).

---

## 7. Hoãn — không bỏ

| Hạng mục                    | Trạng thái                  | Ghi chú                                                                                 |
| --------------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| `history` trong diagram gốc | **Đã triển khai ở Phase 6** | Thiết kế thành `activity_logs`, append-only và xóa cứng theo `data.trashRetentionDays`. |

---

## 8. Whitelist `sortBy` của các kênh `*:list` — đã chốt 2026-09-13

`ORDER BY` là ngoại lệ duy nhất không tham số hoá được, nên tên cột **bắt buộc** đối chiếu
whitelist cứng ở Repository (`coding-standards-backend.md` §3.1). Giá trị ngoài whitelist →
dùng mặc định, **không** ném lỗi ra người dùng.

Nguyên tắc chốt: **chỉ cho sắp xếp theo cột đã có index**, đúng luật "mọi cột dùng trong
`WHERE` / `ORDER BY` / `JOIN` phải có index" (`database-conventions.md` §4).

| Kênh          | `sortBy` cho phép (camelCase)                     | Cột SQL                                                           | Mặc định         | Index phục vụ                                                                                                            |
| ------------- | ------------------------------------------------- | ----------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `zone:list`   | `name`, `createdAt`                               | `name`, `created_at`                                              | `createdAt` DESC | `uq_zones_name`, `idx_zones_created_at_active`                                                                           |
| `family:list` | `name`, `createdAt`                               | `name`, `created_at`                                              | `createdAt` DESC | `idx_families_name`, `idx_families_created_at_active`                                                                    |
| `person:list` | `givenName`, `fullName`, `birthDate`, `createdAt` | `given_name_ascii`, `full_name_ascii`, `birth_date`, `created_at` | `createdAt` DESC | `idx_persons_given_name_ascii`, `idx_persons_full_name_ascii`, `idx_persons_birth_date`, `idx_persons_created_at_active` |

`sortDir` cũng đối chiếu whitelist (`ASC` / `DESC`); danh sách trên dùng mặc định theo từng endpoint.

**Ba hệ quả đã cân nhắc và chấp nhận:**

| Điều                              | Lý do                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Không cho sắp theo `updatedAt`    | Không có màn hình nào cần sắp theo thời điểm cập nhật; chỉ mở rộng bằng migration mới khi phát sinh nhu cầu |
| **Không** thêm index cho `gender` | Độ chọn lọc thấp (2 giá trị); SQLite sẽ bỏ qua index, quét theo `deleted_at` vẫn nhanh hơn                  |
| `givenName` cho phép NULL         | Sắp ASC thì NULL đứng trước — đúng mong muốn: người chưa điền tên gọi nổi lên đầu để dễ bổ sung             |

## 9. Chỉ mục Dashboard

Migration `010_add_dashboard_indexes.sql` thêm hai chỉ mục partial không đổi dữ liệu:

| Chỉ mục                   | Mục đích                                                                  |
| ------------------------- | ------------------------------------------------------------------------- |
| `idx_persons_birth_month` | Lọc giáo dân còn sống có sinh nhật trong tháng trên Dashboard.            |
| `idx_persons_phone`       | Nhóm các số điện thoại đã nhập để báo hiệu bản ghi cần kiểm tra thủ công. |

> Sắp xếp theo **tên gọi** chứ không theo họ là quyết định domain (P03 — hợp với tên tiếng Việt).
> Tìm kiếm không dấu dùng `full_name_ascii`, không dùng `full_name`.
