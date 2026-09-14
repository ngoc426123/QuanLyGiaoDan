# Công thức thay đổi (Recipes)

> **Mục đích**: Mỗi loại thay đổi có **một** cách làm duy nhất, đụng đúng những file đã liệt kê, theo đúng thứ tự.
> Đây là công cụ chống trôi dạt quan trọng nhất: làm entity thứ 5 giống hệt entity thứ 1.
>
> **Luật**: Nếu việc đang làm có công thức ở đây → làm theo, không tự nghĩ cách khác. Nếu công thức thiếu bước → bổ sung vào file này, đừng làm tắt.

---

## Công thức 1 — Thêm một thực thể mới (full stack)

Ví dụ minh hoạ dùng thực thể `Tag`. Thay `tag` / `Tag` bằng tên thực thể thật của domain.

**Thứ tự bắt buộc: Docs → Shared → Backend → Frontend → Test.**
Không làm ngược, vì Frontend phụ thuộc hợp đồng do Backend công bố.

| # | File | Việc |
|---|---|---|
| 1 | `project/database-schema.md` | Thêm định nghĩa bảng: cột, kiểu, ràng buộc, index. Cập nhật ERD |
| 2 | `project/ipc-channels.md` | Thêm bảng danh mục kênh `tag:*` |
| 3 | `backend/src/db/migrations/00X_add_tags.sql` | File mới, đánh số tiếp theo. **Không sửa file cũ** |
| 4 | `shared/channels.js` | Thêm nhóm hằng số `TAG: { LIST, CREATE, UPDATE, REMOVE }` |
| 5 | `backend/src/schemas/tag.schema.js` | Zod schema cho từng kênh, `strict`, thông điệp lỗi tiếng Việt |
| 6 | `backend/src/repositories/tag.repository.js` | Bộ phương thức chuẩn + hàm `toDomain(row)` |
| 7 | `backend/src/services/tag.service.js` | Nghiệp vụ, sinh `id`/timestamp, transaction, ném `AppError` |
| 8 | `backend/src/main/ipc/tag.ipc.js` | Handler 5 bước; đăng ký vào `ipc/index.js` |
| 9 | `backend/src/preload/index.js` | Expose `window.api.tag.*` — wrapper cố định tên kênh |
| 10 | `frontend/src/shared/queryKeys.js` | Thêm `tagKeys` theo mẫu phân cấp `all / lists / list(f) / detail(id)` |
| 11 | `frontend/src/features/tag/api/tag.api.js` | Wrapper mỏng, gọi qua `shared/invoke.js` |
| 12 | `frontend/src/features/tag/hooks/` | `useTags.js`, `useTag.js`, `useTagMutations.js` |
| 13 | `frontend/src/features/tag/components/` | Component hiển thị và form |
| 14 | `project/invalidate-rules.md` | Thêm dòng vào **bảng quy tắc invalidate** |
| 15 | Test | Repository (SQLite `:memory:`) + Service (mock repository) |

### Kiểm tra sau khi xong

- [ ] Kênh mới có trong `shared/channels.js`, không có magic string ở đâu
- [ ] Kênh `tag:update` có nhận `expectedUpdatedAt`
- [ ] Thao tác ghi có phát `event:tag-changed`
- [ ] Mutation ở Frontend invalidate đủ key (kể cả key của thực thể liên quan)
- [ ] Bảng mới có `id`, `created_at`, `updated_at`, `deleted_at`
- [ ] Mọi cột dùng trong `WHERE`/`ORDER BY`/`JOIN` đã có index
- [ ] Component không gọi `window.api` trực tiếp

---

## Công thức 2 — Thêm một kênh IPC vào thực thể đã có

| # | File | Việc |
|---|---|---|
| 1 | `project/ipc-channels.md` | Thêm dòng mô tả kênh: payload vào, dữ liệu trả về, ghi chú |
| 2 | `shared/channels.js` | Thêm hằng số |
| 3 | `backend/src/schemas/<domain>.schema.js` | Schema cho payload mới |
| 4 | `backend/src/services/<domain>.service.js` | Hàm nghiệp vụ |
| 5 | `backend/src/main/ipc/<domain>.ipc.js` | Handler |
| 6 | `backend/src/preload/index.js` | Expose hàm wrapper |
| 7 | `frontend/src/features/<domain>/api/` + `hooks/` | Wrapper + hook |
| 8 | `project/invalidate-rules.md` | Nếu là thao tác ghi: bổ sung quy tắc invalidate |
| 9 | Test Service | |

> Nếu là thao tác ghi mà quên bước 8, dữ liệu trên màn hình sẽ cũ mà không ai phát hiện ngay.

---

## Công thức 3 — Thêm một cột vào bảng đã có

| # | File | Việc |
|---|---|---|
| 1 | `project/database-schema.md` | Thêm cột vào bảng mô tả; nếu cần lọc/sắp xếp theo cột này thì thêm index |
| 2 | `backend/src/db/migrations/00X_add_<cột>.sql` | File **mới**. `ALTER TABLE ... ADD COLUMN` |
| 3 | `backend/src/repositories/<domain>.repository.js` | Cập nhật `toDomain()` (snake_case → camelCase) và các câu `INSERT`/`UPDATE` |
| 4 | `backend/src/schemas/<domain>.schema.js` | Cho phép trường mới trong payload (schema là `strict`, không thêm thì bị từ chối) |
| 5 | `backend/src/services/<domain>.service.js` | Giá trị mặc định, chuẩn hoá, quy tắc nghiệp vụ nếu có |
| 6 | `project/ipc-channels.md` | Cập nhật mô tả payload |
| 7 | `frontend/` — form + component hiển thị | |
| 8 | Nếu cột cho phép sắp xếp | Thêm vào `ALLOWED_SORT_COLUMNS` |

**Lưu ý về kiểu dữ liệu**: cột thời gian phải chọn đúng một trong hai — mốc thời gian (`_at`, ISO UTC) hay ngày trên lịch (`_date`, `YYYY-MM-DD`). Xem `docs/02-backend-data/database-conventions.md` §1.2b.

SQLite **không** hỗ trợ đổi kiểu cột hay xoá ràng buộc. Trường hợp đó phải dùng mẫu rebuild bảng ở `storage-strategy.md` §5.6.

---

## Công thức 4 — Thêm một màn hình mới

| # | File | Việc |
|---|---|---|
| 1 | `project/screen-map.md` | Thêm dòng vào **bản đồ màn hình**: route, mô tả, mức ưu tiên |
| 2 | `frontend/src/App.jsx` | Khai báo route (dùng `HashRouter`) |
| 3 | `frontend/src/pages/<Tên>Page.jsx` | Page **mỏng** (< 150 dòng), chỉ lắp ráp |
| 4 | `frontend/src/features/<domain>/components/` | Component thật của màn hình |
| 5 | `frontend/src/components/layout/AppSidebar.jsx` | Thêm mục điều hướng nếu cần |
| 6 | `project/screen-map.md` §3 | Thêm phím tắt nếu có |

### Bắt buộc trước khi coi là xong

- [ ] Xử lý đủ **5 trạng thái**: loading (skeleton sau 150ms) / empty / error + nút "Thử lại" / filtered-empty + nút "Xoá bộ lọc" / success
- [ ] Chạy đúng ở kích thước cửa sổ tối thiểu **940 × 600**
- [ ] Đúng ở cả theme sáng và tối
- [ ] Điều hướng được hoàn toàn bằng bàn phím, focus ring rõ ràng
- [ ] Không hardcode màu / khoảng cách / cỡ chữ
- [ ] Danh sách > 200 phần tử dùng virtual scroll

---

## Công thức 5 — Thêm một UI primitive (`components/ui/`)

| # | Việc |
|---|---|
| 1 | **Kiểm tra trước**: đã có component tương tự chưa? Mở rộng cái cũ bao giờ cũng tốt hơn tạo cái thứ hai |
| 2 | Tạo `frontend/src/components/ui/<Ten>.jsx` + `<Ten>.module.css` |
| 3 | Named export, chuyển tiếp `ref` và `...rest` |
| 4 | Mọi giá trị style qua `var(--token)`. Thiếu token → thêm token vào `tokens.css` **và** cập nhật `ui-structure.md` §5.1 |
| 5 | Hỗ trợ bàn phím + `aria-*`. Nút chỉ có icon phải có `aria-label` |
| 6 | **Không** import từ `features/`, `stores/`, `shared/`; **không** gọi `window.api` |
| 7 | Viết test với React Testing Library, tìm phần tử bằng `role`/`label` |

---

## Công thức 6 — Thêm một dependency

> **Bước 0: HỎI TRƯỚC.** Không tự thêm.

| # | Việc |
|---|---|
| 1 | Nêu rõ: gói nào, giải quyết vấn đề gì, vì sao không tự viết được |
| 2 | Xác định thuộc package nào — `frontend/` hay `backend/` |
| 3 | Nếu là `backend/`: gói này chạy **toàn quyền hệ thống**. Ngưỡng chấp nhận khắt khe hơn hẳn |
| 4 | Phân loại đúng: native module → `dependencies`; JS thuần → `devDependencies` (bundler nhét vào output) |
| 5 | Kiểm tra gói có script `postinstall` không |
| 6 | Cài, commit `package-lock.json` |
| 7 | Nếu là native module → xác định loại theo [project-structure.md §6.1](../01-architecture/project-structure.md): có `prebuilds/` thì không cần làm gì, không có thì chạy `electron-builder install-app-deps`. Cả hai trường hợp đều phải **build thử bản đóng gói** |
| 8 | Ghi vào `project/decisions.md` §3 |

---

## Công thức 7 — Sửa một lỗi

| # | Việc |
|---|---|
| 1 | Tái hiện lỗi trước khi sửa. Không sửa thứ chưa nhìn thấy |
| 2 | Xác định lỗi thuộc tầng nào (Renderer / IPC / Service / Repository / DB) |
| 3 | Viết test tái hiện lỗi **trước** khi sửa, nếu phạm vi có test |
| 4 | Sửa đúng nguyên nhân gốc, **không** vá triệu chứng ở tầng trên |
| 5 | Không nhân tiện refactor thứ khác |
| 6 | Nếu lỗi do docs quy định sai → sửa cả docs |
| 7 | Nếu lỗi thuộc loại có thể tái diễn → thêm luật vào file docs tương ứng |

---

## Công thức 8 — Chốt một "Quyết định còn bỏ ngỏ"

| # | Việc |
|---|---|
| 1 | Ghi quyết định + lý do + ngày vào `project/decisions.md` |
| 2 | Xoá mục đó khỏi bảng "Quyết định còn bỏ ngỏ" trong `CLAUDE.md` |
| 3 | Thêm vào bảng "Stack đã chốt" của `CLAUDE.md` nếu là lựa chọn công nghệ |
| 4 | Nếu là sai lệch khỏi baseline → ghi vào `project/decisions.md` §1 |
| 5 | Rà các file trong `project/` đang viết theo giả định cũ và sửa. **Không sửa `docs/`** trừ khi đó là luật template thật sự sai |

---

## Tài liệu liên quan

- [Quy tắc làm việc cho AI Agent](../00-meta/agent-rules.md)
- [Quyết định nền của template](../00-meta/decisions-baseline.md)
- [Quy ước đặt tên](../00-meta/naming-conventions.md)
