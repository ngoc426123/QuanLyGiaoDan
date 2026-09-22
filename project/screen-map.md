# Bản đồ màn hình

> **Luật gốc**: `docs/03-frontend/ui-structure.md` — App Shell, 5 trạng thái bắt buộc,
> phân loại component, design token, accessibility.
> File này chỉ chứa **danh sách màn hình riêng của domain**.

---

## 1. Bản đồ màn hình

| Route           | Màn hình         | Mô tả                                                                            | Ưu tiên |
| --------------- | ---------------- | -------------------------------------------------------------------------------- | ------- |
| `/`             | Tổng quan        | Tổng số giáo dân / hộ / giáo họ, báo cáo mục vụ theo tháng và chất lượng dữ liệu | P0      |
| `/persons`      | Giáo dân         | Danh sách, lọc theo giáo họ / hộ / giới tính / còn sống                          | P0      |
| `/persons/:id`  | Hồ sơ giáo dân   | Thông tin + bí tích + hộ hiện hành + lịch sử hộ                                  | P0      |
| `/families`     | Gia đình         | Danh sách hộ, lọc theo giáo họ                                                   | P0      |
| `/families/:id` | Chi tiết hộ      | Thông tin hộ + danh sách thành viên                                              | P0      |
| `/zones`        | Giáo họ          | Danh sách giáo họ kèm số hộ / số người                                           | P1      |
| `/zones/:id`    | Chi tiết giáo họ | Danh sách hộ thuộc giáo họ                                                       | P1      |
| `/search?q=`    | Tìm kiếm         | Tìm không dấu trên người và hộ                                                   | P1      |
| `/trash`        | Thùng rác        | Bản ghi đã xoá mềm                                                               | P2      |
| `/settings`     | Cài đặt          | Giao diện / Dữ liệu / Phím tắt / Giới thiệu                                      | P1      |

> Mục **Dữ liệu** của `/settings` chứa hai nút "Xuất dữ liệu ra file" và "Nhập dữ liệu từ file"
> (kênh `backup:*`, đã có từ Phase 2). Phase 3 đã chuyển hai nút vào Cài đặt, qua API wrapper
> và mutation hook. Các route nghiệp vụ khác dùng dữ liệu minh hoạ, chưa gọi CRUD thật.
> Thêm màn hình ngoài bảng này → **phải hỏi** (`docs/00-meta/agent-rules.md` §2).
>
> Mọi màn hình hiển thị dữ liệu **bắt buộc** xử lý đủ 5 trạng thái —
> xem `docs/03-frontend/ui-structure.md` §3.1.

**Ánh xạ route → kênh IPC** _(kiểm chứng §12 mục 6 của `plan/00-domain-lock-in.md`)_

| Route                  | Kênh gọi                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `/`                    | `dashboard:getSummary`                                                                                 |
| `/persons` · `/search` | `person:list`                                                                                          |
| `/persons/:id`         | `person:getById`, `person:update`, `person:remove`, `family-member:move`                               |
| `/families`            | `family:list`                                                                                          |
| `/families/:id`        | `family:getById`, `family:update`, `family-member:add`, `family-member:update`, `family-member:remove` |
| `/zones`               | `zone:list`, `zone:create`, `zone:update`, `zone:remove`                                               |
| `/zones/:id`           | `zone:getById`, `family:list`                                                                          |
| `/trash`               | `app:*` (thùng rác — đặc tả ở `ipc-communication.md` §5)                                               |
| `/settings`            | `setting:*`                                                                                            |

---

## 2. Mục điều hướng trên Sidebar

```
Tổng quan
Giáo dân
Gia đình
Giáo họ
────────
Cài đặt
```

`/persons/:id`, `/families/:id`, `/zones/:id` là màn hình chi tiết — không có mục sidebar riêng,
đánh dấu mục cha đang hoạt động. `/search` và `/trash` vào từ thanh công cụ, không nằm trên sidebar.

---

## 3. Phím tắt riêng của domain

Phím tắt chung (`Ctrl+K`, `Ctrl+F`, `Ctrl+,`, `Ctrl+B`, `Esc`, điều hướng danh sách)
đã đặc tả ở `docs/03-frontend/ui-structure.md` §7. Bảng dưới chỉ ghi **phần riêng**.

| Phím     | Hành động         | Phạm vi                                               |
| -------- | ----------------- | ----------------------------------------------------- |
| `Ctrl+N` | Thêm giáo dân mới | Toàn cục                                              |
| `Space`  | _(bỏ)_            | Domain này không có khái niệm "hoàn thành" để bật/tắt |
