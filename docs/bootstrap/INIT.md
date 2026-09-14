# Quy trình khởi tạo dự án

> **Đối tượng**: agent đang mở một repo vừa copy template vào, `CLAUDE.md` còn là bản mồi.
> **Kết quả**: `project/` điền xong, `CLAUDE.md` thật đã sinh, sẵn sàng vào Phase 0.
> **Thời lượng**: 10–15 phút hỏi đáp với người dùng.

**Không viết một dòng code nào trong toàn bộ quy trình này.** Chỉ sửa `project/` và `CLAUDE.md`.

---

## Bước 0 — Kiểm tra trạng thái và lắp đủ thư mục

Có **hai đường** dẫn tới đây, xử lý khác nhau:

| Ở gốc repo có gì | Nghĩa | Làm gì |
|---|---|---|
| **Chỉ có `docs/`** | Người dùng copy mỗi thư mục `docs/` sang repo mới | Copy `docs/bootstrap/project/` lên gốc thành `project/`. **Không cần** copy `CLAUDE.md` mồi — Bước 4 sẽ sinh thẳng bản thật |
| Có `CLAUDE.md` bắt đầu bằng `# ⚠️ REPO NÀY CHƯA KHỞI TẠO` | Đã chạy `init.sh`, hoặc clone từ template repo | Chạy tiếp bình thường |
| Có `CLAUDE.md` mang tên dự án thật | **Đã khởi tạo rồi** | **Dừng.** Báo người dùng, không chạy lại |
| Có `project/` rồi nhưng các file đã có nội dung | Đã khởi tạo một phần | Dừng, hỏi người dùng muốn làm gì |

Sau khi lắp xong, gốc repo phải có tối thiểu: `docs/` và `project/`.

> **Kiểm tra bằng lệnh, đừng đoán.** Một lần `ls` ở gốc là đủ.

Nếu đã khởi tạo mà người dùng vẫn muốn làm lại → **hỏi cho rõ**: làm lại từ đầu (ghi đè `project/`)
hay chỉ bổ sung một phần? Chạy lại mù sẽ xoá mất công sức đã có.

### Lối tắt `/init-project` (tuỳ chọn)

Nếu gốc repo chưa có `.claude/commands/init-project.md` và người dùng muốn có lệnh tắt cho
lần sau, copy `docs/bootstrap/init-project.md` vào đó. Không bắt buộc.

---

## Bước 1 — Nhận diện dự án

Hỏi bằng **một lượt** `AskUserQuestion` (nhiều câu trong một lần gọi), đừng hỏi lắt nhắt.

### 1.1. Câu hỏi bắt buộc

| Hỏi gì | Vì sao cần | Dùng ở đâu |
|---|---|---|
| **Ứng dụng này làm gì?** Một đoạn ngắn, bằng lời người dùng | Là gốc của mọi thứ còn lại | `CLAUDE.md` dòng mô tả |
| **Tên ứng dụng** (hiển thị) và **tên repo** (kebab-case) | Đặt tên bảng, `appId`, `productName` | `CLAUDE.md`, `project/decisions.md` |
| **Ai dùng?** Một người / nhiều người trên cùng máy | `docs/01-architecture/security.md` §6 giả định một người dùng. Sai giả định này là sai mô hình bảo mật | `project/decisions.md` |
| **Dữ liệu có nhạy cảm không?** (thông tin cá nhân, y tế, tài chính, tôn giáo…) | Ảnh hưởng Q04 — quyết định **một chiều** | `project/decisions.md`, `project/roadmap.md` §3 |
| **Đã có dữ liệu sẵn chưa?** (Excel, CSV, DB cũ, sổ giấy) | Nhập liệu ban đầu thường tốn công hơn toàn bộ Phase 4 | `project/roadmap.md` §2, §3 |

### 1.2. Năm câu hỏi khung

Lấy nguyên từ `docs/00-meta/decisions-baseline.md` §2. Q01 đã trả lời ở 1.1 rồi.
Bốn câu còn lại — **nêu rõ hạn chót và hậu quả**, đừng hỏi trống không:

| # | Hỏi | Gợi ý mặc định |
|---|---|---|
| Q02 | TypeScript ngay từ đầu, hay JavaScript + JSDoc? | JS + JSDoc (D09). Hạn chót đổi ý: trước Phase 4 |
| Q03 | Có cần đa ngôn ngữ không? | Thường **không**. Hạn chót: trước Phase 3 |
| Q04 | Có mã hoá database không? | **Không** (D17) — `security.md` §5 khuyến nghị mã hoá cả ổ thay vì một file. **Một chiều**, hạn chót: trước Phase 7 |
| Q05 | Có chứng chỉ ký số không? | Nếu chưa có → người dùng sẽ gặp cảnh báo SmartScreen. Hạn chót: trước Phase 7 |

> Người dùng trả lời "chưa biết" là **hợp lệ** — ghi `Bỏ ngỏ` kèm hạn chót vào `project/decisions.md` §2,
> đừng ép chốt. Chỉ Q01 là bắt buộc phải có câu trả lời ngay.

---

## Bước 2 — Khai thác domain

Đây là phần tốn thời gian nhất và cũng là phần có giá trị nhất. **Không được đoán.**

> Nếu người dùng đã có sẵn bản vẽ ERD (ảnh, file `.drawio`, mô tả bảng) → đọc nó trước,
> rồi dùng phần dưới để **kiểm tra chỗ thiếu**, thay vì hỏi lại từ đầu.

### 2.1. Tìm thực thể

Hỏi: *"Ứng dụng quản lý những loại đối tượng nào? Kể tên bằng tiếng Việt."*

Với **mỗi** thực thể, làm rõ:

| Cần biết | Ví dụ câu hỏi |
|---|---|
| Tên tiếng Việt + tên tiếng Anh | "Gọi nó là gì trong code?" |
| Thuộc tính chính | "Mỗi cái có những thông tin gì?" |
| Cái nào bắt buộc, cái nào để trống được | Quyết định `NOT NULL` |
| Có giá trị cố định không (enum) | "Trạng thái có mấy loại? Liệt kê đủ" |
| Có ngày tháng không — **và là loại nào** | **Bắt buộc phân biệt**: mốc thời gian (`_at`, ISO UTC) hay ngày trên lịch (`_date`). Xem `docs/02-backend-data/database-conventions.md` §1.2b |

### 2.2. Tìm quan hệ

Với **mỗi cặp** thực thể có liên quan:

| Cần biết | Vì sao |
|---|---|
| 1–N hay N–N? | Quyết định có bảng nối hay không |
| Bắt buộc hay tuỳ chọn? | `NOT NULL` trên khoá ngoại |
| Xoá cha thì con thế nào? | Ma trận quyền xoá. Mặc định `RESTRICT` (`database-conventions.md` §1.6) |
| **Quan hệ có thay đổi theo thời gian không?** | Nếu có → cần `from_date`/`to_date`, và một ràng buộc "đúng một dòng hiện hành" |

> Ba câu hỏi hay bị bỏ sót, hỏi thẳng:
> - *"Có hai đường nào cùng trả lời một câu hỏi không?"* → hai nguồn sự thật, phải bỏ một
> - *"Cùng lúc một X thuộc mấy Y?"* → phân biệt 1–N thật với N–N
> - *"Có cần biết trước kia nó thuộc về đâu không?"* → cần lịch sử hay không

### 2.3. Tìm màn hình

Hỏi: *"Người dùng mở app lên thì thấy gì đầu tiên? Rồi họ bấm đi đâu?"*

Mỗi màn hình ghi: route · tên hiển thị · mô tả một câu · ưu tiên P0/P1/P2.
P0 là thứ thiếu nó thì app vô dụng.

### 2.4. Chốt lại trước khi viết

Tóm tắt bằng lời cho người dùng xác nhận: *"Vậy là N thực thể, M quan hệ, K màn hình.
Đúng chưa?"* — **chờ xác nhận rồi mới sang Bước 3.**

Sửa ở bước này tốn vài phút. Sửa sau khi đã viết `001_init.sql` tốn cả ngày.

---

## Bước 3 — Điền `project/`

Đọc `docs/examples/sample-domain.md` trước để nắm **hình dạng** cần đạt tới.

Làm **đúng thứ tự** — mỗi file phụ thuộc file trước:

| # | File | Nội dung | Nguồn luật |
|---|---|---|---|
| 1 | `project/glossary.md` | Bảng thuật ngữ + giá trị enum. **Làm trước tiên** — mọi file sau dùng tên ở đây | `docs/00-meta/naming-conventions.md` |
| 2 | `project/database-schema.md` | ERD · bảng · index · ma trận xoá · seed · khoá `settings` · ngoại lệ | `docs/02-backend-data/database-conventions.md` |
| 3 | `project/ipc-channels.md` | Nhóm kênh cho từng thực thể + sự kiện | `docs/01-architecture/ipc-communication.md` |
| 4 | `project/screen-map.md` | Bản đồ màn hình · sidebar · phím tắt riêng | `docs/03-frontend/ui-structure.md` |
| 5 | `project/invalidate-rules.md` | Bảng invalidate — **một dòng cho mỗi kênh ghi** ở file 3 | `docs/03-frontend/state-management.md` |
| 6 | `project/decisions.md` | Câu trả lời Bước 1 + quyết định phát sinh ở Bước 2 | `docs/00-meta/decisions-baseline.md` |
| 7 | `project/roadmap.md` | Sai lệch khỏi khung + rủi ro riêng của dự án | `docs/04-guidelines/phase-framework.md` |
| 8 | `project/README.md` | Điền tên dự án và trạng thái | — |

### Luật khi điền

| Luật | Chi tiết |
|---|---|
| **Mọi bảng nghiệp vụ có đủ 4 cột audit** | `id` (TEXT, UUID v4) · `created_at` · `updated_at` · `deleted_at`. Không lặp lại trong từng bảng, ghi một lần ở đầu §2 |
| **Index cho mọi cột** dùng trong `WHERE`/`ORDER BY`/`JOIN` | Thiếu index là lỗi, không phải tối ưu hoá sớm |
| **Mọi kênh `*:update` nhận `expectedUpdatedAt`** | D14 |
| **Ngày trên lịch dùng `_date`, mốc thời gian dùng `_at`** | D15. Đây là nguồn bug phổ biến nhất |
| **Ràng buộc nghiệp vụ đẩy xuống DB được thì đẩy** | Partial unique index (`... WHERE <điều kiện>`) là công cụ mạnh và hay bị quên |
| **Sai lệch khỏi luật template → ghi vào `project/decisions.md` §4** | Không được im lặng (`docs/00-meta/agent-rules.md` §2) |
| **Không seed dữ liệu nghiệp vụ mẫu** nếu đây là dữ liệu thật của người dùng | Bản ghi mẫu sẽ lẫn vào danh sách. Dùng `EmptyState` hướng dẫn thay thế |

---

## Bước 4 — Sinh `CLAUDE.md` thật

1. Đọc `docs/CLAUDE.template.md`.
2. Điền **mọi** chỗ `<...>`: tên dự án, mô tả một câu, trạng thái.
3. Sửa bảng "Stack đã chốt" nếu Bước 1 chọn khác mặc định (ví dụ dùng TypeScript).
4. Sửa bảng "Quyết định còn bỏ ngỏ" ở cuối — xoá những mục đã chốt ở Bước 1.
5. **Ghi đè `CLAUDE.md` ở gốc repo** bằng nội dung này.

> Bước ghi đè là thứ đánh dấu "đã khởi tạo". Sau nó, `CLAUDE.md` mồi biến mất và
> quy trình này không chạy lại nữa.

---

## Bước 5 — Kiểm chứng

Không có code để chạy. Đối chiếu bằng tay:

| # | Kiểm tra | Cách làm |
|---|---|---|
| 1 | `docs/` không bị đụng | `git status docs/` sạch. Template là dùng chung |
| 2 | Không còn ô trống | `grep -rn "chưa điền" project/` → không kết quả |
| 3 | Không còn placeholder trong `CLAUDE.md` | `grep -n "<" CLAUDE.md` → chỉ còn dấu `<` hợp lệ trong code, không còn `<Tên dự án>` |
| 4 | `CLAUDE.md` không còn là bản mồi | Không còn dòng `⚠️ REPO NÀY CHƯA KHỞI TẠO` |
| 5 | Mọi bảng qua checklist | `docs/02-backend-data/database-conventions.md` §4, từng bảng một |
| 6 | Kênh ↔ invalidate khớp | Mỗi kênh **ghi** ở `ipc-channels.md` có đúng một dòng ở `invalidate-rules.md` |
| 7 | Route ↔ kênh khớp | Mỗi route ở `screen-map.md` gọi được ít nhất một kênh đã khai báo |
| 8 | Thuật ngữ nhất quán | Tên trong `database-schema.md` khớp `glossary.md`, không có tên thứ hai cho cùng khái niệm |
| 9 | Không lẫn domain mẫu | `grep -rniE "invoice|customer|\btag\b" project/` → không kết quả (trừ khi domain thật đúng là hoá đơn) |

---

## Bước 6 — Dọn dẹp và bàn giao

1. Hỏi người dùng có muốn xoá `docs/bootstrap/` không — nó đã hết việc. Giữ lại cũng vô hại.
2. Ghi `docs/TEMPLATE_VERSION` hiện tại vào `project/decisions.md` §1, để sau này biết dự án
   đang ở bản template nào.
3. **Không chạy lệnh `git` nào.** Liệt kê file đã tạo/sửa, soạn sẵn commit message, rồi dừng.
4. Báo người dùng bước tiếp theo: **Phase 0** ở `docs/04-guidelines/phase-framework.md`.

### Mẫu commit message

```
chore(init): khởi tạo dự án <tên> từ template v<x.y.z>

Chốt domain <mô tả ngắn>: N thực thể, M màn hình.
Trả lời 5 câu hỏi khởi đầu, ghi vào project/decisions.md.

<Nêu 1-2 quyết định đáng chú ý và lý do, nếu có>

Chưa có mã nguồn. Bước tiếp theo: Phase 0.
```

---

## Nguyên tắc xuyên suốt quy trình này

| Nguyên tắc | Diễn giải |
|---|---|
| **Không đoán domain** | Người dùng biết nghiệp vụ của họ, agent thì không. Hỏi. |
| **Hỏi gộp, không hỏi lắt nhắt** | Dùng `AskUserQuestion` nhiều câu một lượt |
| **Nêu hậu quả khi hỏi** | "Có mã hoá DB không?" là câu vô nghĩa nếu không nói nó **một chiều** |
| **Chốt lại trước khi viết** | Bước 2.4 tồn tại vì sửa lúc đó rẻ hơn sửa sau nhiều lần |
| **Báo cáo trung thực** | Chỗ nào người dùng chưa quyết → ghi `Bỏ ngỏ` kèm hạn chót, không tự điền bừa |
| **Không sửa `docs/`** | Phát hiện luật template sai → dừng, báo, sửa ở repo template rồi tăng `TEMPLATE_VERSION` |
