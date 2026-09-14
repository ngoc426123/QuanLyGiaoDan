# Khung lộ trình phát triển

> File này là **template** — khung 9 phase, Definition of Done và sổ tay rủi ro đúng với mọi
> dự án Electron + SQLite cục bộ.
> Danh sách việc riêng của dự án nằm ở `project/roadmap.md`; kế hoạch thi công chi tiết ở `plan/`.

> **Nguyên tắc xuyên suốt**: Mỗi phase kết thúc bằng một sản phẩm **chạy được**, không phải một đống code dở dang.
> Nguyên tắc thứ hai: **dựng đường ray trước, chở hàng sau** — hạ tầng (IPC, DB, migration, đóng gói) phải vững trước khi đổ tính năng vào, vì sửa hạ tầng lúc đã có 20 màn hình đắt hơn nhiều lần.

---

## 1. Tổng quan các giai đoạn

| Phase | Tên | Mục tiêu | Ước lượng |
|---|---|---|---|
| **0** | Khởi tạo & Hạ tầng | Chạy được cửa sổ trắng có hot reload | 1–2 ngày |
| **1** | Xương sống IPC | Một kênh IPC hoạt động đầu-cuối | 1–2 ngày |
| **2** | Tầng dữ liệu | SQLite + migration + Repository chạy thật | 2–3 ngày |
| **3** | Bộ khung giao diện | App Shell, routing, design tokens, theme | 2–3 ngày |
| **4** | Nghiệp vụ lõi (CRUD) | Hoàn chỉnh vòng đời của thực thể chính | 4–6 ngày |
| **5** | Hoàn thiện trải nghiệm | Tìm kiếm, phím tắt, kéo-thả, thùng rác | 3–5 ngày |
| **6** | Độ tin cậy | Backup, log, xử lý lỗi, kiểm thử | 2–3 ngày |
| **7** | Đóng gói & Phát hành | Bộ cài Windows, auto-update | 2–3 ngày |
| **8** | Mở rộng | Đa cửa sổ, xuất/nhập dữ liệu, đa ngôn ngữ | Về sau |

> Ước lượng dành cho **một người làm toàn thời gian**. Điều chỉnh theo thực tế.

---

## 2. Chi tiết từng giai đoạn

> Phase 0–3, 6, 7 gần như **không phụ thuộc domain** — làm theo đúng danh sách dưới.
> Phase 4–5 là nơi đổ nghiệp vụ vào: danh sách dưới chỉ là **khung**, việc thật ghi ở
> `project/roadmap.md`. Ước lượng cũng cần điều chỉnh theo số thực thể của domain.

### Phase 0 — Khởi tạo & Hạ tầng

**Mục tiêu**: Có một cửa sổ Electron mở lên, hiển thị trang React, sửa code thấy đổi ngay.

> **Đọc trước**: [project-structure.md](../01-architecture/project-structure.md) — toàn bộ phase này là làm theo tài liệu đó.

| # | Công việc |
|---|---|
| 0.1 | Dựng 3 thư mục: `frontend/`, `backend/`, `shared/` + `package.json` gốc làm task runner |
| 0.2 | `frontend/package.json`: React + Vite. `vite.config.js` với `base: './'`, `outDir: '../backend/renderer'`, alias `@shared`, `server.fs.allow: ['..']` |
| 0.3 | `backend/package.json`: **`electron` ở `devDependencies`** (xem cạm bẫy số 1), electron-vite, electron-builder |
| 0.4 | `electron.vite.config.js`: build `main` + `preload` (preload bundle thành **một file CommonJS** — `sandbox: true` không nạp được preload ESM), alias `@shared` |
| 0.5 | Viết `backend/src/main/index.js` tối thiểu: tạo `BrowserWindow` với **đầy đủ cấu hình bảo mật** ở [overview.md §3](../01-architecture/overview.md) |
| 0.6 | Main phân nhánh dev/prod: dev thì `loadURL(VITE_DEV_SERVER_URL)`, prod thì `loadFile('../renderer/index.html')` |
| 0.7 | Preload rỗng, chỉ expose `window.api.app.getVersion()` để kiểm chứng cầu nối |
| 0.8 | Script gốc `npm run dev`: dùng `concurrently` + `wait-on` chờ cổng 5173 rồi mới mở Electron bằng `electron-vite dev --watch` (thiếu `--watch` thì sửa Main không restart) |
| 0.9 | Cấu hình ESLint + Prettier **một bộ duy nhất ở gốc repo** (xem ghi chú dưới) + `.gitattributes` (`eol=lf`) + `.gitignore` (`out/`, `renderer/`, `release/`, `dist/`) |
| 0.10 | **Cưỡng chế luật bằng máy**, không chỉ bằng văn bản — xem mục 3 bên dưới |

> **Vì sao ESLint phải là một bộ ở gốc, không phải mỗi package một bộ**: `shared/` không thuộc package nào, nên cấu hình đặt trong `frontend/` hay `backend/` đều không với tới nó — vùng duy nhất cả hai bên cùng dùng lại là vùng không ai lint. Ngoài ra luật ranh giới ở [coding-standards.md §7](./coding-standards.md) được mô tả bằng `overrides` theo **đường dẫn**, mà đường dẫn thì phải nhìn thấy đồng thời cả ba vùng mới khớp được.
>
> Hệ quả: `eslint` và `prettier` nằm ở `devDependencies` của `package.json` gốc. Chúng là công cụ, không bao giờ bị đóng gói vào app.

### Phase 0 — Luật nào phải để máy cưỡng chế

Luật chỉ nằm trong docs sẽ bị vi phạm im lặng. Luật nằm trong ESLint thì báo đỏ ngay. Cấu hình ngay từ Phase 0:

| Luật | Cách cưỡng chế |
|---|---|
| Ranh giới FE/BE, cấm import chéo | `no-restricted-imports` theo `overrides` — bảng đầy đủ ở [coding-standards.md §7](./coding-standards.md) |
| `services/` không import `electron`; `repositories/` không import `services/` | cùng cơ chế trên |
| Cấm nối chuỗi SQL | `no-restricted-syntax` chặn template literal chứa `SELECT`/`INSERT`/`UPDATE`/`DELETE` |
| Cấm `console.log` ở Backend | `no-console: error` |
| Cấm import vòng | `import/no-cycle` |
| Cấm component lồng nhau, thiếu `key`, `<div onClick>` | `react/no-unstable-nested-components`, `react/jsx-key`, `jsx-a11y/*` |
| Cấm `require`/`process`/`__dirname` ở Renderer | `no-restricted-globals` |
| Format | Prettier + Format on Save |

**Luật KHÔNG cưỡng chế được bằng lint** — phải tự kiểm trong review, đã có trong checklist PR:

- Mọi truy vấn đọc có `WHERE deleted_at IS NULL`
- Mọi kênh `*:update` nhận `expectedUpdatedAt`
- Mutation invalidate đủ query key
- Màn hình xử lý đủ 5 trạng thái
- Không hardcode giá trị thiết kế (có thể chặn một phần bằng `stylelint`)

**Definition of Done**
- [ ] `npm run dev` ở gốc mở được cửa sổ, hiển thị phiên bản app lấy qua `window.api`
- [ ] Sửa file React → giao diện cập nhật không cần khởi động lại
- [ ] Sửa file Main → tiến trình tự khởi động lại
- [ ] Import được hằng số từ `@shared` ở **cả hai** bên mà không lỗi
- [ ] DevTools console **không có lỗi và không có cảnh báo bảo mật của Electron**
- [ ] `window.require` trong DevTools trả về `undefined`
- [ ] `npm run lint` sạch ở cả hai package
- [ ] **Thử vi phạm có chủ đích để xác nhận lint bắt được**: import `fs` trong một file `frontend/src/`, import `electron` trong một file `services/` — cả hai phải báo lỗi. Xoá dòng thử sau khi xác nhận

**Rủi ro**: Cấu hình build là điểm vướng phổ biến nhất với người mới. Dành đủ thời gian, đừng vội bỏ qua bằng cách hạ `contextIsolation` xuống `false`. Nếu dev báo *"outside of Vite serving allow list"* → thiếu `server.fs.allow`.

---

### Phase 1 — Xương sống IPC

**Mục tiêu**: Chứng minh toàn bộ đường ống Renderer → Preload → Main → Service → về lại Renderer hoạt động đúng, **trước khi** có database.

| # | Công việc |
|---|---|
| 1.1 | Viết `shared/channels.js` — khai báo hằng số tên kênh |
| 1.2 | Viết `shared/errors.js` — lớp `AppError` và bảng mã lỗi |
| 1.3 | Viết hàm dựng envelope `{ ok, data }` / `{ ok, error }` dùng chung |
| 1.4 | Viết bộ đăng ký handler `main/ipc/index.js` |
| 1.5 | Cài Zod, viết schema mẫu, ghép validation vào handler |
| 1.6 | Hoàn thiện preload theo đúng quy tắc mục 7 của [ipc-communication.md](../01-architecture/ipc-communication.md) |
| 1.7 | Cài đặt nhóm `app:*`: `getVersion`, `getPaths`, `openExternal` (có whitelist giao thức) |
| 1.8 | Cơ chế broadcast event + hàm đăng ký listener có trả về hàm huỷ |
| 1.9 | Viết `security.js`: chặn `will-navigate`, `setWindowOpenHandler`, CSP |

**Definition of Done**
- [ ] Gọi được `window.api.app.getVersion()` và nhận đúng envelope
- [ ] Gửi payload sai schema → nhận đúng `VALIDATION_ERROR` kèm `fieldErrors`
- [ ] Ném lỗi trong Service → Renderer nhận envelope lỗi, **app không sập**
- [ ] Gọi kênh không tồn tại → báo lỗi rõ ràng, không treo vô hạn
- [ ] Thử mở link ngoài → mở bằng trình duyệt hệ thống, không mở trong app
- [ ] Thử `window.require` trong DevTools → phải `undefined`

> **Đây là phase quan trọng nhất của dự án.** Đường ống này sẽ được dùng lại hàng trăm lần. Làm ẩu ở đây thì mọi tính năng sau đều thừa hưởng cái ẩu đó.

---

### Phase 2 — Tầng dữ liệu

**Mục tiêu**: SQLite chạy thật, migration hoạt động, một Repository hoàn chỉnh.

| # | Công việc |
|---|---|
| 2.1 | Cài `better-sqlite3` vào **`dependencies` của `backend/`**, ghim chính xác phiên bản. Đối chiếu [project-structure.md §6.1](../01-architecture/project-structure.md) xem có phải rebuild theo ABI Electron không — nếu gói có `prebuilds/` thì **không** đặt `postinstall`, mà đặt `npmRebuild: false` |
| 2.1b | **Build thử một bản đóng gói ngay** và cài lên máy sạch — xem [project-structure.md §10](../01-architecture/project-structure.md). Lúc này app còn đơn giản, lỗi native module dễ khoanh vùng |
| 2.2 | Viết `db/connection.js`: singleton, đầy đủ pragma ở mục 4 của [storage-strategy.md](../02-backend-data/storage-strategy.md) |
| 2.3 | Viết `db/migrator.js`: đọc `user_version`, chạy migration trong transaction, backup trước khi chạy |
| 2.4 | Viết `migrations/001_init.sql` — toàn bộ bảng ở `project/database-schema.md` |
| 2.5 | Viết seed dữ liệu khởi tạo (idempotent) |
| 2.6 | Viết Repository cho **thực thể chính** — đủ bộ phương thức chuẩn + hàm `toDomain` |
| 2.7 | Viết Service cho thực thể chính, theo quy tắc nghiệp vụ ở `project/database-schema.md` |
| 2.8 | Ghép nhóm kênh của thực thể chính vào IPC |
| 2.9 | Viết test: Repository trên SQLite in-memory, Service với mock |

**Definition of Done**
- [ ] App khởi động lần đầu tạo file DB đúng vị trí, chạy xong migration
- [ ] Khởi động lần hai không chạy lại migration
- [ ] Migration lỗi → hiện dialog, thoát an toàn, **DB cũ còn nguyên**
- [ ] Tạo/đọc/sửa/xoá bản ghi qua IPC thành công, dữ liệu còn sau khi tắt mở lại
- [ ] Xoá bản ghi cha còn bản ghi con → bị chặn đúng như ma trận quyền xoá
- [ ] `PRAGMA foreign_keys` xác nhận đang bật
- [ ] Test Repository và Service pass

---

### Phase 3 — Bộ khung giao diện

**Mục tiêu**: App Shell hoàn chỉnh với điều hướng và theme, dùng dữ liệu giả.

| # | Công việc |
|---|---|
| 3.1 | Viết `styles/tokens.css` — toàn bộ design token ở mục 5.1 của [ui-structure.md](../03-frontend/ui-structure.md) |
| 3.2 | Viết reset CSS + style toàn cục (`html`, `body` overflow hidden) |
| 3.3 | Dựng `AppShell`: Sidebar + TopBar + Content + StatusBar |
| 3.4 | Cấu hình `HashRouter` và toàn bộ route ở bản đồ màn hình |
| 3.5 | Xây bộ UI primitives cơ bản: `Button`, `Input`, `Modal`, `Toast`, `EmptyState`, `ErrorState`, `Spinner`, `Skeleton` |
| 3.6 | Cài TanStack Query + Zustand, viết `shared/invoke.js` và `shared/queryKeys.js` |
| 3.7 | Chuyển đổi theme sáng/tối/theo hệ thống, chống nhấp nháy khi khởi động |
| 3.8 | Lưu và khôi phục trạng thái cửa sổ (`window-state.json`) |
| 3.9 | Error Boundary hai cấp |

**Definition of Done**
- [ ] Điều hướng qua lại giữa các route mượt, sidebar đánh dấu đúng mục đang mở
- [ ] Đổi theme áp dụng tức thì, khởi động lại vẫn nhớ
- [ ] Thu nhỏ cửa sổ về 940×600 — bố cục không vỡ
- [ ] Đóng app rồi mở lại — cửa sổ về đúng vị trí và kích thước cũ
- [ ] Không có giá trị màu/khoảng cách nào hardcode trong component
- [ ] Ném lỗi thử trong một màn hình → Error Boundary bắt được, sidebar vẫn dùng được

---

### Phase 4 — Nghiệp vụ lõi (CRUD)

**Mục tiêu**: Hoàn chỉnh vòng đời của thực thể chính, đủ dùng hằng ngày.

| # | Công việc |
|---|---|
| 4.1 | Feature **thực thể cha** (thứ tự: Repository → Service → IPC → hook → UI sidebar) |
| 4.2 | Feature **thực thể chính**: danh sách, form tạo/sửa, panel chi tiết |
| 4.3 | Đánh dấu hoàn thành (có optimistic update) |
| 4.4 | Xoá mềm + xác nhận trước khi xoá |
| 4.5 | Lọc theo trạng thái, mức ưu tiên, hạn chót; sắp xếp nhiều tiêu chí |
| 4.6 | Phân trang hoặc cuộn vô hạn cho danh sách dài |
| 4.7 | Màn hình "Hôm nay" và "Inbox" |
| 4.8 | Ghép broadcast event vào quy tắc invalidate cache |
| 4.9 | Feature **thực thể phụ** còn lại |

**Definition of Done**
- [ ] Vòng đời trọn vẹn của thực thể chính: tạo / sửa / xoá / thao tác nghiệp vụ riêng
- [ ] Mọi màn hình có đủ 5 trạng thái (loading/empty/error/filtered-empty/success)
- [ ] Lỗi validation hiển thị đúng tại từng trường trong form
- [ ] Sửa dữ liệu ở màn hình này → màn hình khác tự cập nhật (nhờ invalidate)
- [ ] Danh sách 1.000 bản ghi cuộn mượt
- [ ] Không có dữ liệu server nào bị copy vào Zustand

---

### Phase 5 — Hoàn thiện trải nghiệm

**Mục tiêu**: Chuyển từ "dùng được" sang "dùng thích".

| # | Công việc |
|---|---|
| 5.1 | Migration thêm bảng FTS5 + trigger đồng bộ |
| 5.2 | Tìm kiếm toàn văn, hỗ trợ gõ không dấu, làm nổi từ khoá |
| 5.3 | Command Palette (`Ctrl+K`) |
| 5.4 | Toàn bộ phím tắt ở mục 7 của `ui-structure.md`, kèm màn hình tra cứu phím tắt |
| 5.5 | Kéo-thả sắp xếp (nếu domain có khái niệm thứ tự thủ công) |
| 5.6 | Context menu chuột phải |
| 5.7 | Thao tác hàng loạt (chọn nhiều, xoá / đổi thuộc tính cùng lúc) |
| 5.8 | Thùng rác: khôi phục và xoá vĩnh viễn |
| 5.9 | Màn hình Cài đặt đầy đủ |
| 5.10 | Rà soát khả năng tiếp cận: focus ring, `aria-label`, độ tương phản |

**Definition of Done**
- [ ] Gõ không dấu tìm được bản ghi có dấu (ví dụ "nguyen van" → "Nguyễn Văn")
- [ ] Mọi hành động chính làm được bằng bàn phím, không cần chuột
- [ ] Kéo-thả lưu đúng thứ tự, mở lại vẫn giữ nguyên
- [ ] Xoá rồi khôi phục từ thùng rác — dữ liệu trở về nguyên vẹn
- [ ] Kiểm tra độ tương phản đạt 4.5:1 ở cả hai theme

---

### Phase 6 — Độ tin cậy

**Mục tiêu**: Ứng dụng không làm mất dữ liệu, và khi lỗi thì người dùng hiểu chuyện gì xảy ra.

| # | Công việc |
|---|---|
| 6.1 | Hệ thống log ra file, xoay vòng theo ngày, giữ 7 ngày |
| 6.2 | `uncaughtException` / `unhandledRejection` ở Main |
| 6.3 | Backup tự động theo lịch + backup thủ công từ Cài đặt |
| 6.4 | Chức năng khôi phục từ file backup |
| 6.5 | Tác vụ dọn dẹp: xoá bản ghi quá hạn trong thùng rác, xoá file đính kèm mồ côi, `VACUUM` định kỳ |
| 6.6 | Menu Trợ giúp: mở thư mục dữ liệu, mở thư mục log |
| 6.7 | Bổ sung test cho các luồng quan trọng; E2E bằng Playwright cho 3 kịch bản chính |
| 6.8 | Rà soát hiệu năng: `EXPLAIN QUERY PLAN` cho truy vấn nóng, kiểm tra rò rỉ listener |

**Definition of Done**
- [ ] Kill tiến trình giữa lúc ghi dữ liệu → mở lại DB không hỏng (nhờ WAL + transaction)
- [ ] Backup và khôi phục thành công trên dữ liệu thật
- [ ] Mọi lỗi đều để lại dấu vết trong log
- [ ] Không còn rò rỉ listener sau 30 phút thao tác liên tục
- [ ] 3 kịch bản E2E pass

---

### Phase 7 — Đóng gói & Phát hành

> Nếu đã làm mục 2.1b thì phase này nhẹ nhàng. Nếu bỏ qua, đây là nơi 10 cạm bẫy ở [project-structure.md §9](../01-architecture/project-structure.md) ập đến cùng lúc.

| # | Công việc |
|---|---|
| 7.1 | Hoàn thiện `electron-builder.yml`: `files` (gồm `out/**` và `renderer/**`), `asarUnpack: ["**/*.node"]`, `directories.output: release` |
| 7.2 | Chuẩn bị bộ icon đa kích thước |
| 7.3 | Build bộ cài NSIS cho Windows (x64) |
| 7.4 | Rà lại toàn bộ 10 cạm bẫy ở [project-structure.md §9](../01-architecture/project-structure.md) |
| 7.5 | Kiểm thử trên máy sạch chưa cài Node — theo checklist [project-structure.md §11](../01-architecture/project-structure.md) |
| 7.6 | Auto-update (`electron-updater` — đặt ở `dependencies`) |
| 7.7 | Ký số ứng dụng (nếu có chứng chỉ) |
| 7.8 | Viết hướng dẫn cài đặt và ghi chú phát hành |

**Definition of Done**
- [ ] Bộ cài chạy trên máy Windows sạch, mở app thành công
- [ ] Dữ liệu lưu đúng thư mục `AppData`, không lưu cạnh file exe
- [ ] Gỡ cài đặt **không** xoá dữ liệu người dùng (hoặc có hỏi trước)
- [ ] Cài đè bản mới lên bản cũ — dữ liệu và migration chạy đúng
- [ ] Bản production **không mở DevTools**, không còn log debug

---

### Phase 8 — Mở rộng (sau phát hành)

Danh sách ứng viên, ưu tiên theo phản hồi thực tế:

| Hạng mục | Ghi chú |
|---|---|
| Đa cửa sổ | Kiểm chứng cơ chế broadcast event đã dựng từ Phase 1 |
| Xuất/nhập JSON và CSV | Chạy trong `worker_threads` |
| Đa ngôn ngữ (i18n) | Tách chuỗi ra file resource — **nên chuẩn bị cấu trúc từ sớm** |
| Tray icon và khởi động cùng hệ thống | |
| Thông báo hệ thống khi tới hạn | |
| Báo cáo và thống kê thời gian | |
| Chuyển sang TypeScript | Đổi dần từng file, bắt đầu từ `shared/` |
| Đồng bộ giữa nhiều máy | Thay đổi kiến trúc lớn — cần thiết kế lại, không làm tuỳ hứng |

---

## 3. Quy tắc thực thi lộ trình

| Quy tắc | Lý do |
|---|---|
| **Không nhảy phase.** Hạ tầng phải xong trước tính năng | Sửa nền móng khi đã xây 5 tầng thì đắt gấp nhiều lần |
| **Mỗi phase kết thúc phải chạy được**, không để dở dang sang phase sau | Tránh tích luỹ nợ kỹ thuật ngầm |
| **Cập nhật tài liệu ngay trong phase**, không để dồn cuối dự án | Tài liệu viết sau sự thật thì luôn sai |
| **Định nghĩa "xong" bằng checklist**, không bằng cảm tính | "Gần xong" là trạng thái kéo dài vô hạn |
| **Đo trước khi tối ưu** | Tối ưu theo cảm tính thường nhắm sai chỗ |

---

## 4. Sổ tay rủi ro

| Rủi ro | Mức | Cách phòng ngừa |
|---|---|---|
| `better-sqlite3` lỗi biên dịch native khi nâng Electron | Cao | Ghim phiên bản, có script `rebuild`, kiểm thử ngay sau mỗi lần nâng |
| Bản đóng gói không tìm thấy native module | Cao | Cấu hình `asarUnpack` đúng, **kiểm thử bản build từ Phase 2**, không đợi tới Phase 7 |
| Cấu hình Vite + Electron rối | Trung bình | Làm gọn ở Phase 0, không vừa làm tính năng vừa sửa build |
| Rò rỉ listener IPC | Trung bình | Bắt buộc cleanup trong `useEffect`, rà soát định kỳ |
| Phình cấu trúc do thêm tính năng tuỳ hứng | Trung bình | Bám roadmap; ý tưởng mới ghi vào Phase 8, không chen ngang |
| Migration làm hỏng dữ liệu người dùng | **Cao** | Bắt buộc backup trước migration; test migration trên bản sao dữ liệu thật |
| Tài liệu lệch với code | Trung bình | Đưa việc cập nhật `docs/` vào checklist Pull Request |

---

## 5. Thứ tự đọc tài liệu cho người mới tham gia

1. [Tổng quan kiến trúc](../01-architecture/overview.md) — hiểu bức tranh lớn
2. [Cấu trúc repo và Build](../01-architecture/project-structure.md) — hiểu hai package và cách đóng gói
3. [Mô hình bảo mật](../01-architecture/security.md) — hiểu cái gì đáng lo, cái gì không
4. [Quy tắc giao tiếp IPC](../01-architecture/ipc-communication.md) — hiểu cách hai tầng nói chuyện
5. [Chiến lược lưu trữ](../02-backend-data/storage-strategy.md) — hiểu vì sao chọn SQLite
6. [Quy ước cơ sở dữ liệu](../02-backend-data/database-conventions.md) — hiểu hình dạng dữ liệu
7. [Quy tắc tầng Service](../02-backend-data/data-services.md) — hiểu nghiệp vụ nằm ở đâu
8. [Cấu trúc giao diện](../03-frontend/ui-structure.md) — hiểu cách tổ chức UI
9. [Quản lý state](../03-frontend/state-management.md) — hiểu dữ liệu chảy thế nào trên UI
10. [Quy chuẩn code — Phần chung](./coding-standards.md) — bắt buộc với cả hai bên
11. Quy chuẩn riêng theo vai trò:
   - Dev Frontend → [coding-standards-frontend.md](./coding-standards-frontend.md)
   - Dev Backend → [coding-standards-backend.md](./coding-standards-backend.md)
12. Tài liệu này — hiểu đang ở đâu và đi tiếp thế nào
