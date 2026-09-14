# Danh mục kênh IPC

> **Luật gốc**: `docs/01-architecture/ipc-communication.md` — quy ước đặt tên, envelope,
> `expectedUpdatedAt`, mã lỗi, luật viết Preload và Handler.
> File này chỉ chứa **danh mục kênh riêng của domain**.

> Mọi tên kênh ở đây phải có hằng số tương ứng trong `shared/channels.js`.
> **Cấm magic string** ở bất kỳ đâu khác.

---

## 1. Nhóm kênh nghiệp vụ

*(chưa điền)*

### Mẫu một nhóm

| Kênh | Payload vào | Dữ liệu trả về | Ghi chú |
|---|---|---|---|
| `<domain>:list` | `{ ...bộ lọc, page, pageSize, sortBy, sortDir }` | `Entity[]` + `meta` | Lọc và phân trang ở tầng SQL |
| `<domain>:getById` | `{ id }` | `Entity` kèm quan hệ | `NOT_FOUND` nếu không tồn tại |
| `<domain>:create` | `{ ...trường }` | `Entity` vừa tạo | Phát `event:<domain>-changed` |
| `<domain>:update` | `{ id, expectedUpdatedAt, patch }` | `Entity` sau cập nhật | **Bắt buộc** `expectedUpdatedAt` |
| `<domain>:remove` | `{ id }` | `{ id }` | Xoá mềm. Phát event |

---

## 2. Nhóm kênh hạ tầng — giống nhau ở mọi dự án

`app:*` và `setting:*` đã đặc tả sẵn ở `docs/01-architecture/ipc-communication.md` §5.
Không chép lại ở đây.

---

## 3. Nhóm sự kiện (Main → Renderer)

| Kênh | Payload | Khi nào phát |
|---|---|---|
| *(chưa điền)* | | |

---

> **Chưa điền.** Điền ở **Bước 3** của `docs/bootstrap/INIT.md`.
> Ví dụ mẫu đã điền đầy đủ: `docs/examples/sample-domain.md`.
