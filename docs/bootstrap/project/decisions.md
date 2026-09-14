# Nhật ký quyết định — <Tên dự án>

> **Luật gốc**: `docs/00-meta/decisions-baseline.md` — 18 quyết định mặc định của template,
> 5 câu hỏi khởi đầu, thang đánh giá mức đảo ngược, mẫu ghi quyết định.
> File này chỉ chứa **quyết định riêng của dự án này**.

> **Luật**:
> - Chốt một quyết định mới → thêm một dòng vào đây **ngay**.
> - Muốn đổi một quyết định đã chốt → **không tự đổi**. Ghi đề xuất vào §5, hỏi, rồi mới đổi.
> - Quyết định bị thay thế thì đánh dấu `Đã thay thế`, **không xoá dòng cũ**.

---

## 1. Kế thừa từ template

| Hạng mục | Giá trị |
|---|---|
| Bản template | *(chưa điền — chép số ở `docs/TEMPLATE_VERSION`)* |
| Trạng thái | Kế thừa toàn bộ D01–D18 của `decisions-baseline.md` §1 |

Sai lệch khỏi baseline (nếu có) ghi ở đây:

| # | Quyết định baseline | Dự án này làm khác | Lý do |
|---|---|---|---|
| — | *(chưa có)* | | |

---

## 2. Năm câu hỏi khởi đầu

| # | Câu hỏi | Trả lời | Ngày | Trạng thái |
|---|---|---|---|---|
| Q01 | **Domain nghiệp vụ** | *(chưa điền)* | | Bỏ ngỏ |
| Q02 | Chuyển sang TypeScript? | *(chưa)* — hạn chót trước Phase 4 | | Bỏ ngỏ |
| Q03 | Đa ngôn ngữ (i18n)? | *(chưa)* — hạn chót trước Phase 3 | | Bỏ ngỏ |
| Q04 | Mã hoá database? | *(chưa)* — hạn chót trước Phase 7. **Một chiều** | | Bỏ ngỏ |
| Q05 | Chứng chỉ ký số? | *(chưa)* — hạn chót trước Phase 7 | | Bỏ ngỏ |

> **Q01 chưa chốt thì không viết `001_init.sql`.** Schema, kênh IPC và bản đồ màn hình
> đều phái sinh từ domain.

---

## 3. Quyết định riêng của dự án

| # | Ngày | Quyết định | Lý do cốt lõi | Đảo ngược được? | Trạng thái |
|---|---|---|---|---|---|
| — | *(chưa có)* | | | | |

---

## 4. Ngoại lệ so với luật trong `docs/`

> `docs/00-meta/agent-rules.md` §2: *"Bỏ qua một luật trong docs vì trường hợp đặc biệt —
> ngoại lệ phải được ghi nhận, không được im lặng."*

| Luật bị lệch | Ở đâu | Dự án này làm gì | Lý do |
|---|---|---|---|
| — | *(chưa có)* | | |

---

## 5. Đề xuất thay đổi (chờ quyết định)

| # | Muốn đổi | Lý do đề xuất | Chi phí ước tính | Trạng thái |
|---|---|---|---|---|
| — | *(chưa có)* | | | |

---

> **Chưa điền.** Điền ở **Bước 1** và **Bước 3** của `docs/bootstrap/INIT.md`.
