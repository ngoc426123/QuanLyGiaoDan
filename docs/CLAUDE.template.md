# <Tên dự án> — Ràng buộc dự án

> **Đây là template.** Copy lên gốc repo thành `CLAUDE.md`, rồi điền mọi chỗ `<...>`.
> Xoá dòng này sau khi điền xong.

<Mô tả một câu về ứng dụng.> Ứng dụng desktop Electron. Dữ liệu cục bộ, offline hoàn toàn.
**Trạng thái: <chưa có code / đang ở Phase N>.**

File này chứa ràng buộc **bắt buộc**. Chi tiết tra ở `docs/` (template) và `project/` (nghiệp vụ)
— bảng điều hướng ở cuối.

---

## Ba tầng tài liệu

| Tầng | Ở đâu | Sửa khi nào |
|---|---|---|
| Template | `docs/` | **Chỉ khi luật đó đúng với mọi dự án.** Sửa = phải mang sang dự án khác + tăng `docs/TEMPLATE_VERSION` |
| Nghiệp vụ | `project/` | Bất cứ khi nào domain thay đổi |
| Kế hoạch | `plan/` | Khi điều chỉnh thứ tự thi công |

**Luật ranh giới**: hỏi *"Dự án Electron+SQLite tiếp theo có cần luật này không?"*
Có → `docs/`. Không → `project/`.

---

## Stack đã chốt — không tự đổi

Kế thừa toàn bộ D01–D18 ở `docs/00-meta/decisions-baseline.md` §1.
Sai lệch (nếu có) ghi ở `project/decisions.md` §1.

| Tầng | Lựa chọn |
|---|---|
| Renderer | React 18 + Vite, `HashRouter` (bắt buộc — chạy qua `file://`) |
| Server state | TanStack Query |
| UI state | Zustand |
| Style | CSS Modules + CSS custom property (design token) |
| Main | Node.js ESM, JavaScript + JSDoc |
| DB | SQLite qua `better-sqlite3` |
| Validate | Zod, ở biên IPC phía Main |
| Build | Vite (FE) + electron-vite (BE) + electron-builder |

> Nếu dự án này chọn khác (ví dụ dùng TypeScript ngay từ đầu), sửa bảng trên **và** ghi sai lệch
> vào `project/decisions.md`.

---

## Cấu trúc: hai package độc lập

```
<project>/
├── package.json          task runner (concurrently), không ship
├── CLAUDE.md             file này
├── docs/                 TEMPLATE — copy nguyên xi, không chứa nghiệp vụ
├── project/              NGHIỆP VỤ — riêng dự án này
├── plan/                 KẾ HOẠCH THI CÔNG — riêng dự án này
├── shared/               JS thuần, KHÔNG có package.json — channels.js, errors.js
├── frontend/             package 1 — React. Build ra file tĩnh
└── backend/              package 2 — LÀ ứng dụng Electron (package.json = manifest app)
    └── src/{main,preload,services,repositories,schemas,db}
```

### Luật ranh giới — ESLint cưỡng chế

| Vùng | Cấm import |
|---|---|
| `frontend/src/**` | `electron`, `fs`, `path`, `os`, `child_process`, `better-sqlite3`, mọi file `backend/` |
| `backend/src/**` | `react`, `react-dom`, mọi file `frontend/` |
| `shared/**` | `fs`, `path`, `electron`, `react`, mọi thứ ngoài chính nó |
| `backend/src/services/**` | `electron` (để unit test bằng Node thuần) |
| `backend/src/repositories/**` | `../services/**` |

Alias: `@/` → `frontend/src/`, `#/` → `backend/src/`, `@shared/` → `shared/`.

Chiều phụ thuộc BE: `ipc/ → services/ → repositories/ → db/`. Cấm ngược chiều, cấm nhảy tầng.

---

## Hợp đồng IPC

- Kênh: `domain:action`, event: `event:<domain>-<past>`.
- Tên kênh **chỉ** khai báo ở `shared/channels.js`. Cấm magic string.
- Dùng `invoke`/`handle`. **Cấm `sendSync`.**
- Mọi handler trả envelope: `{ ok: true, data, meta? }` hoặc `{ ok: false, error: { code, message, details } }`.
  **Không bao giờ throw xuyên ranh giới IPC.**
- Payload và dữ liệu trả về: `camelCase`. Chuyển đổi `snake_case` ↔ `camelCase` **kết thúc trong Repository**.
- Thời gian: mốc thời gian là chuỗi **ISO 8601 UTC** (cột `_at`); ngày trên lịch là chuỗi **`YYYY-MM-DD`** (cột `_date`). Không truyền object `Date`.
- Mọi kênh `*:update` **bắt buộc** nhận `expectedUpdatedAt`; so sánh **trong cùng transaction**, lệch thì ném `CONFLICT` kèm `details.currentRecord`.
- Mọi thao tác ghi thành công → phát broadcast event.
- Danh sách luôn phân trang (`pageSize` mặc định 50, tối đa 200).
- Preload chỉ expose `window.api` dạng whitelist theo domain, `Object.freeze`. **Cấm** expose `ipcRenderer` thô hoặc hàm `invoke(channel, ...)` động.
- Hàm đăng ký listener phải trả về hàm huỷ đăng ký.

Mã lỗi (ở `shared/errors.js`): `VALIDATION_ERROR` `NOT_FOUND` `CONFLICT` `FOREIGN_KEY_VIOLATION` `DB_ERROR` `IO_ERROR` `PERMISSION_DENIED` `UNKNOWN_ERROR`.
`message` viết tiếng Việt, hiển thị được trực tiếp. Frontend phân nhánh theo `error.code`, **cấm** so khớp `message`.

**Danh mục kênh của dự án**: `project/ipc-channels.md`.

---

## Backend

- **Service** sinh `id` (UUID v4), `created_at`, `updated_at`. Renderer không gửi `id` khi tạo.
- **Repository** là nơi **duy nhất** viết SQL. Service không có SQL; Repository không có nghiệp vụ.
- SQL luôn tham số hoá `?`. Ngoại lệ duy nhất là `ORDER BY` — phải đối chiếu whitelist cứng.
- Cấm `SELECT *`. Mọi truy vấn danh sách có `LIMIT`. Mọi truy vấn đọc có `WHERE deleted_at IS NULL`.
- Mọi cột dùng trong `WHERE`/`ORDER BY`/`JOIN` phải có index. Cấm truy vấn trong vòng lặp (N+1).
- Transaction thuộc tầng Service. Xoá file vật lý phải nằm **sau** commit.
- Chuẩn hoá trước khi ghi: `trim()`, chuỗi rỗng → `null`, **Unicode NFC** (quan trọng với tiếng Việt).
- Đường dẫn luôn qua `app.getPath()` + `path.join()`. DB lưu đường dẫn **tương đối**. Tên file trên đĩa sinh bằng UUID.
- Log ra file, **không bao giờ** ghi nội dung người dùng nhập (chỉ `id` + metadata). Dùng logger, không `console.log`.
- Tác vụ > 300ms đẩy sang `worker_threads`.

**Schema của dự án**: `project/database-schema.md`.

---

## Frontend

- Component **không** gọi `window.api` trực tiếp — đi qua custom hook của feature → `<domain>.api.js` → `shared/invoke.js`.
- Component **không** gọi `useQuery`/`useMutation` trực tiếp.
- **Cấm sao chép dữ liệu server vào Zustand.** Server state thuộc TanStack Query.
- Query key lấy từ `shared/queryKeys.js`, cấm viết mảng key trực tiếp.
- Mutation `onSuccess` phải invalidate đủ key liên quan (bảng ở `project/invalidate-rules.md`).
- Event từ Main chỉ dùng để **invalidate**, không ghi đè cache.
- Mọi `useEffect` có đăng ký phải có cleanup.
- Nút submit `disabled={mutation.isPending}` — đây là cách duy nhất chống double-submit.
- Cấm hardcode màu/khoảng cách/cỡ chữ/`z-index` — tất cả qua `var(--token)`.
- Mọi màn hình xử lý đủ 5 trạng thái: loading / empty / error / filtered-empty / success.
- Cấm `<div onClick>`, cấm `key={index}`, cấm định nghĩa component bên trong component.

**Bản đồ màn hình**: `project/screen-map.md`.

---

## Cấu hình bắt buộc (giá trị chính xác)

`BrowserWindow`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, `preload` là đường dẫn tuyệt đối.

| Nơi | Khoá | Giá trị |
|---|---|---|
| `frontend/vite.config.js` | `base` | `'./'` |
| | `build.outDir` | `'../backend/renderer'` + `emptyOutDir: true` |
| | `server.fs.allow` | `['..']` (để đọc `shared/`) |
| `backend/electron-builder.yml` | `files` | `out/**`, `renderer/**`, `package.json` |
| | `asarUnpack` | `"**/*.node"` |
| | `directories.output` | `release` |
| | `npmRebuild` | `false` khi mọi native module là Node-API — mặc định của template. Thêm module kiểu NAN thì đối chiếu `project-structure.md` §6.1 |
| `backend/package.json` | `dependencies` | **chỉ** native module + runtime thật: `better-sqlite3`, `electron-updater` |
| | `devDependencies` | `electron`, `electron-builder`, `electron-vite`, `zod` |
| | `postinstall` | **không đặt** — `better-sqlite3` v12+ là Node-API, không cần rebuild (`project-structure.md` §6.1) |
| SQLite pragma | | `journal_mode=WAL`, `foreign_keys=ON`, `synchronous=NORMAL`, `busy_timeout=5000`, `temp_store=MEMORY` |

Ghim **chính xác** phiên bản `electron` và `better-sqlite3` (không `^`, không `~`).
Phân biệt dev/prod bằng `app.isPackaged` (BE) và `import.meta.env.DEV` (FE), **không** dùng `process.env.NODE_ENV`.
Biến `VITE_*` bị nhúng nguyên văn vào bundle — **không đặt bí mật ở đó**.

---

## Khởi động ứng dụng — thứ tự bắt buộc

```
1. app.requestSingleInstanceLock()   -> không có lock thì quit NGAY
2. Đọc PRAGMA user_version
3. user_version > số migration cao nhất? -> dialog + quit (chặn hạ cấp, tránh hỏng dữ liệu)
4. Backup DB -> chạy migration trong transaction
5. Mở kết nối + set pragma
6. Đăng ký IPC handler
7. Tạo cửa sổ (chỉ hiện khi 'ready-to-show')
```

Khôi phục vị trí cửa sổ phải đối chiếu `screen.getAllDisplays()` — toạ độ ngoài màn hình thì bỏ, mở giữa màn hình chính.

---

## Quy ước chung

- Tên định danh **tiếng Anh**; chuỗi hiển thị, comment, tài liệu **tiếng Việt**.
- Prettier: `semi: false`, `singleQuote: true`, `printWidth: 100`, `trailingComma: 'all'`, `endOfLine: 'lf'`.
- Component named export (không `export default`). File component `PascalCase.jsx`, hook `useXxx.js`, BE `<domain>.<tầng>.js`.
- Giới hạn: hàm 50 dòng, component 200 dòng, page 150 dòng, 3 tham số, JSX lồng 4 cấp.
- **Git**: không chạy bất kỳ lệnh git nào khi chưa được yêu cầu — kể cả lệnh chỉ đọc.
  **Không bao giờ** `commit` / `push` / `merge` / `rebase` / `reset --hard` / `clean` / `--force` / `--no-verify`, và không tự tạo hay chuyển nhánh.
  Xong việc → liệt kê file đã đổi + soạn sẵn commit message → **dừng**, người dùng tự commit.
  Tính năng mới làm trong **git worktree** riêng (`docs/05-git/worktree.md`).
- Sửa `shared/` = ảnh hưởng cả hai bên → sửa FE và BE trong cùng một PR.

---

## Quy tắc làm việc — bắt buộc

Chi tiết: `docs/00-meta/agent-rules.md`. Rút gọn:

**Phải hỏi, không được tự quyết**: thêm dependency · đổi quyết định trong file này · việc phụ thuộc "Quyết định còn bỏ ngỏ" · thêm bảng mới hoặc đổi schema đã phát hành · thêm màn hình ngoài bản đồ màn hình · bỏ qua một luật trong docs · **sửa bất cứ file nào trong `docs/`**.

**Trước khi viết code**: xác định đang ở Phase nào trong `project/roadmap.md` · nếu việc có công thức trong `docs/04-guidelines/recipes.md` thì làm theo đúng công thức và thứ tự · mở một file cùng loại đã có và làm theo đúng khuôn.

**Phạm vi**: một nhiệm vụ một mục đích · không refactor ngoài phạm vi · không tạo file ngoài kế hoạch · tái sử dụng trước khi tạo mới.

**"Xong" nghĩa là**: code đã chạy · lint + format sạch · test liên quan pass · đã đối chiếu checklist PR · nếu chạm `shared/` thì đã sửa cả hai bên · **docs đã cập nhật trong cùng lần thay đổi** · **đã chạy bước tự rà soát bên dưới**.

**Tự rà soát trước khi báo "xong"** (`agent-rules.md` §4.1) — áp cho mỗi tính năng và mỗi phase: đi thêm một lượt riêng bằng con mắt đi tìm lỗi · đối chiếu **từng mục** của kế hoạch với code thật · đọc lại **toàn văn** file vừa đụng · mỗi mục Definition of Done chỉ tick khi có lệnh đã chạy kèm output, trên **chính đường đi của app** — **suy luận không phải bằng chứng**, không kiểm chứng được thì để trống kèm lý do · báo cáo phải có mục **"Đã rà soát — phát hiện gì"**. Người dùng **không phải** nhắc.

**Tiết kiệm ngữ cảnh** (`agent-rules.md` §4.2): format **một lần ở cuối** mỗi nhóm việc, không sau từng lần sửa · đọc đúng mục cần thay vì cả file dài · không đọc lại file vừa ghi · lọc output ngay trong lệnh · **một phase một phiên** — xong phase thì nhắc người dùng `/clear`, tự nhắc lại khi ngữ cảnh vượt **60%**. Đây là tiết kiệm **chi phí**, không phải tiết kiệm **công sức**.

**Báo cáo trung thực**: làm được bao nhiêu báo bấy nhiêu · test fail thì nói fail kèm output · chưa chạy thì nói chưa chạy · liệt kê những gì đã tự quyết ngoài docs · **không bịa** phiên bản thư viện, tên API, hay kết quả lệnh.

**Docs mâu thuẫn thực tế** → dừng, báo, hỏi sửa bên nào. Cấm âm thầm làm theo một bên.

**Một khái niệm — một tên**: tra `project/glossary.md` trước khi đặt tên mới.

---

## Tra cứu chi tiết

### Template — `docs/`

| Cần gì | Đọc |
|---|---|
| Cấu hình build, đóng gói, cạm bẫy Electron | `docs/01-architecture/project-structure.md` |
| Quy tắc IPC, envelope, preload, mã lỗi | `docs/01-architecture/ipc-communication.md` |
| Vòng đời app, cấu hình bảo mật cửa sổ | `docs/01-architecture/overview.md` |
| Mô hình mối đe doạ, cái gì KHÔNG cần lo | `docs/01-architecture/security.md` |
| Quy ước đặt tên bảng/cột, kiểu dữ liệu, soft delete | `docs/02-backend-data/database-conventions.md` |
| Pragma, migration, backup | `docs/02-backend-data/storage-strategy.md` |
| Kiến trúc tầng BE, transaction, lỗi, log, test | `docs/02-backend-data/data-services.md` |
| Bố cục màn hình, design token, phím tắt, a11y | `docs/03-frontend/ui-structure.md` |
| Query key, cơ chế invalidate, optimistic update | `docs/03-frontend/state-management.md` |
| Quy chuẩn code chi tiết + checklist PR | `docs/04-guidelines/coding-standards*.md` |
| Khung 9 phase + Definition of Done | `docs/04-guidelines/phase-framework.md` |
| **Công thức thay đổi** (thêm entity / kênh IPC / cột / màn hình) | `docs/04-guidelines/recipes.md` |
| **Quy tắc Git** | `docs/05-git/rules.md` |
| **Worktree** | `docs/05-git/worktree.md` |
| Quy ước commit message và nhánh | `docs/05-git/commit-convention.md` |
| **Quy tắc làm việc đầy đủ** cho agent | `docs/00-meta/agent-rules.md` |
| Quy ước đặt tên, viết chuỗi tiếng Việt | `docs/00-meta/naming-conventions.md` |
| 18 quyết định nền + 5 câu hỏi khởi đầu | `docs/00-meta/decisions-baseline.md` |
| **Ví dụ một domain đã điền đầy đủ** | `docs/examples/sample-domain.md` |

### Nghiệp vụ — `project/`

| Cần gì | Đọc |
|---|---|
| Schema bảng, index, ràng buộc, ma trận xoá | `project/database-schema.md` |
| Danh mục kênh IPC đầy đủ | `project/ipc-channels.md` |
| Bản đồ màn hình | `project/screen-map.md` |
| Bảng invalidate cache | `project/invalidate-rules.md` |
| Thuật ngữ nghiệp vụ — tên code ↔ chuỗi hiển thị | `project/glossary.md` |
| Quyết định của dự án, vì sao chọn A không chọn B | `project/decisions.md` |
| Danh sách việc theo phase | `project/roadmap.md` |
| Kế hoạch thi công chi tiết từng bước | `plan/README.md` |

---

## Quyết định còn bỏ ngỏ — hỏi trước khi tự chọn

> Bản đầy đủ: `project/decisions.md` §2. Khung câu hỏi: `docs/00-meta/decisions-baseline.md` §2.

| Vấn đề | Hạn chót |
|---|---|
| **Domain nghiệp vụ thật** | Trước Phase 2 — viết `001_init.sql` |
| Chuyển sang TypeScript | Trước Phase 4 |
| Đa ngôn ngữ (i18n) | Trước Phase 3 |
| Mã hoá DB (SQLCipher) — **quyết định một chiều** | Trước Phase 7 |
| Chứng chỉ ký số ứng dụng | Trước Phase 7 |
