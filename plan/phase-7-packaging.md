# Phase 7 — Đóng gói & Phát hành

> **Mục tiêu**: Bộ cài Windows chạy được trên máy sạch của văn phòng giáo xứ.
>
> **Ước lượng**: 2–3 ngày · **Tiền đề**: Phase 6 đạt đủ Definition of Done

**Đọc trước**: `docs/01-architecture/project-structure.md` §6, §8, §10, §11; `docs/01-architecture/security.md` §7.

> Nếu đã làm **2.1b** (build thử từ Phase 2) thì phase này nhẹ nhàng.
> Nếu bỏ qua, đây là nơi 10 cạm bẫy đóng gói ập đến cùng lúc.

---

## 7.0 — Chốt Q04 (mã hoá DB) — LÀM TRƯỚC MỌI VIỆC KHÁC

> **Quyết định một chiều.** Chuyển DB đã phát hành sang SQLCipher đòi hỏi giải mã–mã hoá lại
> dữ liệu của mọi người dùng, **không có đường lui** (`security.md` §5).
> Phải chốt **trước khi phát hành bản đầu tiên**.

Đầu vào để quyết định:

| Yếu tố                    | Ghi chú                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Dữ liệu là gì             | Tôn giáo + quan hệ gia đình + địa chỉ + số điện thoại — dữ liệu cá nhân nhạy cảm                                       |
| Ai dùng máy               | Nếu chỉ một người dưới một tài khoản Windows → OS đã bảo vệ đủ                                                         |
| Khuyến nghị của docs      | **Mặc định KHÔNG mã hoá.** Chống mất máy thì giải pháp đúng là **BitLocker** (mã hoá cả ổ), không phải mã hoá một file |
| Khi nào mới cần SQLCipher | Chỉ khi người dùng **khác** trên **cùng máy** tuyệt đối không được xem                                                 |

**Đây là quyết định của người dùng, agent không được tự chốt** (`agent-rules.md` §9).
Chốt xong → ghi vào `project/decisions.md` + xoá khỏi bảng "Quyết định còn bỏ ngỏ" của `CLAUDE.md`
(theo Công thức 8).

---

## 7.1 — `backend/electron-builder.yml`

Hoàn thiện từ cấu hình tối thiểu của 2.1b:

| Khoá                 | Giá trị                                                 | Sai thì sao                              |
| -------------------- | ------------------------------------------------------- | ---------------------------------------- |
| `files`              | `out/**`, `renderer/**`, `package.json`                 | Thiếu `renderer/**` → **màn hình trắng** |
| `asarUnpack`         | `"**/*.node"`                                           | Crash: _Cannot find module …node_        |
| `directories.output` | `release`                                               |                                          |
| `productName`        | Tên hiển thị của app                                    |                                          |
| `appId`              | Định danh ngược (`com.<tổ chức>.<app>`)                 |                                          |
| `nsis.oneClick`      | `false` — cho người dùng chọn thư mục cài               |                                          |
| `nsis.perMachine`    | Cân nhắc — máy văn phòng dùng chung thì `true` tiện hơn |                                          |

---

## 7.2 — Bộ icon

Icon đa kích thước trong `backend/resources/`. Windows cần `.ico` chứa nhiều độ phân giải
(16/32/48/256).

---

## 7.3 — Build bộ cài NSIS (Windows x64)

```
1. cd frontend && vite build           → backend/renderer/
2. cd backend  && electron-vite build  → backend/out/
3. (bỏ qua — native module là Node-API, npmRebuild: false)
4. electron-builder --win              → backend/release/*.exe
```

---

## 7.4 — Rà lại 10 cạm bẫy

Đối chiếu `project-structure.md` §6 và §9. Bảng kiểm nhanh:

- [ ] `base: './'` ở `vite.config.js` — không thì màn hình trắng
- [ ] `files` có `renderer/**`
- [ ] `asarUnpack: ["**/*.node"]`
- [ ] `electron` nằm ở `devDependencies`, **không** ở `dependencies`
- [ ] `better-sqlite3` nằm ở `dependencies`
- [ ] `npmRebuild: false` có trong `electron-builder.yml`, và bản đóng gói vẫn mở được SQLite
- [ ] Preload bundle thành **một file**, đường dẫn truyền vào `BrowserWindow` là **tuyệt đối**
- [ ] Dữ liệu ghi vào `app.getPath('userData')`, **không** ghi cạnh `.exe`
- [ ] Phân biệt môi trường bằng `app.isPackaged`, **không** `process.env.NODE_ENV`
- [ ] Không có biến `VITE_*` nào chứa bí mật — **giá trị bị nhúng nguyên văn vào bundle**

---

## 7.5 — CSP production

Bật chuỗi CSP production đã viết sẵn từ Phase 1 (`security.js`):

```
default-src 'self'; không unsafe-eval; không unsafe-inline; không nguồn từ xa
```

> **Sau khi bật, mở DevTools của bản đóng gói ít nhất một lần.**
> CSP chặn tài nguyên **im lặng** — giao diện vỡ mà không báo lỗi.

---

## 7.6 — Kiểm thử trên máy sạch

Theo checklist `project-structure.md` §11 — **chạy trên máy Windows chưa cài Node.js**:

- [ ] Cài được, mở app không màn hình trắng
- [ ] `window.api` tồn tại
- [ ] Tạo/đọc dữ liệu SQLite thành công (native module nạp được)
- [ ] File DB nằm trong `%APPDATA%`, **không** cạnh `.exe`
- [ ] Tắt mở lại — dữ liệu còn nguyên
- [ ] **Cài đè bản mới lên bản cũ — migration chạy đúng, dữ liệu không mất**
- [ ] Gỡ cài đặt — **dữ liệu người dùng vẫn còn** (hoặc có hỏi trước)
- [ ] Bản production **không mở được DevTools**
- [ ] Kích thước file cài **70–120MB** (vượt 250MB → `electron` nằm nhầm ở `dependencies`)

> Kịch bản "cài đè bản mới" là quan trọng nhất. Máy giáo xứ sẽ cập nhật nhiều lần trong
> nhiều năm; mỗi lần đều phải chạy migration đúng trên dữ liệu thật.

---

## 7.7 — Auto-update

`electron-updater` — đặt ở **`dependencies`** (runtime thật, không bundle được).

> **Cần quyết định**: máy văn phòng giáo xứ có mạng ổn định không? Nếu không, auto-update
> vô dụng và nên bỏ, thay bằng quy trình cài đè thủ công đã kiểm chứng ở 7.6.
> Hỏi trước khi làm.

Nếu làm: phát `event:update-status` (`{ status, version?, percent? }`) đã khai báo từ Phase 1.

---

## 7.8 — Ký số ứng dụng _(Q05)_

> **Quyết định còn bỏ ngỏ Q05** — chốt trước phase này (`project/decisions.md` §2).

Không có chứng chỉ → Windows SmartScreen sẽ cảnh báo khi cài. Với người dùng ở văn phòng
giáo xứ, cảnh báo này đủ để họ không dám cài.

Nếu không mua chứng chỉ → phải viết rõ trong hướng dẫn cài đặt cách bỏ qua cảnh báo.

---

## 7.9 — Hướng dẫn cài đặt và ghi chú phát hành

| Tài liệu          | Nội dung                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Hướng dẫn cài đặt | Từng bước có ảnh · cách xử lý cảnh báo SmartScreen · **vị trí thư mục dữ liệu**                              |
| Hướng dẫn sao lưu | Cách sao lưu thủ công, cách chép file backup ra USB — **quan trọng nhất với người dùng không rành máy tính** |
| Ghi chú phát hành | Tính năng, sửa lỗi                                                                                           |

> Viết bằng **tiếng Việt, cho người không rành máy tính**. Đây là tài liệu người dùng thật sẽ đọc.

---

## Definition of Done

- [ ] **Q04 (mã hoá DB) đã chốt và ghi vào `project/decisions.md`**
- [ ] Bộ cài chạy trên máy Windows sạch, mở app thành công
- [ ] Dữ liệu lưu đúng thư mục `AppData`, không lưu cạnh file exe
- [ ] Gỡ cài đặt **không** xoá dữ liệu người dùng (hoặc có hỏi trước)
- [ ] **Cài đè bản mới lên bản cũ — dữ liệu và migration chạy đúng**
- [ ] Bản production **không mở DevTools**, không còn log debug
- [ ] CSP production đã bật và đã kiểm chứng bằng DevTools của bản đóng gói
- [ ] `npm audit` đã chạy và đã xem xét (`security.md` §3)
- [ ] `package-lock.json` của **cả hai** package đã commit
- [ ] Kích thước file cài 70–120MB
- [ ] Hướng dẫn cài đặt + hướng dẫn sao lưu đã viết bằng tiếng Việt

---

## Cạm bẫy của phase này

| Cạm bẫy                                              | Hệ quả                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| Bỏ qua 2.1b, để tới đây mới build lần đầu            | Mọi lỗi đóng gói ập đến cùng lúc, khó khoanh vùng            |
| `electron` ở `dependencies`                          | File cài phình lên hơn 250MB                                 |
| Thiếu `asarUnpack`                                   | App crash ngay lúc mở: _Cannot find module …node_            |
| Bật CSP production mà không mở DevTools bản đóng gói | Giao diện vỡ im lặng, không có lỗi nào hiện ra               |
| Không test kịch bản "cài đè bản mới"                 | Bản cập nhật đầu tiên làm mất dữ liệu giáo xứ                |
| Chốt Q04 sau khi đã phát hành                        | **Không có đường lui** — phải mã hoá lại dữ liệu của mọi máy |

---

## Docs phải cập nhật trong phase này

| Thay đổi                                | File                                           |
| --------------------------------------- | ---------------------------------------------- |
| Chốt Q04, Q05                           | `project/decisions.md` + `CLAUDE.md`           |
| Cấu hình `electron-builder.yml` thực tế | `docs/01-architecture/project-structure.md` §6 |
| Checklist bảo mật Phase 7 đã tick       | `docs/01-architecture/security.md` §7          |

**Xong → [phase-8-extensions.md](./phase-8-extensions.md)**
