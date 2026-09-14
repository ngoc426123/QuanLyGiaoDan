# Lộ trình dự án

> **Luật gốc**: `docs/04-guidelines/phase-framework.md` — khung 9 phase, Definition of Done
> chung, quy tắc thực thi, rủi ro cố hữu của stack.
> File này chỉ chứa **danh sách việc riêng của dự án**.

> Kế hoạch thi công chi tiết từng bước nằm ở [`plan/`](../plan/README.md).
> File này là bảng tổng hợp; `plan/` là bản hướng dẫn thực thi.

---

## 1. Trạng thái

| Phase | Tên                    | Ước lượng     | Trạng thái |
| ----- | ---------------------- | ------------- | :--------: |
| —     | Tiền đề — chốt domain  | 0.5–1 ngày    |     ☑      |
| 0     | Khởi tạo & Hạ tầng     | 1–2 ngày      |     ☑      |
| 1     | Xương sống IPC         | 1–2 ngày      |     ☑      |
| 2     | Tầng dữ liệu           | 2–3 ngày      |     ☑      |
| 3     | Bộ khung giao diện     | 2–3 ngày      |     ☑      |
| 4     | Nghiệp vụ lõi (CRUD)   | 5–7 ngày      |     ☑      |
| 5     | Hoàn thiện trải nghiệm | 3–5 ngày      |     ☑      |
| 6     | Độ tin cậy             | 2–3 ngày      |     ☐      |
| 7     | Đóng gói & Phát hành   | 2–3 ngày      |     ☐      |
| 8     | Mở rộng                | sau phát hành |     ☐      |

---

## 2. Sai lệch so với khung chuẩn

**☑ Phase 3 (2026-09-14):** đã hoàn tất kiểm thử tự động và xác nhận desktop thực tế.
Bằng chứng, giới hạn và danh sách file: [`phase-3-review.md`](./phase-3-review.md).

**☑ Phase 4 (2026-09-14):** đã chuyển đường chạy mã nguồn, build và test sang TypeScript;
hoàn tất CRUD Giáo họ → Gia đình → Giáo dân → Thành viên hộ. Người dùng đã xác nhận kiểm tra
CRUD thực tế. Danh sách lớn dùng phân trang SQL 50 dòng/trang theo quyết định người dùng.

**☑ Phase 5 (2026-09-14):** hoàn tất FTS tìm kiếm tiếng Việt, phím tắt, thao tác hàng loạt,
thùng rác, cài đặt dữ liệu, xuất/nhập CSV bằng `worker_threads`, và rà soát accessibility.
Chức năng in giấy được tách khỏi Phase 5 theo yêu cầu người dùng, để thực hiện sau cùng.

Ghi lại chỗ dự án này làm khác `phase-framework.md`, kèm lý do.

| Phase | Sai lệch                                                | Lý do                                                                                                |
| ----- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 4     | 5–7 ngày thay vì 4–6                                    | Domain có 4 thực thể, và bảng nối mang ràng buộc nghiệp vụ riêng                                     |
| 5     | Kéo import CSV/Excel từ Phase 8 lên                     | Nhập liệu ban đầu lớn hơn toàn bộ Phase 4 — **có điều kiện**, xem `plan/phase-5-experience.md` §5.11 |
| 5     | Thêm mục in / xuất danh sách                            | Nhu cầu thật của người dùng cuối, không có trong khung chuẩn                                         |
| 2     | Kéo **xuất / nhập file dữ liệu** từ Phase 6 lên Phase 2 | App dùng chung cho 2–3 người quản lý, cần mang dữ liệu qua lại ngay (P16)                            |

---

## 3. Rủi ro riêng của dự án

Rủi ro cố hữu của stack (native module, đóng gói, migration, rò rỉ listener) đã có ở
`phase-framework.md` §4. Bảng dưới chỉ ghi **rủi ro riêng**.

| Rủi ro                                                                                                   | Mức        | Phòng ngừa                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nhập liệu ban đầu** vài nghìn giáo dân bằng tay lớn hơn toàn bộ Phase 4                                | **Cao**    | Hỏi giáo xứ có sẵn Excel không. Nếu có → kéo import CSV/Excel từ Phase 8 lên Phase 5 (đã ghi ở §2)                                                                                                                     |
| Dữ liệu nhạy cảm (tôn giáo, quan hệ gia đình, địa chỉ) trên máy dùng chung                               | Trung bình | Xem lại **Q04 (mã hoá DB)** sớm hơn Phase 7. Đây là **quyết định một chiều**. `docs/01-architecture/security.md` §5 khuyến nghị BitLocker thay vì SQLCipher                                                            |
| **Đã xác nhận 2026-09-13**: 2–3 người quản lý, **mỗi người một máy** riêng                               | —          | Giả định "một người dùng mỗi máy" của `security.md` §6 **vẫn đúng**, không phải sửa template. Không cần phân quyền                                                                                                     |
| **Hai bản dữ liệu chạy song song trên hai máy** — nhập là thay trọn, ai nhập sau đè mất công người trước | **Cao**    | Hộp thoại đối chiếu bắt buộc trước khi nhập (P18). Về quy trình: chốt **một người giữ bản gốc**, người còn lại xuất gửi về chứ không nhập ngược. Muốn gộp thật thì phải thiết kế đồng bộ — việc lớn, chưa lên kế hoạch |
| Không in được chứng thư vì chọn bí tích phẳng                                                            | Trung bình | Đã biết trước và chấp nhận (quyết định P01). Nếu phát sinh yêu cầu → migration rebuild `persons` theo `docs/02-backend-data/storage-strategy.md` §5.6                                                                  |

---

## 4. Nguồn chi tiết

| Cần gì                                 | Đọc                              |
| -------------------------------------- | -------------------------------- |
| Danh sách việc từng bước của mỗi phase | `plan/phase-*.md`                |
| Đặc tả domain đã chốt                  | `plan/00-domain-lock-in.md`      |
| Vì sao chọn thiết kế này               | [`decisions.md`](./decisions.md) |
