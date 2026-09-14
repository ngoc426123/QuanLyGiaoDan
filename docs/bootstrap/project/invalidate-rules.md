# Quy tắc invalidate cache

> **Luật gốc**: `docs/03-frontend/state-management.md` §3 — nguyên tắc, cơ chế, cách xử lý event.
> File này chỉ chứa **bảng tra cứu riêng của domain**.

> Sai bảng này → UI hiển thị dữ liệu cũ mà không ai phát hiện ngay.
> Nguyên tắc: **invalidate rộng còn hơn thiếu.** Truy vấn lại SQLite cục bộ tốn vài mili-giây;
> hiển thị sai dữ liệu tốn niềm tin của người dùng.

---

## Bảng quy tắc

| Hành động | Invalidate những key nào |
|---|---|
| *(chưa điền)* | |

---

## Ghi chú riêng của domain

*(chưa điền — ví dụ: thao tác nào chạm nhiều key nhất và vì sao)*

---

> **Chưa điền.** Điền ở **Bước 3** của `docs/bootstrap/INIT.md`.
> Ví dụ mẫu đã điền đầy đủ: `docs/examples/sample-domain.md`.
