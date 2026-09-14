# Đặc tả nghiệp vụ — <Tên dự án>

> Thư mục này chứa **mọi thứ riêng của dự án này**. `docs/` là template dùng chung, không chứa nghiệp vụ.

---

## Luật ranh giới — một dòng

**Sửa file trong `docs/` = sửa template, phải mang sang mọi dự án khác.
Nếu điều đó chỉ đúng với dự án này → nó thuộc `project/`.**

Khi phân vân một luật nên nằm đâu, hỏi: *"Dự án Electron+SQLite tiếp theo có cần luật này không?"*
Có → `docs/`. Không → `project/`.

---

## Ba tầng tài liệu

| Tầng | Ở đâu | Nội dung | Khi sang dự án mới |
|---|---|---|---|
| 1. Template | `docs/` | Luật kiến trúc, IPC, bảo mật, SQL, Git — đúng với mọi dự án Electron + SQLite cục bộ | **Copy nguyên xi** |
| 2. Quyết định dự án | `project/decisions.md` | Cùng stack nhưng mỗi dự án chọn khác: TypeScript? i18n? mã hoá DB? | Trả lời lại từ đầu |
| 3. Nghiệp vụ | `project/` (còn lại) | Schema, kênh IPC, màn hình, thuật ngữ | Viết mới hoàn toàn |

`CLAUDE.md` ở gốc repo trộn cả 3 tầng — bắt buộc, vì Claude tự nạp file đó và nó phải nằm ở gốc.
Sinh nó từ `docs/CLAUDE.template.md`.

---

## Mục lục

| File | Nội dung | Nguồn luật |
|---|---|---|
| [decisions.md](./decisions.md) | Quyết định riêng của dự án + 5 câu hỏi khởi đầu | `docs/00-meta/decisions-baseline.md` |
| [glossary.md](./glossary.md) | Thuật ngữ nghiệp vụ: định danh code ↔ chuỗi hiển thị | `docs/00-meta/naming-conventions.md` |
| [database-schema.md](./database-schema.md) | ERD, định nghĩa bảng, index, ma trận quyền xoá, seed | `docs/02-backend-data/database-conventions.md` |
| [ipc-channels.md](./ipc-channels.md) | Danh mục kênh IPC đầy đủ | `docs/01-architecture/ipc-communication.md` |
| [screen-map.md](./screen-map.md) | Bản đồ màn hình + phím tắt riêng của domain | `docs/03-frontend/ui-structure.md` |
| [invalidate-rules.md](./invalidate-rules.md) | Bảng quy tắc invalidate cache | `docs/03-frontend/state-management.md` |
| [roadmap.md](./roadmap.md) | Danh sách việc theo từng phase | `docs/04-guidelines/phase-framework.md` |

---

## Trạng thái

| Hạng mục | Trạng thái |
|---|---|
| Domain nghiệp vụ | **Chưa chốt** |
| Mã nguồn | Chưa bắt đầu |

> Các file trong thư mục này **mới có khung mục, chưa có nội dung**.
> Điền ở **Bước 3** của `docs/bootstrap/INIT.md`.
>
> Cần một ví dụ đã điền đầy đủ để tham khảo hình dạng? Xem `docs/examples/sample-domain.md`.
