# Phase 4 — Nghiệp vụ lõi (CRUD)

> **Mục tiêu**: Vòng đời trọn vẹn của Giáo họ → Gia đình → Giáo dân → Thành viên hộ.
> Đủ để văn phòng giáo xứ dùng hằng ngày.
>
> **Ước lượng**: 5–7 ngày · **Tiền đề**: Phase 3 đạt đủ Definition of Done

**Đọc trước**: `docs/04-guidelines/recipes.md` (Công thức 1), `docs/03-frontend/state-management.md`,
`docs/04-guidelines/coding-standards-frontend.md`.

> **Dài hơn roadmap gốc (4–6 ngày)** vì domain này có 4 thực thể và `family_members`
> mang ràng buộc nghiệp vụ riêng (1 hộ hiện hành, 1 chủ hộ, chuyển hộ có lịch sử).

---

## Thứ tự bắt buộc

Làm **từ dưới lên** theo chiều phụ thuộc — không có giáo họ thì không tạo được hộ,
không có hộ thì không gán được thành viên:

```
4.1 zone  →  4.2 family  →  4.3 person  →  4.4 family-member  →  4.5–4.9 hoàn thiện
```

Mỗi feature làm theo **Công thức 1** của `recipes.md`, bước 10–15 (Backend đã xong ở Phase 2):

| #   | File                                                 | Việc                                                                |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| 10  | `frontend/src/shared/queryKeys.js`                   | Thêm bộ key theo mẫu `all / lists / list(f) / details / detail(id)` |
| 11  | `frontend/src/features/<domain>/api/<domain>.api.js` | Wrapper mỏng quanh `window.api`, qua `shared/invoke.js`             |
| 12  | `frontend/src/features/<domain>/hooks/`              | `use<Domain>s.js`, `use<Domain>.js`, `use<Domain>Mutations.js`      |
| 13  | `frontend/src/features/<domain>/components/`         | Component hiển thị + form                                           |
| 14  | `docs/03-frontend/state-management.md` §3.1          | Thêm dòng vào bảng invalidate                                       |
| 15  | Test                                                 | Theo `coding-standards-frontend.md` §10                             |

**Ba tầng bắt buộc** (`coding-standards-frontend.md` §6.1) — không được rút ngắn:

```
component  →  custom hook  →  <domain>.api.js  →  shared/invoke.js  →  window.api
```

- Component **không** gọi `window.api` trực tiếp
- Component **không** gọi `useQuery` / `useMutation` trực tiếp

---

## 4.1 — Feature `zone` (Giáo họ)

Làm trước vì `families.zone_id` là `NOT NULL` — không có giáo họ thì không tạo được hộ.

| Việc     | Chi tiết                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| Màn hình | `/zones` (danh sách), `/zones/:id` (chi tiết + danh sách hộ thuộc giáo họ)                                            |
| Form     | `name` (bắt buộc), `holyName`, `note`                                                                                 |
| Hiển thị | Mỗi dòng kèm `familyCount` / `personCount`                                                                            |
| Xoá      | Còn hộ → `FOREIGN_KEY_VIOLATION`. UI hiện thông điệp rõ: "Giáo họ còn N gia đình, hãy chuyển sang giáo họ khác trước" |
| Sidebar  | Danh sách giáo họ hiển thị ở sidebar để lọc nhanh                                                                     |

**Empty state đặc biệt**: DB mới hoàn toàn trống (không seed dữ liệu mẫu — xem Phase 2 §2.5).
Màn hình đầu tiên người dùng thấy phải hướng dẫn **tạo giáo họ trước**.

---

## 4.2 — Feature `family` (Gia đình)

| Việc     | Chi tiết                                                                             |
| -------- | ------------------------------------------------------------------------------------ |
| Màn hình | `/families` (danh sách, lọc theo giáo họ), `/families/:id` (chi tiết + thành viên)   |
| Form     | `zoneId` (bắt buộc, `Select`), `name` (bắt buộc), `address`, `note`                  |
| Hiển thị | Mỗi dòng kèm `memberCount`, `zoneName`                                               |
| Xoá      | Còn thành viên hiện hành → `CONFLICT`. UI hiện số thành viên và yêu cầu chuyển trước |

**Màn hình chi tiết hộ** là màn hình quan trọng nhất của Phase 4:

- Thông tin hộ + nút sửa
- Bảng thành viên hiện hành: tên · tên thánh · quan hệ · ngày sinh · ngày vào hộ
- **Chủ hộ hiển thị nổi bật**, sắp lên đầu
- Cảnh báo nếu hộ **không có chủ hộ**
- Nút "Thêm thành viên" + "Chuyển thành viên đi hộ khác"
- Tab / mục gập lại: **lịch sử thành viên** (những dòng đã có `to_date`)

---

## 4.3 — Feature `person` (Giáo dân)

| Việc               | Chi tiết                                                  |
| ------------------ | --------------------------------------------------------- |
| Màn hình           | `/persons` (danh sách), `/persons/:id` (hồ sơ)            |
| Form               | Chia 3 nhóm — xem dưới                                    |
| Hiển thị danh sách | Họ tên · tên thánh · giới tính · ngày sinh · hộ · giáo họ |

**Form hồ sơ giáo dân** — chia nhóm để không thành một cột 13 ô:

| Nhóm             | Trường                                                                              |
| ---------------- | ----------------------------------------------------------------------------------- |
| Thông tin cơ bản | `fullName` (bắt buộc) · `givenName` · `holyName` · `gender` · `birthDate` · `phone` |
| Bí tích          | `baptismDate` · `firstCommunionDate` · `confirmationDate` · `marriageDate`          |
| Tình trạng       | `deathDate` · `note`                                                                |

**Quy tắc form**:

| Quy tắc                                                                            | Nguồn                                               |
| ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| `fullNameAscii` **không** có trên form — Service tự sinh                           | [00-domain-lock-in.md](./00-domain-lock-in.md) §4.3 |
| Mọi ô ngày làm việc với chuỗi `YYYY-MM-DD`, **không** object `Date`                | `ipc-communication.md` §4                           |
| Nút submit `disabled={mutation.isPending}` — **cách duy nhất** chống double-submit | `coding-standards-frontend.md` §6.2                 |
| Lỗi validation hiện **tại từng trường**, đọc từ `error.details.fieldErrors`        | `state-management.md` §8.1                          |
| Cảnh báo thứ tự bí tích (`meta.warnings`) hiện dạng **nhắc nhở**, không chặn lưu   | Phase 2 §2.7.1                                      |

**Khi tạo mới**: cho phép gán luôn vào hộ ngay trong form (`person:create` nhận `family?`).
Một transaction, không phải hai bước.

**Hồ sơ giáo dân** hiển thị: thông tin · bí tích · **hộ hiện hành** (kèm quan hệ) · **lịch sử hộ**.

---

## 4.4 — Feature `family-member` (Thành viên hộ)

Feature phức tạp nhất Phase 4. Không có màn hình riêng — sống trong `/families/:id` và `/persons/:id`.

| Thao tác        | UI                                                                                 | Kênh                   |
| --------------- | ---------------------------------------------------------------------------------- | ---------------------- |
| Thêm thành viên | Modal: chọn người có sẵn **hoặc** tạo người mới · chọn `relationship` · `fromDate` | `family-member:add`    |
| Sửa quan hệ     | Inline trong bảng thành viên                                                       | `family-member:update` |
| **Chuyển hộ**   | Modal riêng: chọn hộ đích · `relationship` mới · `moveDate`                        | `family-member:move`   |
| Gỡ khỏi hộ      | Xác nhận rồi xoá mềm                                                               | `family-member:remove` |

**Chuyển hộ** là luồng cần chăm nhất:

1. Người dùng chọn hộ đích — ô chọn phải tìm được theo tên **không dấu**
2. Cảnh báo nếu người này đang là **chủ hộ** của hộ cũ → hộ cũ sẽ không còn chủ hộ
3. Gọi `family-member:move` — Backend đóng dòng cũ + mở dòng mới trong **một transaction**
4. Invalidate **6 key** — xem [00-domain-lock-in.md](./00-domain-lock-in.md) §9

**Ba lỗi phải xử lý tử tế**:

| Lỗi                                                 | Thông điệp UI                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `CONFLICT` — người đã có hộ hiện hành               | "Người này đang thuộc hộ X. Dùng chức năng Chuyển hộ thay vì Thêm mới" |
| `CONFLICT` — hộ đã có chủ hộ                        | "Hộ này đã có chủ hộ là Y. Hãy đổi quan hệ của Y trước"                |
| `VALIDATION_ERROR` — `moveDate` trước `fromDate` cũ | "Ngày chuyển không được trước ngày vào hộ cũ (dd/mm/yyyy)"             |

---

## 4.5 — Lọc và sắp xếp

**Lọc ở tầng SQL, không lọc ở Renderer** (`ipc-communication.md` §5.1).

| Màn hình    | Bộ lọc                                                     |
| ----------- | ---------------------------------------------------------- |
| `/persons`  | Giáo họ · Hộ · Giới tính · Còn sống / Đã qua đời · Từ khoá |
| `/families` | Giáo họ · Từ khoá                                          |
| `/zones`    | Từ khoá                                                    |

**Sắp xếp** — `sortBy` đối chiếu **whitelist cứng** ở Repository:

| Màn hình    | Cho phép sắp theo                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------- |
| `/persons`  | `givenName` (mặc định — tên gọi, đúng cách sắp tiếng Việt) · `fullName` · `birthDate` · `createdAt` |
| `/families` | `name` · `createdAt`                                                                                |
| `/zones`    | `name`                                                                                              |

Bộ lọc quan trọng đưa lên **URL** (`?zoneId=`, `?q=`) — nhóm 4 State (`state-management.md` §6.1).
Bộ lọc phụ giữ ở `useFilterStore`.

---

## 4.6 — Phân trang

- `pageSize` mặc định **50**, tối đa **200**
- Danh sách trên **200 phần tử** phải dùng `VirtualList` (`ui-structure.md` §2.2)
- Một giáo xứ vài nghìn giáo dân → `/persons` **chắc chắn** cần virtual scroll

---

## 4.7 — Màn hình Tổng quan (`/`)

Màn hình đầu tiên người dùng thấy mỗi lần mở app:

| Khối             | Nội dung                                                |
| ---------------- | ------------------------------------------------------- |
| Số liệu          | Tổng giáo dân (đang sống) · Tổng hộ · Tổng giáo họ      |
| Phân bố          | Bảng: mỗi giáo họ — số hộ, số giáo dân                  |
| Cảnh báo dữ liệu | Hộ **không có chủ hộ** · Giáo dân **chưa thuộc hộ nào** |
| Lối tắt          | "Thêm giáo dân" · "Thêm hộ"                             |

> Khối cảnh báo là giá trị thật của màn hình này — nó bắt lỗi nhập liệu mà người dùng
> không chủ động đi tìm.

---

## 4.8 — Ghép broadcast event vào invalidate

Đăng ký **một lần duy nhất** ở `AppShell` (hoặc một provider riêng), **không** đăng ký trong từng component:

```
useEffect(() => {
  const off = window.api.events.onPersonChanged((payload) => {
    queryClient.invalidateQueries({ queryKey: personKeys.lists })
    if (payload.id) {
      queryClient.invalidateQueries({ queryKey: personKeys.detail(payload.id) })
    }
  })
  return off          // BẮT BUỘC
}, [queryClient])
```

| Quy tắc                                             | Lý do                                                      |
| --------------------------------------------------- | ---------------------------------------------------------- |
| Event chỉ để **invalidate**, **không** ghi đè cache | Payload event rút gọn; ghi đè làm mất trường               |
| Luôn trả hàm cleanup từ `useEffect`                 | Không cleanup → mỗi lần hot-reload chồng thêm một listener |

**Bảng invalidate đầy đủ**: [00-domain-lock-in.md](./00-domain-lock-in.md) §9.
Nguyên tắc: **invalidate rộng còn hơn thiếu** — truy vấn lại SQLite cục bộ tốn vài mili-giây.

---

## 4.9 — Xoá mềm + xác nhận

| Việc                                  | Chi tiết                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| Xoá = gán `deleted_at`                | Không xoá vật lý                                                                   |
| Luôn có `ConfirmDialog` trước khi xoá |                                                                                    |
| Xoá bản ghi đang mở chi tiết          | `removeQueries` cho key detail, rồi điều hướng về danh sách                        |
| `NOT_FOUND` trên màn hình chi tiết    | Điều hướng về danh sách kèm toast giải thích, **không** để màn hình trống khó hiểu |

Màn hình `/trash` để **Phase 5** (khôi phục + xoá vĩnh viễn).

---

## Definition of Done

- [ ] Tạo/sửa/xoá **giáo họ, hộ, giáo dân, thành viên hộ** hoạt động trọn vẹn
- [ ] Chuyển hộ chạy đúng: hộ cũ có `to_date`, hộ mới hiện hành, lịch sử hiện đủ trên hồ sơ
- [ ] **Mọi màn hình có đủ 5 trạng thái** (loading / empty / error / filtered-empty / success)
- [ ] Lỗi validation hiển thị **đúng tại từng trường** trong form
- [ ] Ba lỗi nghiệp vụ ở 4.4 hiện thông điệp tiếng Việt dễ hiểu, không phải mã lỗi thô
- [ ] Sửa dữ liệu ở màn hình này → màn hình khác tự cập nhật (nhờ invalidate)
- [ ] Mở hai cửa sổ, sửa ở cửa sổ A → cửa sổ B tự cập nhật (nhờ broadcast)
- [ ] Sửa cùng một bản ghi ở hai nơi → nhận `CONFLICT`, **không** âm thầm ghi đè
- [ ] Danh sách 3.000 giáo dân cuộn mượt
- [ ] Bấm nút Lưu hai lần thật nhanh → chỉ tạo **một** bản ghi
- [ ] **Không có dữ liệu server nào bị copy vào Zustand**
- [ ] Không component nào gọi `window.api` hoặc `useQuery` trực tiếp
- [ ] Không có mảng query key nào viết trực tiếp trong component
- [ ] Bảng invalidate ở `state-management.md` §3.1 khớp với thực tế code
- [ ] `npm run lint` + `npm run format:check` sạch, test pass

---

## Cạm bẫy của phase này

| Cạm bẫy                                       | Hệ quả                                                          |
| --------------------------------------------- | --------------------------------------------------------------- |
| Lọc danh sách ở Renderer thay vì SQL          | Phải tải hết vài nghìn bản ghi về mới lọc được                  |
| Quên `disabled={mutation.isPending}`          | Người dùng bấm hai lần → hai bản ghi trùng                      |
| Chuyển hộ mà invalidate thiếu key             | Hộ cũ vẫn hiện người đã chuyển đi                               |
| Ghi đè cache bằng payload của broadcast event | Mất trường, dữ liệu lệch                                        |
| Quên cleanup listener                         | Sau vài lần hot-reload, một thao tác invalidate hàng chục lần   |
| Sắp xếp theo `fullName` mặc định              | Sai với cách sắp tên tiếng Việt — phải theo `givenName`         |
| Truyền object `Date` qua IPC                  | Structured Clone làm mất múi giờ mong đợi; quy ước là **chuỗi** |
| Bỏ qua cảnh báo "hộ không có chủ hộ"          | Dữ liệu trôi dần, tới lúc in danh sách mới phát hiện            |

---

## Docs phải cập nhật trong phase này

| Thay đổi                              | File                                           |
| ------------------------------------- | ---------------------------------------------- |
| Quan hệ dữ liệu mới → dòng invalidate | `docs/03-frontend/state-management.md` §3.1    |
| Màn hình / route mới                  | `docs/03-frontend/ui-structure.md` §3          |
| Kênh IPC mới                          | `docs/01-architecture/ipc-communication.md` §5 |
| Thuật ngữ nghiệp vụ mới               | `project/glossary.md` §2                       |

**Xong → [phase-5-experience.md](./phase-5-experience.md)**
