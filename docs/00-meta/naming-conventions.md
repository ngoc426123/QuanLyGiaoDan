# Quy ước đặt tên và ngôn ngữ

> **Luật**: Một khái niệm — một tên. Trước khi đặt tên mới cho bất cứ thứ gì, tra ở đây.
>
> File này là **template**, không chứa thuật ngữ nghiệp vụ.
> Từ vựng nghiệp vụ của dự án nằm ở `project/glossary.md`.

---
## 1. Quy ước ngôn ngữ

| Chỗ nào | Ngôn ngữ | Ví dụ |
|---|---|---|
| Tên biến, hàm, class, file, bảng, cột | **Tiếng Anh** | `createInvoice`, `due_date`, `InvoiceListItem.jsx` |
| Chuỗi hiển thị trên giao diện | **Tiếng Việt** | "Tạo mới", "Không có dữ liệu" |
| Thông điệp lỗi gửi từ Backend (`error.message`) | **Tiếng Việt** | "Tiêu đề không được để trống" |
| Comment giải thích nghiệp vụ | **Tiếng Việt** | |
| Mã lỗi (`error.code`), tên kênh IPC | **Tiếng Anh, UPPER_SNAKE / kebab** | `VALIDATION_ERROR`, `invoice:create` |
| Tài liệu trong `docs/` | **Tiếng Việt** | |

**Không trộn nửa Việt nửa Anh trong cùng một câu hoặc cùng một định danh.**
Sai: `donHangDaXuLy`, `createDonHang`, "Đã `completed` 5 mục".

---
## 2. Thuật ngữ kỹ thuật — dùng thống nhất trong docs và comment

| Thuật ngữ | Nghĩa thống nhất trong toàn bộ tài liệu |
|---|---|
| **Main** | Main Process của Electron (`backend/src/main/`) |
| **Renderer** | Tiến trình giao diện (`frontend/`) |
| **Preload** | Script cầu nối, expose `window.api` |
| **Envelope** | Hình dạng phản hồi IPC: `{ ok, data }` hoặc `{ ok, error }` |
| **Kênh** (channel) | Một endpoint IPC, ví dụ `invoice:create` |
| **Domain** (nghĩa lớn) | Lĩnh vực nghiệp vụ của cả ứng dụng |
| **Domain** (nghĩa nhỏ) | Một nhóm thực thể và toàn bộ tầng phục vụ nó — dùng trong tên kênh và thư mục `features/` |
| **Entity / Thực thể** | Một bảng dữ liệu kèm toàn bộ tầng phục vụ nó |
| **Server state** | Dữ liệu có nguồn gốc từ SQLite, do TanStack Query quản lý |
| **UI state** | Trạng thái giao diện thuần, do Zustand hoặc `useState` quản lý |
| **Soft delete** | Xoá mềm — gán `deleted_at`, không xoá dòng |
| **Mốc thời gian** (instant) | Điểm trên trục thời gian, cột `_at`, ISO UTC |
| **Ngày trên lịch** (date-only) | Một ngày trong lịch, cột `_date`, `YYYY-MM-DD` |

---

## 3. Quy ước viết chuỗi hiển thị tiếng Việt

| Loại | Quy tắc | Ví dụ đúng | Ví dụ sai |
|---|---|---|---|
| Nhãn nút | Động từ, viết hoa chữ đầu | "Lưu", "Tạo mới", "Xoá" | "LƯU", "save", "Lưu lại ngay" |
| Tiêu đề màn hình | Danh từ, viết hoa chữ đầu | "Tổng quan", "Cài đặt" | "HÔM NAY" |
| Thông báo lỗi | Câu hoàn chỉnh, nêu rõ vấn đề, không đổ lỗi người dùng | "Tiêu đề không được để trống" | "Lỗi!", "Bạn nhập sai rồi" |
| Trạng thái rỗng | Giải thích + gợi ý hành động | "Chưa có mục nào. Tạo mục đầu tiên?" | "Không có dữ liệu" |
| Xác nhận xoá | Nêu rõ hậu quả | "Xoá 3 mục? Có thể khôi phục từ Thùng rác." | "Bạn có chắc không?" |
| Đang xử lý | Động từ + "…" | "Đang lưu…" | "Loading...", "Vui lòng đợi!!!" |

**Quy tắc chung:**

- Không dùng dấu chấm than trừ khi thực sự cần.
- Không viết hoa toàn bộ chữ (dùng CSS `text-transform` nếu cần hiệu ứng).
- Xưng hô trung tính, không dùng "bạn" trong nhãn nút và tiêu đề.
- Số nhiều tiếng Việt không đổi dạng từ: "3 mục", không phải "3 mụcs".

---

## 4. Tên viết tắt được phép

Chỉ những từ đã phổ biến toàn ngành:

`id` `url` `db` `api` `ui` `ipc` `fs` `sql` `css` `html` `json` `uuid` `dto` `ms` (mili-giây)

Ngoài danh sách này thì viết đầy đủ. Không tự chế viết tắt: `usr`, `cfg`, `tmp2`, `mgr`.

---

## Tài liệu liên quan

- [Quy tắc làm việc cho AI Agent](./agent-rules.md)
- [Quy chuẩn code — Phần chung](../04-guidelines/coding-standards.md) §3
- [Quy ước cơ sở dữ liệu](../02-backend-data/database-conventions.md)
- `project/glossary.md` — thuật ngữ nghiệp vụ của dự án
