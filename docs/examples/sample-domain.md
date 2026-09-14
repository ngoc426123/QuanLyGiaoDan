# Ví dụ mẫu — một domain đã điền đầy đủ

> **Đây là ví dụ, không phải luật.** File này cho thấy **hình dạng** của các file trong `project/`
> khi đã điền xong, để dự án mới có mẫu đối chiếu.
>
> Domain minh hoạ: **Quản lý công việc (Task Manager)** — chọn vì ai cũng hiểu ngay,
> và nó chạm đủ các tình huống khó: quan hệ 1–N, N–N, tự tham chiếu, bảng nối, enum, FTS.
>
> **Không copy file này vào `project/`.** Viết mới theo domain thật của dự án.

---

## 1. Thuật ngữ nghiệp vụ → mẫu cho `project/glossary.md`

| Khái niệm | Định danh code | Hiển thị trên UI | **Không dùng** |
|---|---|---|---|
| Đơn vị công việc | `task` | Công việc | `job`, `todo`, `item`, "Nhiệm vụ", "Tác vụ" |
| Nhóm công việc | `project` | Dự án | `group`, `folder`, "Nhóm" |
| Nhãn phân loại | `label` | Nhãn | `tag`, `category`, "Thẻ" |
| Công việc con | `subtask` | Công việc con | `childTask`, "Việc nhỏ" |
| Phiên bấm giờ | `timeLog` | Phiên làm việc | `session`, `timer`, "Bấm giờ" |
| Tệp đính kèm | `attachment` | Tệp đính kèm | `file`, `upload`, "File" |
| Hạn chót | `dueDate` | Hạn chót | `deadline`, `endDate`, "Ngày hết hạn" |
| Mức ưu tiên | `priority` | Mức ưu tiên | `importance`, `level` |
| Đã lưu trữ | `isArchived` | Đã lưu trữ | `hidden`, `closed`, "Đã ẩn" |
| Thùng rác | `trash` | Thùng rác | `deleted`, `bin`, "Đã xoá" |

**Giá trị enum** — mỗi cột có `CHECK IN (...)` phải có một bảng như dưới:

| `status` | Hiển thị | | `priority` | Hiển thị |
|---|---|---|---|---|
| `todo` | Chưa làm | | `0` | Không đặt |
| `in_progress` | Đang làm | | `1` | Thấp |
| `done` | Hoàn thành | | `2` | Vừa |
| `cancelled` | Đã huỷ | | `3` | Cao |

---

## 2. ERD → mẫu cho `project/database-schema.md` §1

```
┌──────────────┐            ┌──────────────┐
│  projects    │ 1        N │    tasks     │
│──────────────│───────────▶│──────────────│
│ id      (PK) │            │ id      (PK) │
│ name         │            │ project_id FK│
│ color        │            │ parent_id FK │──┐ tự tham chiếu
│ is_archived  │            │ title        │◀─┘ (subtask)
│ sort_order   │            │ status       │
└──────────────┘            │ priority     │
                            │ due_date     │
                            │ sort_order   │
                            └──────┬───────┘
                                   │ 1
                     ┌─────────────┼─────────────┐
                     │ N           │ N           │ N
             ┌───────▼──────┐ ┌────▼─────────┐ ┌─▼────────────┐
             │ task_labels  │ │  time_logs   │ │ attachments  │
             │──────────────│ │──────────────│ │──────────────│
             │ task_id  FK  │ │ task_id  FK  │ │ task_id  FK  │
             │ label_id FK  │ │ started_at   │ │ file_path    │
             │ (PK kép)     │ │ ended_at     │ │ mime_type    │
             └───────┬──────┘ │ duration_sec │ │ size_bytes   │
                     │ N      └──────────────┘ └──────────────┘
                     │
             ┌───────▼──────┐
             │    labels    │
             │──────────────│
             │ id      (PK) │
             │ name  UNIQUE │
             │ color        │
             └──────────────┘
```

| Quan hệ | Kiểu | Ghi chú |
|---|---|---|
| `projects` → `tasks` | 1–N | Task **có thể** không thuộc project nào (`project_id` NULL = Inbox) |
| `tasks` → `tasks` | 1–N tự tham chiếu | Subtask, giới hạn **tối đa 1 cấp** để tránh cây vô hạn |
| `tasks` ↔ `labels` | N–N | Qua bảng nối `task_labels` |
| `tasks` → `time_logs` | 1–N | |
| `tasks` → `attachments` | 1–N | |

---

## 3. Định nghĩa bảng → mẫu cho `project/database-schema.md` §2

Mọi bảng nghiệp vụ đều có `id` / `created_at` / `updated_at` / `deleted_at` —
**không lặp lại** trong từng bảng.

### `tasks`

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| `project_id` | TEXT | NULL, FK → `projects(id)` ON DELETE RESTRICT | `NULL` = thuộc Inbox |
| `parent_id` | TEXT | NULL, FK → `tasks(id)` ON DELETE CASCADE | Task cha (subtask) |
| `title` | TEXT | NOT NULL, CHECK(length 1–500) | |
| `description` | TEXT | NULL | Markdown |
| `status` | TEXT | NOT NULL, DEFAULT `'todo'`, CHECK IN (4 giá trị §1) | |
| `priority` | INTEGER | NOT NULL, DEFAULT 0, CHECK BETWEEN 0 AND 3 | |
| `due_date` | TEXT | NULL | `YYYY-MM-DD` — ngày trên lịch, **không** phải mốc UTC |
| `completed_at` | TEXT | NULL | Mốc thời gian, ISO UTC |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | Thứ tự kéo-thả |
| `metadata` | TEXT | NULL | JSON tự do, **không** dùng để lọc |

**Index**

| Tên | Cột | Mục đích |
|---|---|---|
| `idx_tasks_project_id` | `project_id, deleted_at` | Truy vấn nóng nhất |
| `idx_tasks_status` | `status, deleted_at` | |
| `idx_tasks_due_date` | `due_date` `WHERE due_date IS NOT NULL AND deleted_at IS NULL` | Màn hình "Hôm nay" |
| `idx_tasks_parent_id` | `parent_id` | Lấy subtask |
| `idx_tasks_sort` | `project_id, sort_order` | |

**Ràng buộc nghiệp vụ** *(tầng Service)*

1. `parent_id` không trỏ tới chính nó, **không vượt quá 1 cấp**.
2. `status` sang `'done'` → tự gán `completed_at`; rời `'done'` → `completed_at = NULL`.
3. Task cha chỉ `'done'` được khi **mọi** subtask đã `'done'` hoặc `'cancelled'`.
4. Xoá mềm task cha → xoá mềm toàn bộ subtask theo.

### `task_labels` — bảng nối N–N thuần

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `task_id` | TEXT | NOT NULL, FK → `tasks(id)` ON DELETE CASCADE |
| `label_id` | TEXT | NOT NULL, FK → `labels(id)` ON DELETE CASCADE |
| `created_at` | TEXT | NOT NULL |

**Khoá chính kép** `(task_id, label_id)` — tự động ngăn gán trùng.
Bảng này **xoá cứng**, không có `deleted_at` — đây là ngoại lệ hợp lệ của `database-conventions.md` §1.5.

---

## 4. Ma trận quyền xoá → mẫu cho `project/database-schema.md` §3

| Xoá bản ghi | Hành vi mặc định | Xử lý ở Service |
|---|---|---|
| `projects` còn task | **Chặn** (`RESTRICT`) | Hỏi người dùng: xoá kèm (`cascade`) hay chuyển về Inbox (`detach`) |
| `tasks` có subtask | Cho phép | Xoá mềm toàn bộ subtask theo |
| `tasks` có time_logs | Cho phép | `CASCADE` khi xoá cứng |
| `labels` đang gán | Cho phép | `CASCADE` trên `task_labels`, task không bị ảnh hưởng |

---

## 5. Seed → mẫu cho `project/database-schema.md` §4

1. Toàn bộ bản ghi `settings` với giá trị mặc định.
2. Một project mẫu tên "Bắt đầu" kèm 3 task hướng dẫn sử dụng.
3. Ba label cơ bản: "Gấp", "Cá nhân", "Công việc".

Seed phải **idempotent** (`INSERT OR IGNORE`).

> Lưu ý: seed dữ liệu nghiệp vụ mẫu chỉ hợp lý khi dữ liệu **không phải dữ liệu thật**.
> Với domain lưu hồ sơ người thật, bản ghi mẫu sẽ lẫn vào danh sách và người dùng phải đi xoá —
> khi đó dùng `EmptyState` hướng dẫn thay cho seed.

---

## 6. Danh mục kênh IPC → mẫu cho `project/ipc-channels.md`

### Nhóm `task:*`

| Kênh | Payload vào | Dữ liệu trả về | Ghi chú |
|---|---|---|---|
| `task:list` | `{ projectId?, status?, search?, page, pageSize, sortBy, sortDir }` | `Task[]` + `meta` | Lọc và phân trang ở tầng SQL, **không** lọc ở Renderer |
| `task:getById` | `{ id }` | `Task` kèm quan hệ (labels, project) | `NOT_FOUND` nếu không tồn tại |
| `task:create` | `{ title, description?, projectId?, dueDate?, priority?, labelIds? }` | `Task` vừa tạo | Phát `event:task-changed` |
| `task:update` | `{ id, expectedUpdatedAt, patch }` | `Task` sau cập nhật | Partial update. **Bắt buộc** `expectedUpdatedAt` |
| `task:remove` | `{ id }` | `{ id }` | Xoá mềm. Phát event |
| `task:reorder` | `{ orderedIds: string[] }` | `{ updated: number }` | Chạy trong 1 transaction |
| `task:toggleComplete` | `{ id }` | `Task` | **Nghiệp vụ riêng**, không dùng `update` chung |

> `task:toggleComplete` minh hoạ một luật quan trọng: thao tác có **nghiệp vụ riêng** thì tách
> thành kênh riêng, đừng nhồi vào `update` rồi phân nhánh bằng `if` trong Service.

### Nhóm `project:*`

| Kênh | Payload vào | Dữ liệu trả về |
|---|---|---|
| `project:list` | `{ includeArchived? }` | `Project[]` (kèm `taskCount`) |
| `project:create` | `{ name, color?, description? }` | `Project` |
| `project:update` | `{ id, expectedUpdatedAt, patch }` | `Project` |
| `project:archive` | `{ id }` | `Project` |
| `project:remove` | `{ id, strategy: 'cascade' \| 'detach' }` | `{ id, affectedTasks }` |

> `project:remove` minh hoạ cách xử lý khoá ngoại `RESTRICT`: đưa **chiến lược** thành tham số
> thay vì để Service đoán ý người dùng.

### Nhóm sự kiện

| Kênh | Payload | Khi nào phát |
|---|---|---|
| `event:task-changed` | `{ action: 'created' \| 'updated' \| 'removed', id, projectId? }` | Sau mọi thao tác ghi lên task |
| `event:project-changed` | `{ action, id }` | Sau mọi thao tác ghi lên project |

---

## 7. Bản đồ màn hình → mẫu cho `project/screen-map.md`

| Route | Màn hình | Mô tả | Ưu tiên |
|---|---|---|---|
| `/` | Hôm nay | Task đến hạn hôm nay và quá hạn | P0 |
| `/upcoming` | Sắp tới | Task 7 ngày tới, nhóm theo ngày | P1 |
| `/inbox` | Inbox | Task chưa gán dự án | P0 |
| `/projects/:id` | Chi tiết dự án | Danh sách task, chuyển được List / Board | P0 |
| `/labels/:id` | Theo nhãn | Task mang nhãn được chọn | P2 |
| `/search?q=` | Kết quả tìm kiếm | Tìm toàn văn, làm nổi từ khoá | P1 |
| `/trash` | Thùng rác | Bản ghi đã xoá mềm | P2 |
| `/settings` | Cài đặt | Giao diện / Dữ liệu / Phím tắt / Giới thiệu | P1 |

**Phím tắt riêng của domain** *(ngoài bộ chung ở `ui-structure.md` §7)*

| Phím | Hành động | Phạm vi |
|---|---|---|
| `Ctrl/Cmd + N` | Tạo task mới | Toàn cục |
| `Space` | Đánh dấu hoàn thành | Khi danh sách có focus |

---

## 8. Quy tắc invalidate → mẫu cho `project/invalidate-rules.md`

| Hành động | Invalidate những key nào |
|---|---|
| Tạo task | `taskKeys.lists` + `projectKeys.lists` (vì `taskCount` đổi) |
| Sửa task | `taskKeys.lists` + `taskKeys.detail(id)` |
| Đổi dự án của task | `taskKeys.lists` + `taskKeys.detail(id)` + `projectKeys.lists` |
| Xoá task | `taskKeys.lists` + `projectKeys.lists` + **`removeQueries`** `taskKeys.detail(id)` |
| Sắp xếp lại | `taskKeys.lists` |
| Tạo/sửa/xoá project | `projectKeys.all` + `taskKeys.lists` |
| Gán/gỡ nhãn | `taskKeys.detail(id)` + `labelKeys.lists` |
| Đổi cài đặt | `settingKeys.all` |

> Điểm dễ sai nhất: **thao tác trên con làm đổi số đếm ở cha.** Tạo một task thì `taskCount`
> của project đổi theo — quên invalidate `projectKeys.lists` là sidebar hiện số cũ.
>
> Dùng `removeQueries` (không phải `invalidateQueries`) cho key chi tiết của bản ghi đã xoá,
> để tránh tự động fetch lại một bản ghi không còn tồn tại.

---

## 9. Cách dùng file này

Khi khởi tạo dự án mới:

| # | Việc |
|---|---|
| 1 | Đọc file này một lượt để nắm **hình dạng** cần đạt tới |
| 2 | Mở từng file trong `project/`, điền theo domain thật |
| 3 | Đối chiếu checklist §6 của `database-conventions.md` cho mỗi bảng |
| 4 | Kiểm tra chéo: mỗi kênh ghi ở `ipc-channels.md` có đúng một dòng ở `invalidate-rules.md` |
| 5 | Kiểm tra chéo: mỗi route ở `screen-map.md` gọi được ít nhất một kênh đã khai báo |

**Không copy nội dung file này sang `project/`.** Nó là ví dụ minh hoạ, không phải điểm khởi đầu.
