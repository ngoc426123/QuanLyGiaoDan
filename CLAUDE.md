# Elecrusion — Ràng buộc dự án

Ứng dụng desktop Electron. Dữ liệu cục bộ, offline hoàn toàn.
**Domain: Quản lý giáo dân giáo xứ** — đã chốt 2026-09-12, đặc tả ở `project/`.
**Ngôn ngữ: chỉ tiếng Việt**, không triển khai i18n — người dùng chốt 2026-09-13 (Q03).
**Trạng thái: Phase 6 đã hoàn tất** (2026-09-21, người dùng xác nhận).
Đường chạy đã chuyển sang TypeScript; CRUD Giáo họ → Gia đình → Giáo dân → Thành viên hộ,
phân trang SQL, đồng bộ broadcast, kiểm tra xung đột và thông báo lỗi nghiệp vụ đã được hoàn tất.
Phase 5 đã hoàn thiện trải nghiệm: thùng rác, tìm kiếm FTS tiếng Việt, thao tác hàng loạt,
nhập/xuất CSV, cải tiến accessibility và thao tác hằng ngày. CSV nhập bằng `worker_threads`;
worker đã được kiểm chứng đóng gói và tìm đúng đường dẫn trong `backend/out`. In giấy được để lại
sau cùng theo yêu cầu người dùng.
Tiến độ đầy đủ: `project/roadmap.md`.

## Ghi chú tiếp tục phiên sau — 2026-09-21

Phase 3, 4 và 5 đã được người dùng xác nhận hoàn tất. Q02 đã được chốt ngày 2026-09-14:
dùng TypeScript thay cho JavaScript + JSDoc; mọi mã nguồn đang chạy đã chuyển đổi trước CRUD.
Phase 4 dùng phân trang SQL 50 dòng/trang cho danh sách lớn, không dùng virtual scroll.
Tiếp tục từ **Phase 7 — Đóng gói & Phát hành** (`plan/phase-7-packaging.md`), không tự đổi cấu trúc build.
Phần tiếp theo của Phase 7, theo yêu cầu người dùng ngày 2026-09-21:
1. Đổi tên ứng dụng từ **Elecrusion** thành **Quan Ly Giao Dan**.
2. Loại bỏ toàn bộ phần bảo vệ dữ liệu; ứng dụng mở trực tiếp, không tạo hoặc nhập mật khẩu.
Phase 6 đã có log an toàn, lưới bắt lỗi toàn cục, backup định kỳ/dọn backup, dọn thùng rác,
E2E Electron và kiểm tra query plan. Giáo xứ cần lịch sử chỉnh sửa nên `activity_logs` đã được
triển khai. Quyết định mã hóa DB (SQLCipher) đã chốt tại `project/decisions.md` Q04.
Kiểm chứng cuối Phase 6: `npm run format:check`, `npm run lint`, `npm run typecheck`,
`npm run build` đạt; backend 84/84, frontend 31/31 và 3/3 E2E Electron test đạt. Soak test
30 phút được miễn theo xác nhận của người dùng; ứng dụng chỉ cần ổn định trong các phiên ngắn.
Regression CSV trước đó xác nhận luồng nhập 1.200 dòng → chặn trùng → xóa dữ liệu → nhập lại;
lỗi preview phải hiện toast.
Tiếp tục chỉ dùng tiếng Việt, làm trực tiếp trên `develop`, không tạo worktree.
Đã được phép thêm package và bộ test; **không tự ý commit hoặc push**.

File này chứa ràng buộc **bắt buộc**. Chi tiết tra ở `docs/` (template) và `project/` (nghiệp vụ)
— bảng điều hướng ở cuối.

---

## Stack đã chốt — không tự đổi

| Tầng         | Lựa chọn                                                      |
| ------------ | ------------------------------------------------------------- |
| Renderer     | React 18 + Vite, `HashRouter` (bắt buộc — chạy qua `file://`) |
| Server state | TanStack Query                                                |
| UI state     | Zustand                                                       |
| Style        | CSS Modules + CSS custom property (design token)              |
| Mã nguồn     | TypeScript ESM, không dùng JavaScript + JSDoc                 |
| DB           | SQLite qua `better-sqlite3`                                   |
| Validate     | Zod, ở biên IPC phía Main                                     |
| Build        | Vite (FE) + electron-vite (BE) + electron-builder             |

---

## Ba tầng tài liệu — luật ranh giới

| Tầng      | Ở đâu      | Sửa khi nào                                                                                                            |
| --------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Template  | `docs/`    | **Chỉ khi luật đó đúng với mọi dự án Electron+SQLite.** Sửa = phải mang sang dự án khác + tăng `docs/TEMPLATE_VERSION` |
| Nghiệp vụ | `project/` | Bất cứ khi nào domain thay đổi                                                                                         |
| Kế hoạch  | `plan/`    | Khi điều chỉnh thứ tự thi công                                                                                         |

Khi phân vân một luật nên nằm đâu, hỏi: _"Dự án Electron+SQLite tiếp theo có cần luật này không?"_
Có → `docs/`. Không → `project/`.

> **Cấm sửa `docs/` mà không hỏi.** Thay đổi ở đó ảnh hưởng mọi dự án dùng chung template.
> Luật chỉ đúng với dự án này → ghi vào `project/decisions.md` §4 (ngoại lệ), không sửa `docs/`.

---

## Cấu trúc: hai package độc lập

```
elecrusion/
├── package.json          task runner (concurrently), không ship
├── docs/                 TEMPLATE — dùng lại được, không chứa nghiệp vụ
├── project/              NGHIỆP VỤ — riêng dự án này
├── plan/                 KẾ HOẠCH THI CÔNG — riêng dự án này
├── shared/               TypeScript thuần, KHÔNG có package.json — channels.ts, errors.ts
├── frontend/             package 1 — React. Build ra file tĩnh
└── backend/              package 2 — LÀ ứng dụng Electron (package.json = manifest app)
    └── src/{main,preload,services,repositories,schemas,db}
```

### Luật ranh giới — ESLint cưỡng chế

| Vùng                          | Cấm import                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `frontend/src/**`             | `electron`, `fs`, `path`, `os`, `child_process`, `better-sqlite3`, mọi file `backend/` |
| `backend/src/**`              | `react`, `react-dom`, mọi file `frontend/`                                             |
| `shared/**`                   | `fs`, `path`, `electron`, `react`, mọi thứ ngoài chính nó                              |
| `backend/src/services/**`     | `electron` (để unit test bằng Node thuần)                                              |
| `backend/src/repositories/**` | `../services/**`                                                                       |

Alias: `@/` → `frontend/src/`, `#/` → `backend/src/`, `@shared/` → `shared/`.

Chiều phụ thuộc BE: `ipc/ → services/ → repositories/ → db/`. Cấm ngược chiều, cấm nhảy tầng.

---

## Hợp đồng IPC

- Kênh: `domain:action` (`task:create`), event: `event:<domain>-<past>` (`event:task-changed`).
- Tên kênh **chỉ** khai báo ở `shared/channels.ts`. Cấm magic string.
- Dùng `invoke`/`handle`. **Cấm `sendSync`.**
- Mọi handler trả envelope: `{ ok: true, data, meta? }` hoặc `{ ok: false, error: { code, message, details } }`.
  **Không bao giờ throw xuyên ranh giới IPC.** Handler luôn bọc `try/catch`.
- Payload và dữ liệu trả về: `camelCase`. Chuyển đổi `snake_case` ↔ `camelCase` **kết thúc trong Repository**.
- Thời gian: mốc thời gian là chuỗi **ISO 8601 UTC** (cột `_at`); ngày trên lịch là chuỗi **`YYYY-MM-DD`** (cột `_date`). Không truyền object `Date`.
- Mọi kênh `*:update` **bắt buộc** nhận `expectedUpdatedAt`; Service so sánh với `updated_at` trong DB **trong cùng transaction**, lệch thì ném `CONFLICT` kèm `details.currentRecord`.
- Mọi thao tác ghi thành công → phát broadcast event.
- Danh sách luôn phân trang (`pageSize` mặc định 50, tối đa 200).
- Preload chỉ expose `window.api` dạng whitelist theo domain, `Object.freeze`. **Cấm** expose `ipcRenderer` thô hoặc hàm `invoke(channel, ...)` động.
- Hàm đăng ký listener phải trả về hàm huỷ đăng ký.

Mã lỗi (ở `shared/errors.ts`): `VALIDATION_ERROR` `NOT_FOUND` `CONFLICT` `FOREIGN_KEY_VIOLATION` `DB_ERROR` `IO_ERROR` `PERMISSION_DENIED` `UNKNOWN_ERROR`.
`message` viết tiếng Việt, hiển thị được trực tiếp. Frontend phân nhánh theo `error.code`, **cấm** so khớp `message`.

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

---

## Frontend

- Component **không** gọi `window.api` trực tiếp — đi qua custom hook của feature → `<domain>.api.ts` → `shared/invoke.ts`.
- Component **không** gọi `useQuery`/`useMutation` trực tiếp.
- **Cấm sao chép dữ liệu server vào Zustand.** Server state thuộc TanStack Query.
- Query key lấy từ `shared/queryKeys.ts`, cấm viết mảng key trực tiếp.
- Mutation `onSuccess` phải invalidate đủ key liên quan (bảng ở `project/invalidate-rules.md`).
- Event từ Main chỉ dùng để **invalidate**, không ghi đè cache.
- Mọi `useEffect` có đăng ký phải có cleanup.
- Nút submit `disabled={mutation.isPending}` — đây là cách duy nhất chống double-submit.
- Cấm hardcode màu/khoảng cách/cỡ chữ/`z-index` — tất cả qua `var(--token)`.
- Mọi màn hình xử lý đủ 5 trạng thái: loading / empty / error / filtered-empty / success.
- Cấm `<div onClick>`, cấm `key={index}`, cấm định nghĩa component bên trong component.

---

## Cấu hình bắt buộc (giá trị chính xác)

`BrowserWindow`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, `preload` là đường dẫn tuyệt đối.

| Nơi                            | Khoá                 | Giá trị                                                                                               |
| ------------------------------ | -------------------- | ----------------------------------------------------------------------------------------------------- |
| `frontend/vite.config.js`      | `base`               | `'./'`                                                                                                |
|                                | `build.outDir`       | `'../backend/renderer'` + `emptyOutDir: true`                                                         |
|                                | `server.fs.allow`    | `['..']` (để đọc `shared/`)                                                                           |
| `backend/electron-builder.yml` | `files`              | `out/**`, `renderer/**`, `package.json`                                                               |
|                                | `asarUnpack`         | `"**/*.node"`                                                                                         |
|                                | `directories.output` | `release`                                                                                             |
|                                | `npmRebuild`         | `false` — mọi native module hiện tại là Node-API, đóng gói không được rebuild                         |
| `backend/package.json`         | `dependencies`       | **chỉ** native module + runtime thật: `better-sqlite3`, `electron-updater`                            |
|                                | `devDependencies`    | `electron`, `electron-builder`, `electron-vite`, `zod`                                                |
|                                | `postinstall`        | **không đặt** — `better-sqlite3` v12+ là Node-API, không cần rebuild (`project-structure.md` §6.1)    |
| SQLite pragma                  |                      | `journal_mode=WAL`, `foreign_keys=ON`, `synchronous=NORMAL`, `busy_timeout=5000`, `temp_store=MEMORY` |

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

**Tự rà soát trước khi báo "xong"** (`docs/00-meta/agent-rules.md` §4.1) — áp cho mỗi tính năng và mỗi phase: đi thêm một lượt riêng bằng con mắt đi tìm lỗi · đối chiếu **từng mục** của `plan/phase-N-*.md` với code thật · đọc lại **toàn văn** file vừa đụng · mỗi mục Definition of Done chỉ tick khi có lệnh đã chạy kèm output, trên **chính đường đi của app** — **suy luận không phải bằng chứng**, không kiểm chứng được thì để trống kèm lý do · báo cáo phải có mục **"Đã rà soát — phát hiện gì"**. Người dùng **không phải** nhắc.

**Tiết kiệm ngữ cảnh** (`docs/00-meta/agent-rules.md` §4.2): format **một lần ở cuối** mỗi nhóm việc, không sau từng lần sửa · đọc đúng mục cần thay vì cả file dài · không đọc lại file vừa ghi · lọc output ngay trong lệnh (`| tail -20`, `grep` dòng tổng kết) · **một phase một phiên** — xong phase thì nhắc người dùng `/clear`, tự nhắc lại khi ngữ cảnh vượt **60%**. Đây là tiết kiệm **chi phí**, không phải tiết kiệm **công sức**: cấm lấy làm cớ bỏ kiểm chứng hay bỏ đọc tài liệu bắt buộc.

**Báo cáo trung thực**: làm được bao nhiêu báo bấy nhiêu · test fail thì nói fail kèm output · chưa chạy thì nói chưa chạy · liệt kê những gì đã tự quyết ngoài docs · **không bịa** phiên bản thư viện, tên API, hay kết quả lệnh.

**Docs mâu thuẫn thực tế** → dừng, báo, hỏi sửa bên nào. Cấm âm thầm làm theo một bên.

**Một khái niệm — một tên**: tra `project/glossary.md` trước khi đặt tên mới.

---

## Tra cứu chi tiết

| Cần gì                                                           | Đọc                                            |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| Cấu hình build, đóng gói, cạm bẫy Electron                       | `docs/01-architecture/project-structure.md`    |
| Quy tắc IPC, envelope, preload, mã lỗi                           | `docs/01-architecture/ipc-communication.md`    |
| **Danh mục kênh IPC đầy đủ**                                     | `project/ipc-channels.md`                      |
| Vòng đời app, cấu hình bảo mật cửa sổ                            | `docs/01-architecture/overview.md`             |
| Mô hình mối đe doạ, cái gì KHÔNG cần lo                          | `docs/01-architecture/security.md`             |
| Quy ước đặt tên bảng, kiểu dữ liệu, soft delete                  | `docs/02-backend-data/database-conventions.md` |
| **Schema bảng, index, ràng buộc**                                | `project/database-schema.md`                   |
| Pragma, migration, backup                                        | `docs/02-backend-data/storage-strategy.md`     |
| Kiến trúc tầng BE, transaction, lỗi, log, test                   | `docs/02-backend-data/data-services.md`        |
| Bố cục màn hình, design token, phím tắt, a11y                    | `docs/03-frontend/ui-structure.md`             |
| **Bản đồ màn hình**                                              | `project/screen-map.md`                        |
| Query key, cơ chế invalidate, optimistic update                  | `docs/03-frontend/state-management.md`         |
| **Bảng invalidate cache**                                        | `project/invalidate-rules.md`                  |
| Quy chuẩn code chi tiết + checklist PR                           | `docs/04-guidelines/coding-standards*.md`      |
| Khung 9 phase + Definition of Done                               | `docs/04-guidelines/phase-framework.md`        |
| **Danh sách việc theo phase**                                    | `project/roadmap.md` · chi tiết ở `plan/`      |
| **Quy tắc Git** — lệnh nào cấm, xong việc thì làm gì             | `docs/05-git/rules.md`                         |
| **Worktree** — quy trình và 3 cạm bẫy riêng của dự án            | `docs/05-git/worktree.md`                      |
| Quy ước commit message và nhánh                                  | `docs/05-git/commit-convention.md`             |
| **Công thức thay đổi** (thêm entity / kênh IPC / cột / màn hình) | `docs/04-guidelines/recipes.md`                |
| **Quy tắc làm việc đầy đủ** cho agent                            | `docs/00-meta/agent-rules.md`                  |
| Quy ước đặt tên, viết chuỗi tiếng Việt                           | `docs/00-meta/naming-conventions.md`           |
| **Từ điển thuật ngữ** — tên code ↔ chuỗi hiển thị                | `project/glossary.md`                          |
| 18 quyết định nền của template                                   | `docs/00-meta/decisions-baseline.md`           |
| **Nhật ký quyết định** — vì sao chọn A không chọn B              | `project/decisions.md`                         |

---

## Quyết định còn bỏ ngỏ — hỏi trước khi tự chọn

> Bản đầy đủ kèm mức ảnh hưởng: `project/decisions.md` §2.

| Vấn đề                                           | Hạn chót      |
| ------------------------------------------------ | ------------- |
| Mã hoá DB (SQLCipher) — **quyết định một chiều** | Trước Phase 7 |
