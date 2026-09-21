# Nhật ký quyết định — Elecrusion

> **Luật gốc**: `docs/00-meta/decisions-baseline.md` — 18 quyết định mặc định của template,
> 5 câu hỏi khởi đầu, thang đánh giá mức đảo ngược, mẫu ghi quyết định.
> File này chỉ chứa **quyết định riêng của dự án này**.

> **Luật**:
>
> - Chốt một quyết định mới → thêm một dòng vào đây **ngay**.
> - Muốn đổi một quyết định đã chốt → **không tự đổi**. Ghi đề xuất vào §4, hỏi, rồi mới đổi.
> - Quyết định bị thay thế thì đánh dấu `Đã thay thế`, **không xoá dòng cũ**.

---

## 1. Kế thừa từ template

| Hạng mục     | Giá trị                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| Bản template | `docs/TEMPLATE_VERSION`                                                    |
| Trạng thái   | **Kế thừa toàn bộ D01–D18** của `decisions-baseline.md` §1, không sai lệch |

Sai lệch khỏi baseline (nếu có) ghi ở đây:

| #   | Quyết định baseline    | Dự án này làm khác | Lý do                                                                                                                                                 |
| --- | ---------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D09 | JavaScript ESM + JSDoc | TypeScript ESM     | CRUD gồm nhiều thực thể, hợp đồng IPC và dữ liệu liên kết; kiểm tra kiểu tĩnh giảm lỗi khi đổi dữ liệu xuyên frontend, preload, backend và `shared/`. |

---

## 2. Năm câu hỏi khởi đầu

| #   | Câu hỏi                 | Trả lời                                                    | Ngày       | Trạng thái   |
| --- | ----------------------- | ---------------------------------------------------------- | ---------- | ------------ |
| Q01 | **Domain nghiệp vụ**    | **Quản lý giáo dân giáo xứ** — nguồn đặc tả `diagrams.jpg` | 2026-09-12 | **Hiệu lực** |
| Q02 | Chuyển sang TypeScript? | Dùng TypeScript ESM thay cho JavaScript + JSDoc            | 2026-09-14 | Đã chốt      |
| Q03 | Đa ngôn ngữ (i18n)?     | Chỉ tiếng Việt, không thêm i18n — người dùng chốt          | 2026-09-13 | Đã chốt      |
| Q04 | Mã hoá database?        | Dùng SQLCipher, triển khai đầu Phase 7. **Một chiều**      | 2026-09-21 | Đã chốt      |
| Q05 | Chứng chỉ ký số?        | _(chưa)_ — hạn chót trước Phase 7                          |            | Bỏ ngỏ       |

> **Q01 đã đóng đúng quy trình ngày 2026-09-12.** Chín bước cập nhật docs ở
> `plan/00-domain-lock-in.md` §8 đã chạy xong: `database-schema.md`, `ipc-channels.md`,
> `screen-map.md`, `invalidate-rules.md`, `glossary.md`, `roadmap.md` §3 đã có nội dung,
> và `CLAUDE.md` không còn liệt kê Q01 ở bảng bỏ ngỏ. Phase 0 được phép bắt đầu.

---

## 3. Quyết định riêng của dự án

| #   | Ngày       | Quyết định                                                                                                                                                                                          | Lý do cốt lõi                                                                                                                                                                                                                                                                                                                                                                   | Đảo ngược được?                                                                                   | Trạng thái |
| --- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------- |
| P01 | 2026-09-12 | Bí tích lưu bằng **5 cột ngày phẳng** trên bảng người, không tách bảng riêng                                                                                                                        | Phạm vi là danh bạ, không phải sổ bộ. Chấp nhận **không in được chứng thư**                                                                                                                                                                                                                                                                                                     | Khó — phải rebuild bảng, xem `plan/phase-8-extensions.md` §2                                      | Hiệu lực   |
| P02 | 2026-09-12 | Giáo họ gắn vào **gia đình**, không gắn trực tiếp vào người                                                                                                                                         | Diagram gốc có cả hai đường → hai nguồn sự thật, mâu thuẫn được                                                                                                                                                                                                                                                                                                                 | Trung bình                                                                                        | Hiệu lực   |
| P03 | 2026-09-12 | Tên người lưu **`full_name` + `given_name`** + cột ASCII bỏ dấu, không tách first/last                                                                                                              | Tên tiếng Việt là Họ + Đệm + Tên; danh sách sắp theo **tên gọi** chứ không theo họ                                                                                                                                                                                                                                                                                              | Trung bình                                                                                        | Hiệu lực   |
| P04 | 2026-09-12 | Quan hệ người–hộ giữ **lịch sử** (`from_date`/`to_date`), đúng 1 hộ hiện hành                                                                                                                       | Ghi được việc chuyển hộ khi lấy chồng, chuyển xứ                                                                                                                                                                                                                                                                                                                                | Trung bình                                                                                        | Hiệu lực   |
| P05 | 2026-09-12 | Bảng nối đặt tên **`family_members`**, có đủ 4 cột audit và `id` riêng                                                                                                                              | Là thực thể có thuộc tính và vòng đời riêng, không phải bảng nối thuần                                                                                                                                                                                                                                                                                                          | Dễ                                                                                                | Hiệu lực   |
| P06 | 2026-09-12 | Tài liệu tách **`docs/` (template) ↔ `project/` (nghiệp vụ)**                                                                                                                                       | Để dùng lại xương sống cho dự án Electron+SQLite sau. Ranh giới vật lý thay cho quy ước bằng lời                                                                                                                                                                                                                                                                                | Dễ                                                                                                | Hiệu lực   |
| P07 | 2026-09-12 | **ESLint 8.57.1** + `.eslintrc` (không dùng ESLint 9 flat config)                                                                                                                                   | Làm đúng `plan/phase-0-bootstrap.md` §0.9 và `coding-standards.md` §7 — hai file đều mô tả bằng `overrides`, cú pháp của ESLint 8. Không phát sinh ngoại lệ so với docs                                                                                                                                                                                                         | Trung bình — nâng lên 9 phải viết lại toàn bộ cấu hình                                            | Hiệu lực   |
| P08 | 2026-09-12 | **Node 22 LTS** + ghim cứng **`electron` 44.3.0**, **`better-sqlite3` 13.0.3**                                                                                                                      | Electron 40+ và better-sqlite3 13 đều yêu cầu Node ≥ 22.12. Ở lại Node 20 sẽ buộc dùng Electron 39 — **ngoài vòng hỗ trợ bảo mật** (chỉ 3 major mới nhất được vá), trái `security.md` §3                                                                                                                                                                                        | Trung bình — đổi Electron phải build lại native module                                            | Hiệu lực   |
| P09 | 2026-09-12 | **Vite 7.3.6** cho cả `frontend/` và `backend/`, không dùng Vite 8                                                                                                                                  | `electron-vite` 5.0.0 khai báo peer `vite ^5 \|\| ^6 \|\| ^7` — chưa hỗ trợ Vite 8. Để hai package cùng một major cho khỏi lệch                                                                                                                                                                                                                                                 | Dễ — nâng khi electron-vite hỗ trợ                                                                | Hiệu lực   |
| P10 | 2026-09-12 | Preload build ra **CommonJS `out/preload.cjs`**, Main giữ ESM `out/main.js`                                                                                                                         | `sandbox: true` bắt buộc preload là CJS — Electron không nạp được preload ESM trong sandbox. Main vẫn ESM theo `CLAUDE.md`. **Đã đưa lên template 1.3.0** (`project-structure.md` §6), từ nay là luật chung                                                                                                                                                                     | Dễ                                                                                                | Hiệu lực   |
| P11 | 2026-09-12 | Test runner là **`node:test`** có sẵn trong Node 22, không thêm dependency                                                                                                                          | Phase 2 chỉ cần test Service và Repository — cả hai chạy được bằng Node thuần. Không đáng kéo thêm một runner chỉ để làm việc đó                                                                                                                                                                                                                                                | Dễ — chuyển sang Vitest khi cần test component ở Phase 4, cú pháp `describe/it` gần như giống hệt | Hiệu lực   |
| P12 | 2026-09-13 | Whitelist `sortBy` **chỉ gồm cột đã có index**: `zone`/`family` sắp theo `name`; `person` sắp theo `givenName` (mặc định), `fullNameAscii`, `birthDate`. Không cho sắp theo `createdAt`/`updatedAt` | Mỗi cột cho phép sắp xếp là một index phải nuôi. Sáu index cho `createdAt`/`updatedAt` mà chưa màn hình nào cần là trả giá ghi trước, dùng sau. Chi tiết ở [`database-schema.md`](./database-schema.md) §8                                                                                                                                                                      | Dễ — thêm index bằng migration mới rồi mở rộng whitelist                                          | Hiệu lực   |
| P13 | 2026-09-13 | **Bỏ `postinstall: electron-builder install-app-deps`** khỏi `backend/package.json`; `electron-builder.yml` đặt `npmRebuild: false`                                                                 | `better-sqlite3` v13 phát hành binary theo **Node-API**, ABI ổn định qua mọi phiên bản Node và Electron — đã kiểm chứng chạy dưới Electron 44 (ABI 149) không cần build. Giữ `postinstall` chỉ làm `npm install` thoát lỗi trên máy không có Python/VS Build Tools, vì `install-app-deps` không nhận biết Node-API. **Đã đưa lên template 1.5.0** (`project-structure.md` §6.1) | Dễ — đặt lại `postinstall` nếu sau này thêm native module kiểu NAN                                | Hiệu lực   |
| P14 | 2026-09-13 | Bản **dev** ghi vào `userData` riêng: `<appData>/elecrusion-dev`                                                                                                                                    | Không tách thì mọi lần chạy thử và mọi migration dở dang đổ thẳng vào dữ liệu thật của người dùng — cùng máy, cùng thư mục `Roaming/elecrusion`. Bắt buộc theo `plan/phase-2-data-layer.md` §2.2                                                                                                                                                                                | Dễ                                                                                                | Hiệu lực   |
| P15 | 2026-09-13 | Sự kiện `event:person-changed` của thao tác chuyển hộ mang thêm `previousFamilyId`                                                                                                                  | Chuyển hộ chạm **hai** hộ; thiếu hộ cũ thì Renderer không invalidate được danh sách thành viên của hộ nguồn                                                                                                                                                                                                                                                                     | Dễ                                                                                                | Hiệu lực   |
| P16 | 2026-09-13 | Kéo **xuất / nhập toàn bộ file dữ liệu** từ Phase 6 lên **Phase 2**                                                                                                                                 | App dùng chung cho 2–3 người quản lý giáo xứ nên phải mang dữ liệu qua lại ngay, không đợi tới Phase 6. Cơ chế đúng như `storage-strategy.md` §6 đã đặc tả, chỉ làm sớm hơn                                                                                                                                                                                                     | Dễ                                                                                                | Hiệu lực   |
| P17 | 2026-09-13 | Sắp xếp danh sách giáo dân theo cột **`given_name_ascii`** (bỏ dấu), không theo `given_name`                                                                                                        | Collation BINARY của SQLite xếp "Bé" trước "Ánh" — sai bảng chữ cái tiếng Việt. Phát hiện khi chạy thật ở Phase 2. `001_init.sql` **chưa phát hành** nên sửa thẳng, không cần migration `002`                                                                                                                                                                                   | Dễ                                                                                                | Hiệu lực   |
| P18 | 2026-09-13 | **Mỗi người một máy.** Nhập dữ liệu là **thay trọn** — chấp nhận dữ liệu trong file thắng, không gộp — nhưng bắt buộc hiện **bảng đối chiếu** trước khi ghi                                         | Gộp hai bản SQLite tách rời cần theo vết từng thao tác (CRDT hoặc nhật ký đồng bộ), đắt hơn nhiều lần so với toàn bộ Phase 2. Người dùng chọn cách đơn giản và tự quản lý quy trình, đổi lại phải thấy rõ mình sắp mất gì: số bản ghi chỉ có trên máy mình, số bản ghi bản mình mới hơn                                                                                         | Trung bình — muốn gộp thật thì phải thiết kế lại đồng bộ                                          | Hiệu lực   |
| P20 | 2026-09-21 | Lưu và hiển thị `activity_logs` cho Giáo họ, Hộ, Giáo dân và Thành viên hộ                                                                                                                          | Giáo xứ cần xem lịch sử chỉnh sửa; log chẩn đoán không chứa dữ liệu cá nhân không đáp ứng nhu cầu này                                                                                                                                                                                                                                                                           | Trung bình — migration mới, lịch sử cũ không thể tạo lại                                          | Hiệu lực   |

---

## 4. Ngoại lệ so với luật trong `docs/`

**Phase 3 (2026-09-13):** người dùng yêu cầu làm trực tiếp trên `develop`, không dùng
worktree; tuyệt đối không tự commit hoặc push. Được thêm React Router, TanStack Query,
Zustand và bộ test Vitest + React Testing Library + user-event + jsdom.

> `agent-rules.md` §2: _"Bỏ qua một luật trong docs vì trường hợp đặc biệt — ngoại lệ phải được
> ghi nhận, không được im lặng."_

| Luật bị lệch                           | Ở đâu                             | Dự án này làm gì                                                      | Lý do                                                                                                                                                                                               |
| -------------------------------------- | --------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bảng nối N–N đặt tên `<bảng1>_<bảng2>` | `database-conventions.md` §1.1    | Đặt `family_members`                                                  | Là thực thể, không phải bảng nối thuần (P05)                                                                                                                                                        |
| Bảng nối xoá cứng, không có cột audit  | `database-conventions.md` §1.5    | Có đủ 4 cột audit                                                     | Cần `updated_at` cho `expectedUpdatedAt`, cần `deleted_at` cho thùng rác                                                                                                                            |
| Bảng nối dùng khoá chính kép           | `database-conventions.md` §1.1    | Dùng `id` riêng                                                       | Một người có thể vào–ra cùng một hộ nhiều lần                                                                                                                                                       |
| Migration quét thư mục `migrations/`   | `storage-strategy.md` §5.3        | Danh mục tường minh ở `db/migrations/index.js`, nhúng SQL bằng `?raw` | Bản đóng gói chỉ ship `out/**`, không ship `src/` — quét thư mục lúc chạy sẽ không thấy file nào. Mọi luật khác giữ nguyên: đánh số tăng dần, mỗi file một transaction, file đã phát hành không sửa |
| Test Service dùng mock Repository      | `plan/phase-2-data-layer.md` §2.9 | Test Service chạy trên SQLite `:memory:` với schema thật              | Các quy tắc cần kiểm — đúng một hộ hiện hành, rollback giữa chừng, xoá mềm kéo theo — không tách rời được khỏi ràng buộc và transaction của DB. Mock sẽ kiểm chứng một thứ khác với thứ chạy thật   |
| Luôn backup trước khi migrate          | `storage-strategy.md` §5.1        | Bỏ qua backup khi `user_version = 0`                                  | DB rỗng vừa được tạo thì không có gì để mất. Tránh sinh file rác ngay lần chạy đầu                                                                                                                  |
| Service chỉ được gọi xuống Repository  | `CLAUDE.md` → chiều phụ thuộc     | `backup.service.js` gọi thẳng `db/transfer.js` và `db/migrator.js`    | Đối tượng thao tác là **chính file cơ sở dữ liệu**, không phải một thực thể nghiệp vụ — không có Repository nào để đi qua. Cùng lý do với `db/bootstrap.js` được `main/` gọi trực tiếp              |

---

## 5. Đề xuất thay đổi (chờ quyết định)

| #   | Muốn đổi    | Lý do đề xuất | Chi phí ước tính | Trạng thái |
| --- | ----------- | ------------- | ---------------- | ---------- |
| —   | _(chưa có)_ |               |                  |            |

## 5.1. Ngôn ngữ giao diện desktop

**Quyết định P19 (2026-09-15):** giao diện của ứng dụng ưu tiên ngôn ngữ thiết kế Windows
desktop, không mô phỏng landing page hay biểu mẫu web. Áp dụng khi tạo mới hoặc sửa component
Renderer Process:

- Dùng font hệ thống `Segoe UI Variable`/`Segoe UI`, không thêm web font hoặc phong cách marketing.
- Modal có title bar cao 44px, nút đóng dạng biểu tượng, nội dung cuộn độc lập; không dùng header
  lớn hay nút “Đóng” dạng pill. Hộp xác nhận đặt các lệnh theo hàng ở cuối, căn phải.
- Modal và context menu là bề mặt phẳng: viền mảnh, bo góc tối đa 4px, bóng vừa đủ tách khỏi nền.
  Không lồng card trong card; nhóm trường dùng tiêu đề và separator thay cho khung bo góc độc lập.
- Input, select và date input dùng control cao 32–34px, viền tương phản, bo góc 4px. Khi focus,
  dùng viền/focus ring theo `--color-border-focus`; không dùng shadow lớn, pill, hoặc hiệu ứng web.
- Nút hành động chính của form dùng `variant="primary"`, đặt cuối form và căn phải. Nút phụ là
  secondary; thao tác phá huỷ giữ màu `danger` và được tách rõ khỏi lệnh thông thường.
- Hover chỉ đổi nền và viền qua token trạng thái, không dùng `filter`. Control disabled phải chuyển
  về nền trung tính, chữ muted và viền mặc định; không làm mờ action đang mang màu nhấn.
- Mọi giá trị màu, kích thước, khoảng cách và shadow lấy từ token trong
  `frontend/src/styles/tokens.css`, bao gồm token control và modal mới thêm.

## 6. Chi tiết triển khai Phase 3 — 2026-09-13

- `react-router-dom` **6.30.6**: HashRouter, tương thích React 18; `@tanstack/react-query`
  **5.102.8**: cache và mutation; `zustand` **5.0.15**: trạng thái giao diện. Phiên bản
  xác nhận từ registry và ghim cứng trong package.json/package-lock.json.
- Test frontend: `vitest` **5.0.0**, `@testing-library/react` **16.3.3**,
  `@testing-library/user-event` **14.6.7**, `jsdom` **30.0.1** (devDependency đã được duyệt).
  Backend giữ `node:test`, không đổi runner.
- Tự quyết: Modal/Drawer dùng `<dialog>.showModal()` có sẵn trong Chromium, không thêm
  thư viện focus; VirtualList dùng chiều cao hàng cố định lấy từ design token.
- `setting:getAll`/`setting:set` có trong đặc tả nhưng chưa được triển khai ở Phase 2.
  Hoàn thiện phần này để đáp ứng §3.7, không sửa schema và không đổ dữ liệu CRUD vào Phase 3.
- Theme/density thật nằm trong Query cache. Zustand chỉ giữ lựa chọn tạm trong lúc ghi;
  localStorage chỉ cache theme đã đọc từ SQLite. Điều này giữ luật không sao chép server state.
- Token dùng palette xanh lá trầm, font hệ thống; danh mục và giá trị cụ thể ở
  `frontend/src/styles/tokens.css`. Người dùng duyệt cập nhật template ngày 2026-09-13:
  bổ sung nhóm token dùng chung tại `ui-structure.md` §5.1a, tăng phiên bản 1.8.0 và ghi
  CHANGELOG. Đã sửa tại `D:/projects/template/docs` rồi đồng bộ về dự án; kích thước
  và palette cụ thể vẫn thuộc Elecrusion.
- Menu Electron mặc định được bỏ ở cửa sổ chính để không có mục menu tiếng Anh.
- Phím tắt nghiệp vụ và Command Palette vẫn thuộc Phase 5; Phase 3 dựng Ctrl+F,
  Ctrl+B, Ctrl+, và Esc của dialog.
