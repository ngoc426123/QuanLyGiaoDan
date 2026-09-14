# Phase 5 — Hoàn thiện trải nghiệm

> **Mục tiêu**: Chuyển từ "dùng được" sang "dùng thích". Tìm kiếm tiếng Việt, phím tắt,
> thao tác hàng loạt, thùng rác, và **nhập liệu từ Excel**.
>
> **Ước lượng**: 3–5 ngày · **Tiền đề**: Phase 4 đạt đủ Definition of Done

**Đọc trước**: `project/database-schema.md` §3.8, `docs/03-frontend/ui-structure.md` §6–§7.

> **Khác roadmap gốc**: mục 5.11 (import Excel/CSV) được **kéo từ Phase 8 lên đây**.
> Lý do ở [00-domain-lock-in.md](./00-domain-lock-in.md) §11: nhập tay vài nghìn giáo dân là
> công việc lớn hơn toàn bộ Phase 4. **Chỉ làm nếu giáo xứ có sẵn file dữ liệu** — hỏi trước.

---

## 5.1 — Migration FTS5

**File mới**: `backend/src/db/migrations/002_add_fts.sql`

> **Không sửa `001_init.sql`.** Đã phát hành thì viết migration mới (`storage-strategy.md` §5.5).

| Việc      | Chi tiết                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------- |
| Bảng ảo   | `persons_fts` trên `full_name`, `holy_name`, `note`; `families_fts` trên `name`, `address`, `note` |
| Tokenizer | `unicode61 remove_diacritics 2` — **gõ không dấu vẫn tìm được**                                    |
| Đồng bộ   | Trigger trên bảng gốc: `AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`                              |
| Sắp xếp   | Theo hàm `rank` sẵn có của FTS5                                                                    |

> Bảng ảo chỉ giữ `rowid` trỏ về bảng gốc, **không** lưu dữ liệu trùng lặp.
>
> Cột `full_name_ascii` (từ Phase 2) **vẫn giữ** — nó phục vụ lọc tiền tố nhanh trong ô chọn
> (`LIKE 'nguyen van%'` dùng index), khác với tìm toàn văn. Hai cơ chế cho hai việc khác nhau.

---

## 5.2 — Tìm kiếm

| Việc            | Chi tiết                                                   |
| --------------- | ---------------------------------------------------------- |
| Màn hình        | `/search?q=` — kết quả gộp: giáo dân + gia đình, tách nhóm |
| Gõ không dấu    | "nguyen van an" phải tìm được "Nguyễn Văn An"              |
| Làm nổi từ khoá | Trong kết quả                                              |
| Debounce        | Không gọi IPC theo từng ký tự                              |

**Ca kiểm thử bắt buộc**:

| Gõ                                  | Phải tìm ra                         |
| ----------------------------------- | ----------------------------------- |
| `nguyen van an`                     | Nguyễn Văn An                       |
| `NGUYEN`                            | Nguyễn (không phân biệt hoa thường) |
| `giuse`                             | Giuse (tên thánh)                   |
| `Nguyễn` gõ bằng tổ hợp Unicode NFD | Cùng kết quả với bản NFC            |

---

## 5.3 — Command Palette (`Ctrl+K`)

Nhảy nhanh tới: một giáo dân · một hộ · một giáo họ · một màn hình · một hành động.
Cùng cơ chế tìm không dấu ở 5.2.

---

## 5.4 — Phím tắt

Theo `ui-structure.md` §7, đã điều chỉnh cho domain này:

| Phím           | Hành động                 | Phạm vi                |
| -------------- | ------------------------- | ---------------------- |
| `Ctrl/Cmd + K` | Mở Command Palette        | Toàn cục               |
| `Ctrl/Cmd + N` | **Thêm giáo dân mới**     | Toàn cục               |
| `Ctrl/Cmd + F` | Focus ô tìm kiếm          | Toàn cục               |
| `Ctrl/Cmd + ,` | Mở Cài đặt                | Toàn cục               |
| `Ctrl/Cmd + B` | Ẩn/hiện sidebar           | Toàn cục               |
| `Esc`          | Đóng lớp phủ trên cùng    | Khi có overlay         |
| `↑` `↓`        | Di chuyển trong danh sách | Khi danh sách có focus |
| `Enter`        | Mở chi tiết mục đang chọn | Khi danh sách có focus |
| `Delete`       | Xoá mục đang chọn         | Khi danh sách có focus |

> **Bỏ `Space`** của roadmap gốc — domain này không có khái niệm "đánh dấu hoàn thành".

**Quy tắc**: đăng ký **một lần duy nhất** ở `AppShell`, không rải rác.
Phím tắt phải **tự động vô hiệu khi con trỏ đang ở trong ô nhập liệu**.

Thêm màn hình tra cứu phím tắt trong Cài đặt.

---

## 5.5 — Context menu chuột phải

Trên dòng danh sách: Xem chi tiết · Sửa · Chuyển hộ (với giáo dân) · Xoá.

---

## 5.6 — Thao tác hàng loạt

Dùng `useSelectionStore` đã dựng ở Phase 3.

| Thao tác                         | Áp dụng cho |
| -------------------------------- | ----------- |
| Chuyển nhiều người sang một hộ   | Giáo dân    |
| Chuyển nhiều hộ sang một giáo họ | Gia đình    |
| Xoá nhiều                        | Cả ba       |

**Bắt buộc**: chạy trong **một transaction** ở Service, phát **một** broadcast event khi xong,
không phát N event (`data-services.md` §6).

---

## 5.7 — Thùng rác (`/trash`)

| Việc          | Chi tiết                                            |
| ------------- | --------------------------------------------------- |
| Hiển thị      | Bản ghi có `deleted_at IS NOT NULL`, tách theo loại |
| Khôi phục     | Gán `deleted_at = NULL`                             |
| Xoá vĩnh viễn | Xoá cứng                                            |
| Dọn toàn bộ   | Có xác nhận                                         |

**Ràng buộc khi khôi phục** — điểm dễ sai nhất:

| Tình huống                                                               | Xử lý                                                                                                       |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Khôi phục một người mà dòng `family_members` cũ trỏ tới hộ **đã bị xoá** | Khôi phục người, **không** khôi phục dòng thành viên. Người về trạng thái "chưa thuộc hộ nào"               |
| Khôi phục một người đã có hộ hiện hành khác                              | Chỉ khôi phục bản ghi người, **không** khôi phục dòng cũ — nếu không sẽ vi phạm `uq_family_members_current` |
| Khôi phục một hộ mà giáo họ đã bị xoá                                    | **Chặn**, yêu cầu khôi phục giáo họ trước                                                                   |

> Đây là lúc hai partial unique index từ Phase 2 trả công — chúng chặn được các trường hợp
> mà logic khôi phục viết thiếu.

---

## 5.8 — Màn hình Cài đặt đầy đủ

| Tab        | Nội dung                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Giao diện  | Theme · mật độ · cỡ chữ                                                                                |
| Dữ liệu    | **Tên giáo xứ** (`general.parishName`) · sao lưu thủ công · số ngày giữ thùng rác · mở thư mục dữ liệu |
| Phím tắt   | Bảng tra cứu                                                                                           |
| Giới thiệu | Phiên bản app / Electron / Node / Chrome                                                               |

---

## 5.9 — In và xuất danh sách

Nhu cầu thật của văn phòng giáo xứ — không có trong roadmap gốc vì roadmap viết cho domain mẫu.

| Bản in                          | Nội dung                      |
| ------------------------------- | ----------------------------- |
| Danh sách giáo dân theo giáo họ | Có tên giáo xứ trên đầu trang |
| Danh sách hộ trong một giáo họ  |                               |
| Danh sách thành viên một hộ     |                               |

Xuất **CSV** cho từng danh sách trên. Dùng `app:showSaveDialog` đã có từ Phase 1.

> **Cần xác nhận trước khi làm**: giáo xứ cần in ra giấy hay chỉ cần xuất file?
> In ấn đòi thêm CSS `@media print` và kiểm thử thật trên máy in.

---

## 5.10 — Rà soát khả năng tiếp cận

Theo `ui-structure.md` §6:

- [ ] Focus ring rõ ràng ở **cả hai** theme, dùng `:focus-visible`
- [ ] Bẫy focus trong Modal/Drawer; `Esc` đóng; đóng xong trả focus về nơi kích hoạt
- [ ] Nút chỉ có icon có `aria-label`
- [ ] Độ tương phản tối thiểu **4.5:1** ở cả hai theme
- [ ] Vùng bấm tối thiểu **32 × 32 px**
- [ ] Toast và lỗi dùng `role="status"` / `role="alert"`
- [ ] Tôn trọng `prefers-reduced-motion`

---

## 5.11 — Nhập liệu từ Excel / CSV _(có điều kiện)_

> **Chỉ làm nếu giáo xứ có sẵn file dữ liệu.** Hỏi trước — nếu họ nhập tay từ sổ giấy thì
> tính năng này vô dụng và nên bỏ hẳn thời gian đó sang 5.9 (in ấn).
>
> **Thêm dependency đọc Excel → phải hỏi trước** (`recipes.md` Công thức 6).
> Nếu file nguồn xuất được ra CSV thì **không cần thêm gói nào** — ưu tiên phương án này.

| Việc       | Chi tiết                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Chạy ở đâu | **`worker_threads`** — tác vụ > 300ms không được chặn Main (`CLAUDE.md`, `data-services.md` §7) |
| Tiến độ    | Phát `event:import-progress`, Renderer **debounce ~10 lần/giây**                                |
| Validate   | Dữ liệu import đi qua **đúng tầng validate như dữ liệu nhập tay** (`security.md` §7)            |
| Xem trước  | Bảng đối chiếu cột trước khi ghi, kèm số dòng lỗi                                               |
| Giao dịch  | Toàn bộ một transaction — lỗi giữa chừng thì không ghi gì                                       |
| Thứ tự     | Giáo họ → Hộ → Người → Thành viên. Tự tạo giáo họ/hộ nếu chưa có                                |
| Trùng lặp  | Đối chiếu theo `full_name_ascii` + `birth_date`; nghi ngờ trùng thì báo cáo, **không** tự gộp   |

**Bắt buộc backup DB trước khi import.** Import hỏng dữ liệu thật là rủi ro lớn nhất của phase này.

---

## Definition of Done

- [ ] Gõ "nguyen van an" tìm được "Nguyễn Văn An"
- [ ] Tìm kiếm chạy trên cả họ tên, tên thánh, tên hộ, địa chỉ
- [ ] Mọi hành động chính làm được bằng bàn phím, **không cần chuột**
- [ ] Phím tắt tự vô hiệu khi đang gõ trong ô nhập liệu
- [ ] Xoá rồi khôi phục từ thùng rác — dữ liệu trở về nguyên vẹn
- [ ] Khôi phục người mà hộ cũ đã bị xoá → không sập, người về trạng thái chưa thuộc hộ
- [ ] Thao tác hàng loạt trên 100 bản ghi chạy trong 1 transaction, phát 1 event
- [ ] Độ tương phản đạt 4.5:1 ở cả hai theme
- [ ] Xuất CSV danh sách giáo dân theo giáo họ mở được bằng Excel, **tiếng Việt không lỗi font** (BOM UTF-8)
- [ ] _(nếu làm 5.11)_ Import 3.000 dòng không treo UI, có tiến độ, lỗi giữa chừng thì rollback sạch
- [ ] `npm run lint` + `npm run format:check` sạch, test pass

---

## Cạm bẫy của phase này

| Cạm bẫy                                                    | Hệ quả                                                      |
| ---------------------------------------------------------- | ----------------------------------------------------------- |
| Sửa `001_init.sql` để thêm FTS thay vì viết `002_`         | Hai máy có schema khác nhau cùng `user_version`             |
| Quên trigger `AFTER UPDATE`                                | Sửa tên xong tìm vẫn ra tên cũ                              |
| Tokenizer thiếu `remove_diacritics 2`                      | Gõ không dấu không tìm được — mất hẳn giá trị của tính năng |
| Khôi phục thành viên hộ mà không kiểm tra hộ đích còn sống | Vi phạm khoá ngoại hoặc `uq_family_members_current`         |
| Import chạy ở Main thread                                  | UI treo cứng vài chục giây, người dùng tưởng app chết       |
| Import không backup trước                                  | Sai một lần là mất dữ liệu thật                             |
| Xuất CSV không có BOM UTF-8                                | Excel mở ra tiếng Việt thành ký tự lạ                       |
| Phím tắt không vô hiệu trong ô nhập                        | Gõ chữ "n" trong ghi chú lại mở form tạo mới                |

---

## Docs phải cập nhật trong phase này

| Thay đổi                                | File                                           |
| --------------------------------------- | ---------------------------------------------- |
| Bảng FTS5 + trigger                     | `project/database-schema.md` §3.x              |
| Phím tắt                                | `docs/03-frontend/ui-structure.md` §7          |
| Màn hình mới (`/trash`, `/search`)      | `docs/03-frontend/ui-structure.md` §3          |
| Kênh import/export                      | `docs/01-architecture/ipc-communication.md` §5 |
| Dependency mới (nếu thêm gói đọc Excel) | `CLAUDE.md` + `project/decisions.md`           |

**Xong → [phase-6-reliability.md](./phase-6-reliability.md)**
