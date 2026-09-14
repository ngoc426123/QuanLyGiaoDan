# Phase 8 — Mở rộng (sau phát hành)

> **Mục tiêu**: Danh sách ứng viên, **ưu tiên theo phản hồi thực tế** của văn phòng giáo xứ —
> không làm theo thứ tự trong bảng.
>
> **Tiền đề**: Đã phát hành và có người dùng thật trong ít nhất vài tuần

**Luật xuyên suốt**: ý tưởng mới phát sinh trong Phase 0–7 **ghi vào đây, không chen ngang**
(`docs/04-guidelines/phase-framework.md` §4 — "Phình cấu trúc do thêm tính năng tuỳ hứng").

---

## 1. Ứng viên

| Hạng mục                           | Ghi chú                                                                                | Điều kiện tiên quyết                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Sổ bộ bí tích đầy đủ**           | Tách bảng `sacraments` + `marriages`, in được chứng thư Rửa tội / Hôn phối             | Xem §2 — **thay đổi lớn nhất**                                                   |
| **Phân cấp giáo họ**               | Thêm `parent_id` vào `zones` để có giáo họ → giáo khu / xóm giáo                       | Migration rebuild nhẹ                                                            |
| **Ảnh giáo dân**                   | Tính năng đính kèm: `attachments/năm/tháng/<uuid>.jpg`, DB lưu đường dẫn **tương đối** | Đọc `security.md` §4 trước                                                       |
| **Đoàn thể / chức vụ**             | Ban hành giáo, ca đoàn, Legio, trùm khu — bảng `memberships` riêng                     | Đây có thể là ý đồ thật của cột `relationship` trong `person_zone` ở diagram gốc |
| Đa cửa sổ                          | Kiểm chứng cơ chế broadcast event đã dựng từ Phase 1                                   | `expectedUpdatedAt` đã làm đúng từ Phase 2                                       |
| Xuất JSON đầy đủ                   | Cho người dùng mang dữ liệu đi nơi khác. Chạy trong `worker_threads`                   |                                                                                  |
| Đa ngôn ngữ (i18n)                 | **Q03** — chốt trước khi bắt đầu, ảnh hưởng cách viết **mọi** chuỗi hiển thị           | Với domain này gần như chắc chắn **không cần**                                   |
| Chuyển sang TypeScript             | **Q02** — đổi dần từng file, bắt đầu từ `shared/`                                      |                                                                                  |
| Thông báo bổn mạng / sinh nhật     | Danh sách "tháng này ai mừng bổn mạng" — nhu cầu thật của giáo xứ                      | Index trên `birth_date` đã có từ Phase 2                                         |
| Thống kê theo năm                  | Số rửa tội / hôn phối / qua đời theo năm                                               |                                                                                  |
| Tray icon, khởi động cùng hệ thống |                                                                                        |                                                                                  |
| Đồng bộ nhiều máy                  | **Thay đổi kiến trúc lớn** — cần thiết kế lại, không làm tuỳ hứng                      |                                                                                  |

---

## 2. Sổ bộ bí tích — nếu phát sinh yêu cầu

Bước tiền đề đã chọn **bí tích phẳng** (5 cột ngày trên `persons`) và ghi rõ hệ quả:
**không in được chứng thư**, và hôn phối không lưu đúng bản chất.

Nếu giáo xứ phát sinh yêu cầu in chứng thư, đây là việc phải làm:

### 2.1. Bảng mới

```
sacraments (id, person_id, type, date, place, minister, godparent,
            book_no, page_no, entry_no, note, + 4 cột audit)
```

| Cột                                | Ghi chú                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `type`                             | `baptism` / `first_communion` / `confirmation`                          |
| `place`                            | Nơi cử hành — thường không phải giáo xứ hiện tại                        |
| `minister`                         | Linh mục chủ sự                                                         |
| `godparent`                        | Người đỡ đầu                                                            |
| `book_no` / `page_no` / `entry_no` | Số sổ / số trang / số thứ tự — **cần cho chứng thư có giá trị pháp lý** |

```
marriages (id, husband_id, wife_id, date, place, minister,
           witness_1, witness_2, book_no, page_no, entry_no, note, + 4 cột audit)
```

`husband_id` / `wife_id` cho phép `NULL` — trường hợp chuẩn hôn phối, một bên không phải giáo dân
của xứ. Khi đó lưu tên vào cột text riêng.

**Thêm tên thánh thêm sức**: một số nơi tên thánh khi Thêm sức khác tên thánh khi Rửa tội.
Nếu cần thì `sacraments.holy_name`.

### 2.2. Migration — không đơn giản

SQLite **không hỗ trợ đầy đủ `ALTER TABLE`** (không đổi kiểu cột, không xoá ràng buộc).
Bỏ 5 cột khỏi `persons` phải dùng mẫu **table rebuild** (`storage-strategy.md` §5.6):

```
1. Tạo persons_new không có 5 cột bí tích
2. INSERT INTO sacraments SELECT ... FROM persons  (chuyển 3 cột đầu thành 3 dòng)
3. INSERT INTO marriages  SELECT ... FROM persons  (marriage_date → 1 dòng, wife/husband để NULL)
4. INSERT INTO persons_new SELECT ... FROM persons
5. DROP TABLE persons
6. ALTER TABLE persons_new RENAME TO persons
7. Tạo lại TOÀN BỘ index và trigger của persons (kể cả trigger FTS5 từ Phase 5)
```

Tất cả trong **một transaction**, **tắt `foreign_keys` trong lúc rebuild** rồi bật lại sau.

> **Bắt buộc test migration trên bản sao dữ liệu thật**, không chỉ trên DB rỗng
> (`storage-strategy.md` §5.5). Migration chạy đúng trên DB rỗng nhưng gãy vì ràng buộc
> dữ liệu thật là chuyện thường gặp.

### 2.3. Chi phí ước lượng

| Việc                                                | Ước lượng |
| --------------------------------------------------- | --------- |
| Migration + test trên dữ liệu thật                  | 1–2 ngày  |
| Repository + Service + IPC cho 2 bảng mới           | 2–3 ngày  |
| UI: quản lý bí tích trong hồ sơ + màn hình hôn phối | 2–3 ngày  |
| Mẫu in chứng thư + kiểm thử trên máy in             | 1–2 ngày  |

Tổng khoảng **6–10 ngày**. Đây là cái giá của quyết định "bí tích phẳng" ở bước tiền đề —
đã biết trước và chấp nhận, không phải bất ngờ.

---

## 3. Quy tắc khi lấy một hạng mục ra làm

| Bước | Việc                                                                                                                                                                  |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Làm trong **git worktree riêng** (`docs/05-git/worktree.md`) — chú ý 3 cạm bẫy: cổng dev trùng, **dữ liệu dev dùng chung**, một tiến trình Electron tại một thời điểm |
| 2    | Thêm bảng mới hoặc đổi schema đã phát hành → **phải hỏi** (`agent-rules.md` §2)                                                                                       |
| 3    | Thêm màn hình ngoài bản đồ màn hình → **phải hỏi**                                                                                                                    |
| 4    | Thêm dependency → **phải hỏi** (Công thức 6, bước 0)                                                                                                                  |
| 5    | Theo đúng **Công thức 1** của `recipes.md` nếu là thực thể mới                                                                                                        |
| 6    | Migration mới, **không bao giờ** sửa file đã phát hành                                                                                                                |
| 7    | Cập nhật docs **trong cùng lần thay đổi**                                                                                                                             |

---

## 4. Việc KHÔNG nên làm

| Hạng mục                       | Vì sao                                                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đồng bộ đám mây "cho tiện"     | Dữ liệu giáo dân là dữ liệu cá nhân nhạy cảm. Đưa lên mạng là **thay đổi hoàn toàn mô hình đe doạ** ở `security.md` — phải thiết kế lại từ đầu, không phải thêm một tính năng |
| Phân quyền người dùng nửa vời  | `security.md` §2: _"SQLite không có `GRANT`, không có role"_. Ai mở được file DB là đọc được tất cả. Phân quyền trong app chỉ là trang trí                                    |
| Tự động gộp bản ghi nghi trùng | Gộp nhầm hai người khác nhau là lỗi không phục hồi được. Chỉ **báo cáo**, để người dùng quyết định                                                                            |
| Thêm trường "cho chắc"         | Mỗi cột là một ô trống người nhập liệu phải nhìn. Chỉ thêm khi có người thật sự điền                                                                                          |
