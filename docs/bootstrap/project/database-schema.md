# Cấu trúc cơ sở dữ liệu

> **Luật gốc**: `docs/02-backend-data/database-conventions.md` — quy ước đặt tên, ánh xạ kiểu,
> hai loại thời gian, cột bắt buộc, soft delete, khoá ngoại, checklist thêm bảng.
> File này chỉ chứa **schema riêng của domain**.

> Mọi bảng ở đây phải qua được checklist §6 của file luật gốc trước khi coi là xong.

---

## 1. Sơ đồ quan hệ (ERD)

```
(chưa điền)
```

**Tóm tắt quan hệ**

| Quan hệ | Kiểu | Ghi chú |
|---|---|---|
| *(chưa điền)* | | |

---

## 2. Định nghĩa chi tiết từng bảng

Mọi bảng nghiệp vụ đều có `id` / `created_at` / `updated_at` / `deleted_at` theo
`database-conventions.md` §1.4 — **không lặp lại** trong từng bảng dưới.

### Mẫu một bảng

| Cột | Kiểu | Ràng buộc | Mô tả |
|---|---|---|---|
| | | | |

**Index**

| Tên | Cột | Mục đích |
|---|---|---|
| | | |

**Ràng buộc nghiệp vụ** *(thực thi ở tầng Service, hoặc bằng partial index ở DB)*

1.

---

## 3. Ma trận quyền xoá

| Xoá bản ghi | Hành vi mặc định | Xử lý ở Service |
|---|---|---|
| *(chưa điền)* | | |

---

## 4. Dữ liệu khởi tạo (Seed)

Seed phải **idempotent** (`INSERT OR IGNORE`) — chạy lại nhiều lần không sinh dữ liệu trùng.

*(chưa điền)*

---

## 5. Bảng `settings` — khoá của dự án này

Cấu trúc bảng `settings` là chuẩn template (`database-conventions.md` §2).
Bảng dưới chỉ liệt kê **các khoá riêng** của dự án.

| Key | Giá trị mặc định | Mô tả |
|---|---|---|
| *(chưa điền)* | | |

---

## 6. Ngoại lệ so với quy ước chung

> Bỏ qua một luật trong `database-conventions.md` vì trường hợp đặc biệt → **phải ghi ở đây**,
> không được im lặng (`docs/00-meta/agent-rules.md` §2).

| Sai lệch | Lý do |
|---|---|
| *(chưa có)* | |

---

> **Chưa điền.** Điền ở **Bước 3** của `docs/bootstrap/INIT.md`.
> Ví dụ mẫu đã điền đầy đủ: `docs/examples/sample-domain.md`.
