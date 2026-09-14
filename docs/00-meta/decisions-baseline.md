# Quyết định nền của template

> **Mục đích**: Ghi lại **vì sao** stack này được chọn, để dự án mới không phải tranh luận lại
> từ đầu, và phiên làm việc sau không đề xuất lật thứ đã cân nhắc kỹ.
>
> File này là **template**. Nhật ký quyết định riêng của dự án nằm ở `project/decisions.md`.

> **Luật khi khởi tạo dự án mới**:
> - Mặc định **kế thừa toàn bộ** D01–D18 dưới đây. Không cần chép lại.
> - Muốn làm khác một mục → ghi sai lệch vào `project/decisions.md` §1 kèm lý do.
> - Trả lời 5 câu hỏi ở §2, ghi vào `project/decisions.md` §2.

---

## 1. Quyết định mặc định — D01 đến D18

| # | Quyết định | Lý do cốt lõi | Đảo ngược được? |
|---|---|---|---|
| D01 | Renderer dùng **React 18 + Vite** | Hệ sinh thái lớn, build nhanh, hợp với việc xuất file tĩnh cho `file://` | Khó — ảnh hưởng toàn bộ `frontend/` |
| D02 | Lưu trữ bằng **SQLite (`better-sqlite3`)** | Transaction ACID + index + khoá ngoại là thứ không chắp vá được về sau | Rất khó |
| D03 | Khoá chính là **UUID v4**, không dùng `AUTOINCREMENT` | ID ổn định khi rebuild bảng lúc migration; không đụng khi gộp dữ liệu giữa hai máy | Rất khó |
| D04 | **Soft delete** mặc định (`deleted_at`) | Cho phép thùng rác và khôi phục | Trung bình |
| D05 | IPC dùng `invoke`/`handle` + envelope `{ ok, data, error }` | Không throw xuyên ranh giới tiến trình; lỗi có mã máy đọc được | Trung bình |
| D06 | **TanStack Query** cho server state; **Zustand** cho UI state | Nguồn chân lý là SQLite, Renderer chỉ giữ cache có thời hạn | Trung bình |
| D07 | Router là **`HashRouter`** | Bản đóng gói chạy qua `file://`, `BrowserRouter` hỏng khi tải lại | Dễ |
| D08 | Style bằng **CSS Modules + design token** | Không dùng CSS-in-JS runtime cho app cục bộ | Trung bình |
| D09 | **JavaScript ESM + JSDoc**, chưa dùng TypeScript | Giảm rào cản khởi đầu — xem Q02 | Trung bình |
| D10 | **Hai package độc lập** `frontend/` và `backend/`, mỗi bên `package.json` riêng | Khả thi vì FE build ra file tĩnh; tránh hoisting làm rối native module | Trung bình |
| D11 | Code dùng chung đặt ở **`shared/`** (JS thuần, không có `package.json`), truy cập qua alias `@shared` | Tránh npm workspaces và hoisting | Dễ |
| D12 | **Backend sinh `id`**, Renderer không gửi `id` khi tạo | Tránh phải kiểm tra trùng và chống tiêm ID từ DevTools | Dễ |
| D13 | Chống double-submit bằng **khoá nút khi `isPending`** | Rẻ hơn nhiều so với cơ chế idempotency ở Backend | Dễ |
| D14 | Mọi kênh `*:update` bắt buộc có **`expectedUpdatedAt`** | Chống mất dữ liệu khi hai cửa sổ cùng sửa | Khó — phải sửa mọi kênh update |
| D15 | Tách **mốc thời gian** (`_at`, ISO UTC) và **ngày trên lịch** (`_date`, `YYYY-MM-DD`) | Lưu chung gây lệch một ngày với người dùng lệch múi giờ | Khó |
| D16 | **Chặn hạ cấp phiên bản**: `user_version` lớn hơn số migration hiện có → thoát app | Code cũ ghi đè schema mới làm hỏng dữ liệu vĩnh viễn | Dễ |
| D17 | **Không mã hoá database** (mặc định) | Mã hoá cả ổ (BitLocker / FileVault) là giải pháp đúng cho bài toán mất máy — xem Q04 | **Một chiều** |
| D18 | Tài liệu tách **3 tầng**: `CLAUDE.md` (ràng buộc) → `docs/` (template) → `project/` (nghiệp vụ) | Giảm lượng phải nạp mỗi phiên, và cho phép dùng lại `docs/` ở dự án khác | Dễ |

---

## 2. Năm câu hỏi mỗi dự án phải trả lời

**Agent không được tự chốt các mục này** (`agent-rules.md` §2).
Trả lời xong → ghi vào `project/decisions.md` §2.

| # | Câu hỏi | Hạn chót | Ảnh hưởng nếu chọn sai |
|---|---|---|---|
| Q01 | **Domain nghiệp vụ thật của ứng dụng** | Trước Phase 2 (viết `001_init.sql`) | Phải viết lại toàn bộ schema, kênh IPC và bản đồ màn hình |
| Q02 | Có chuyển sang TypeScript không | Trước Phase 4 | Càng muộn càng tốn công chuyển đổi |
| Q03 | Có cần đa ngôn ngữ (i18n) không | Trước Phase 3 | Ảnh hưởng cách viết **mọi** chuỗi hiển thị |
| Q04 | Có mã hoá database không | Trước Phase 7 | **Một chiều** — đổi sau khi phát hành phải mã hoá lại dữ liệu của mọi người dùng |
| Q05 | Có chứng chỉ ký số ứng dụng không | Trước Phase 7 | SmartScreen cảnh báo khi cài, người dùng không rành máy sẽ không dám cài |

---

## 3. Mẫu ghi một quyết định mới

```
| P0X | <ngày YYYY-MM-DD> | <quyết định, một câu> | <lý do cốt lõi — vì sao KHÔNG chọn phương án kia> | Dễ / Trung bình / Khó / Một chiều | Hiệu lực |
```

**Cột "Đảo ngược được?" — cách đánh giá:**

| Mức | Nghĩa |
|---|---|
| Dễ | Sửa vài file, không ảnh hưởng dữ liệu người dùng |
| Trung bình | Sửa nhiều file hoặc cần migration, dữ liệu vẫn an toàn |
| Khó | Ảnh hưởng dữ liệu đã có, cần migration phức tạp |
| **Một chiều** | Không có đường lui sau khi phát hành. **Phải hỏi trước khi chốt** |

---

## Tài liệu liên quan

- [Quy tắc làm việc cho AI Agent](./agent-rules.md) §2 — khi nào phải hỏi
- [Công thức 8 — Chốt một quyết định bỏ ngỏ](../04-guidelines/recipes.md)
- `project/decisions.md` — nhật ký quyết định của dự án
