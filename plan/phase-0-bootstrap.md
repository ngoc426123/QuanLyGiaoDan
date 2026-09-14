# Phase 0 — Khởi tạo & Hạ tầng

> **Mục tiêu**: Một cửa sổ Electron mở lên, hiển thị trang React, sửa code thấy đổi ngay.
> Chưa có database, chưa có nghiệp vụ. Chỉ có đường ray.
>
> **Ước lượng**: 1–2 ngày · **Tiền đề**: [00-domain-lock-in.md](./00-domain-lock-in.md) đã xong

**Đọc trước**: `docs/01-architecture/project-structure.md` (toàn bộ phase này là làm theo tài liệu đó),
`docs/01-architecture/overview.md` §3 và §6, `docs/04-guidelines/coding-standards.md` §7.

> **Cạm bẫy lớn nhất của phase này**: sa lầy vào cấu hình build rồi "gỡ tạm" bằng cách hạ
> `contextIsolation` xuống `false`. **Tuyệt đối không.** `agent-rules.md` §9 cấm mục 3.

---

## 0.0 — Phiên bản đã duyệt (2026-09-12)

Tra từ npm registry và đã được duyệt. **Ghi đúng những con số này**, không tự nâng.
Lý do chọn: quyết định P07 · P08 · P09 ở `project/decisions.md` §3.

**Yêu cầu môi trường**: Node **22 LTS** (Electron 40+ và `better-sqlite3` 13 đều cần `>= 22.12`).

| Gói                    | Đặt ở                      | Phiên bản              | Ghi chú                                  |
| ---------------------- | -------------------------- | ---------------------- | ---------------------------------------- |
| `concurrently`         | gốc `devDependencies`      | `10.0.5`               | cần Node ≥ 22                            |
| `wait-on`              | gốc `devDependencies`      | `9.1.0`                |                                          |
| `prettier`             | gốc `devDependencies`      | `3.9.6`                |                                          |
| `react` · `react-dom`  | `frontend/dependencies`    | `18.3.1`               | React 18 theo `CLAUDE.md`                |
| `vite`                 | cả hai package             | `7.3.6`                | **không** dùng Vite 8 — P09              |
| `@vitejs/plugin-react` | `frontend/devDependencies` | `5.2.0`                |                                          |
| `electron`             | `backend/devDependencies`  | **`44.3.0` ghim cứng** | không `^`, không `~`                     |
| `electron-vite`        | `backend/devDependencies`  | `5.0.0`                | peer `vite ^5 \|\| ^6 \|\| ^7`           |
| `electron-builder`     | `backend/devDependencies`  | `26.15.3`              |                                          |
| `zod`                  | `backend/devDependencies`  | `4.6.2`                | JS thuần, bundler nhét vào `out/main.js` |
| `better-sqlite3`       | `backend/dependencies`     | **`13.0.3` ghim cứng** | **Phase 2 mới cài**                      |
| `electron-updater`     | `backend/dependencies`     | _(chốt ở Phase 7)_     | **Phase 7 mới cài**                      |

**Bộ lint** — ESLint 8, dùng `.eslintrc` (P07). Mọi plugin dưới đều khai báo peer `eslint ^8`:

| Gói                         | Phiên bản | Ghi chú                                            |
| --------------------------- | --------- | -------------------------------------------------- |
| `eslint`                    | `8.57.1`  |                                                    |
| `eslint-plugin-import`      | `2.32.0`  | cho `import/no-cycle`                              |
| `eslint-plugin-react`       | `7.37.5`  |                                                    |
| `eslint-plugin-react-hooks` | `5.2.0`   | **không** dùng 6+ — bản đó chuyển sang flat config |
| `eslint-plugin-jsx-a11y`    | `6.10.2`  |                                                    |
| `eslint-config-prettier`    | `10.1.8`  | tắt luật format xung đột với Prettier              |

> Nâng bất kỳ dòng nào ở đây = **phải hỏi** (`agent-rules.md` §2 — thêm/đổi dependency).

---

## 0.1 — Dựng khung thư mục

Tạo đúng cây sau (`project-structure.md` §1):

```
elecrusion/
├── package.json          ← task runner, KHÔNG ship
├── .gitignore
├── .gitattributes
├── .prettierrc
├── shared/
│   ├── channels.js       ← để rỗng ở phase này, Phase 1 mới điền
│   ├── errors.js         ← để rỗng
│   └── constants.js
├── frontend/
└── backend/
```

`package.json` gốc — **chỉ** là task runner:

| Khoá              | Giá trị                                                 |
| ----------------- | ------------------------------------------------------- |
| `private`         | `true`                                                  |
| `devDependencies` | `concurrently`, `wait-on` — **không gì khác**           |
| `scripts.dev`     | `concurrently` chạy song song FE dev + BE dev (xem 0.8) |
| `scripts.build`   | chạy tuần tự: build FE → build BE                       |
| `scripts.lint`    | chạy lint ở cả hai package                              |

> `shared/` **không có** `package.json`. Nó là thư mục JS thuần, mỗi bên trỏ tới bằng alias.

---

## 0.2 — `frontend/` (React + Vite)

**File cần tạo**: `frontend/package.json`, `frontend/vite.config.js`, `frontend/index.html`,
`frontend/src/main.jsx`, `frontend/src/App.jsx`

`vite.config.js` — bốn khoá **bắt buộc đúng giá trị** (`project-structure.md` §6):

| Khoá                | Giá trị                 | Sai thì sao                                                                         |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `base`              | `'./'`                  | Bản đóng gói **màn hình trắng** — đường dẫn tuyệt đối hỏng qua `file://`            |
| `build.outDir`      | `'../backend/renderer'` | Phải copy thủ công, khác nhau giữa các OS                                           |
| `build.emptyOutDir` | `true`                  | File build cũ còn sót lại                                                           |
| `server.fs.allow`   | `['..']`                | Dev báo _"The request url is outside of Vite serving allow list"_ khi đọc `shared/` |

Alias: `@` → `./src`, `@shared` → `../shared`.

`App.jsx` ở phase này chỉ cần hiển thị phiên bản app lấy qua `window.api` — đủ để chứng minh cầu nối hoạt động.

---

## 0.3 — `backend/` (manifest của ứng dụng)

**File cần tạo**: `backend/package.json`

> `backend/package.json` **là manifest của toàn bộ ứng dụng**, không phải "package riêng của backend".
> `electron-builder` đọc `main`, `name`, `version`, `dependencies` từ đây.

Phân loại dependency (`project-structure.md` §2) — **nhầm chỗ là lỗi nặng**:

| Gói                                 | Đặt ở                 | Lý do                                                                    |
| ----------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `electron`                          | **`devDependencies`** | Đặt vào `dependencies` → electron-builder nhét cả runtime ~200MB vào app |
| `electron-builder`, `electron-vite` | `devDependencies`     | Công cụ build                                                            |
| `zod`                               | `devDependencies`     | JS thuần, bundler nhét được vào `out/main.js`                            |
| `better-sqlite3`                    | `dependencies`        | Native module — **Phase 2 mới cài**, không cài sớm                       |
| `electron-updater`                  | `dependencies`        | **Phase 7 mới cài**                                                      |

Khoá bắt buộc:

- `main`: `"out/main.js"`
- `scripts.postinstall`: **không đặt** — `better-sqlite3` v12+ là Node-API, không cần rebuild theo ABI Electron (`project-structure.md` §6.1)
- Ghim **chính xác** phiên bản `electron` (không `^`, không `~`) — `CLAUDE.md`, `security.md` §3

---

## 0.4 — `backend/electron.vite.config.js`

Build hai target:

| Target    | Đầu ra           | Ràng buộc                                                           |
| --------- | ---------------- | ------------------------------------------------------------------- |
| `main`    | `out/main.js`    |                                                                     |
| `preload` | `out/preload.js` | **Phải bundle thành MỘT file duy nhất** (`project-structure.md` §6) |

Alias `@shared` → `../shared` cho cả hai target.

---

## 0.5 — `backend/src/main/index.js` tối thiểu

Cấu hình `BrowserWindow` — **năm giá trị bắt buộc** (`overview.md` §3):

| Tuỳ chọn           | Giá trị                                                       |
| ------------------ | ------------------------------------------------------------- |
| `contextIsolation` | `true`                                                        |
| `nodeIntegration`  | `false`                                                       |
| `sandbox`          | `true`                                                        |
| `webSecurity`      | `true`                                                        |
| `preload`          | đường dẫn **tuyệt đối**: `path.join(__dirname, 'preload.js')` |

Thêm ở phase này:

- `app.requestSingleInstanceLock()` — **không có lock thì `app.quit()` NGAY** (`overview.md` §6.1). Đây là bước **đầu tiên** trong vòng đời app.
- Cửa sổ chỉ `show` khi sự kiện `'ready-to-show'` — tránh nháy trắng.
- Kích thước: mặc định 1280×800, tối thiểu 940×600 (`ui-structure.md` §1).
- DevTools chỉ mở khi `!app.isPackaged`.

> Khôi phục vị trí cửa sổ (`overview.md` §6.2) để **Phase 3** làm — phase này chưa có chỗ lưu.

---

## 0.6 — Phân nhánh dev/prod

| Điều kiện         | Nạp gì                                                         |
| ----------------- | -------------------------------------------------------------- |
| `!app.isPackaged` | `win.loadURL(process.env.VITE_DEV_SERVER_URL)`                 |
| `app.isPackaged`  | `win.loadFile(path.join(__dirname, '../renderer/index.html'))` |

**Dùng `app.isPackaged`, không dùng `process.env.NODE_ENV`** — biến đó không đáng tin trong bản đóng gói (`project-structure.md` §7).

---

## 0.7 — Preload tối thiểu

`backend/src/preload/index.js` — chỉ expose đúng một thứ để kiểm chứng cầu nối:

```
window.api.app.getVersion()
```

Bốn luật áp ngay từ bây giờ (`ipc-communication.md` §7.1):

1. Chỉ expose **một** object gốc: `window.api`.
2. Mỗi hàm là **wrapper cố định tên kênh** — tên kênh do preload quyết định, **không** nhận từ tham số.
3. Object expose phải `Object.freeze`.
4. **Cấm** expose `ipcRenderer` thô hoặc hàm `invoke(channel, ...)` động.

> Ở phase này `getVersion` có thể trả thẳng `app.getVersion()` qua một `ipcMain.handle` tạm.
> Phase 1 sẽ chuẩn hoá thành envelope.

---

## 0.8 — Script `npm run dev`

```
npm run dev (ở gốc)
  ├─ frontend:  vite dev              → http://localhost:5173
  └─ backend:   wait-on cổng 5173 → electron-vite dev → mở BrowserWindow
```

**Backend phải đợi Vite sẵn sàng** (`wait-on`) rồi mới mở cửa sổ. Thiếu bước này → màn hình trắng.

---

## 0.9 — Lint, format, gitignore

**File cần tạo**: `.gitignore`, `.gitattributes`, `.prettierrc`, `frontend/.eslintrc`, `backend/.eslintrc`

`.gitignore` bắt buộc có (`project-structure.md` §1):

```
node_modules/
backend/out/
backend/renderer/
backend/release/
frontend/dist/
*.db
*.db-wal
*.db-shm
.env*
```

`.gitattributes`: `* text=auto eol=lf`

`.prettierrc` — giá trị chính xác (`CLAUDE.md`):

| Khoá            | Giá trị |
| --------------- | ------- |
| `semi`          | `false` |
| `singleQuote`   | `true`  |
| `printWidth`    | `100`   |
| `trailingComma` | `'all'` |
| `endOfLine`     | `'lf'`  |

---

## 0.10 — Cưỡng chế luật bằng máy

> **Đây là bước quan trọng nhất của Phase 0.** Luật chỉ nằm trong docs sẽ bị vi phạm im lặng.
> Luật nằm trong ESLint thì báo đỏ ngay.

Cấu hình theo `coding-standards.md` §7:

| Luật                                                                                                                | Cách cưỡng chế                                                                        |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `frontend/src/**` cấm import `electron`, `fs`, `path`, `os`, `child_process`, `better-sqlite3`, mọi file `backend/` | `no-restricted-imports` theo `overrides`                                              |
| `backend/src/**` cấm import `react`, `react-dom`, mọi file `frontend/`                                              | cùng cơ chế                                                                           |
| `shared/**` cấm import `fs`, `path`, `electron`, `react`                                                            | cùng cơ chế                                                                           |
| `backend/src/services/**` cấm import `electron`                                                                     | cùng cơ chế                                                                           |
| `backend/src/repositories/**` cấm import `../services/**`                                                           | cùng cơ chế                                                                           |
| `backend/src/main/ipc/**` cấm import `repositories/` (cấm nhảy tầng)                                                | cùng cơ chế                                                                           |
| Cấm nối chuỗi SQL                                                                                                   | `no-restricted-syntax` chặn template literal chứa `SELECT`/`INSERT`/`UPDATE`/`DELETE` |
| Cấm `console.log` ở Backend                                                                                         | `no-console: error`                                                                   |
| Cấm import vòng                                                                                                     | `import/no-cycle`                                                                     |
| Cấm component lồng nhau / thiếu `key` / `<div onClick>`                                                             | `react/no-unstable-nested-components`, `react/jsx-key`, `jsx-a11y/*`                  |
| Cấm `require` / `process` / `__dirname` ở Renderer                                                                  | `no-restricted-globals`                                                               |

**Luật KHÔNG lint được** — phải tự kiểm trong review (đã có ở checklist PR):

- Mọi truy vấn đọc có `WHERE deleted_at IS NULL`
- Mọi kênh `*:update` nhận `expectedUpdatedAt`
- Mutation invalidate đủ query key
- Màn hình xử lý đủ 5 trạng thái
- Không hardcode giá trị thiết kế (chặn được một phần bằng `stylelint`)

---

## Definition of Done

- [x] `npm run dev` ở gốc mở được cửa sổ, hiển thị phiên bản app lấy qua `window.api`
- [x] Sửa file React → giao diện cập nhật không cần khởi động lại
- [x] Sửa file Main → tiến trình tự khởi động lại
- [x] Import được hằng số từ `@shared` ở **cả hai** bên mà không lỗi
- [x] DevTools console **không có lỗi và không có cảnh báo bảo mật của Electron**
- [x] `window.require` trong DevTools trả về `undefined`
- [x] Mở app lần hai khi đã có một instance → instance cũ được focus, không mở cửa sổ thứ hai
- [ ] Thu nhỏ cửa sổ xuống 940×600 — không vỡ · **hoãn sang Phase 3**: Phase 0 chưa có layout để vỡ, `minWidth: 940` / `minHeight: 600` đã chặn kích thước. Kiểm và sửa khi dựng App Shell
- [x] `npm run lint` sạch ở cả hai package
- [x] `npm run format:check` không còn khác biệt
- [x] **Thử vi phạm có chủ đích để xác nhận lint bắt được** — đã thử 7 luật, tất cả báo đỏ:
  - import `fs` trong `frontend/src/` · import `electron` trong `backend/src/services/`
  - `repositories/` → `services/` · `main/ipc/` → `repositories/`
  - nối chuỗi SQL · `console.log` ở Backend · import `path` trong `shared/`
  - Đã xoá toàn bộ file thử sau khi xác nhận

---

## Rủi ro của phase này

| Rủi ro                                                   | Xử lý                                                                                                                                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cấu hình build là điểm vướng phổ biến nhất với người mới | Dành đủ thời gian. **Không** hạ `contextIsolation` để "cho dễ chạy"                                                                                                    |
| Dev báo _"outside of Vite serving allow list"_           | Thiếu `server.fs.allow: ['..']` ở `vite.config.js`                                                                                                                     |
| Màn hình trắng lúc `npm run dev`                         | Backend không đợi Vite — kiểm tra `wait-on` ở 0.8                                                                                                                      |
| `npm install` báo `gyp ERR!` hoặc `MSBuild.exe failed`   | Thiếu **Visual Studio Build Tools (Desktop development with C++)** và **Python 3** (`project-structure.md` §9). Phase 0 chưa cần, nhưng cài trước để Phase 2 không kẹt |

---

## Docs phải cập nhật trong phase này

Không có. Phase 0 làm đúng theo `project-structure.md`, không phát sinh luật mới.
Nếu có chỗ nào **phải làm khác docs** → dừng, báo, hỏi sửa bên nào (`agent-rules.md` §6).

**Xong → [phase-1-ipc-backbone.md](./phase-1-ipc-backbone.md)**

---

## 0.11 — Sai lệch phát hiện khi thi công (2026-09-12)

Tám điểm thực tế khác với mô tả ở trên.

> **Cập nhật 2026-09-12**: sáu trong tám điểm (1, 2, 4, 5, 7, 8) đã được đưa lên `docs/` ở
> **template 1.3.0** — chúng đúng với mọi dự án Electron + SQLite, không riêng dự án này.
> Từ nay đọc `docs/` là đủ; bảng dưới giữ lại làm nhật ký thi công.
> Hai điểm còn lại (3, 6) là lựa chọn riêng của dự án này, vẫn nằm ở đây.

| #   | Kế hoạch ghi                                     | Thực tế phải làm                                    | Vì sao                                                                                                                                                                                   |
| --- | ------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `out/preload.js` (§0.4)                          | **`out/preload.cjs`**                               | Preload chạy trong `sandbox: true` **bắt buộc** là CommonJS; Electron không nạp được preload ESM. `backend/package.json` khai báo `type: module` nên đuôi phải là `.cjs`. Quyết định P10 |
| 2   | `electron-vite dev` (§0.8)                       | **`electron-vite dev --watch`**                     | Không có `--watch` thì sửa file Main **không** khởi động lại tiến trình — hụt một mục Definition of Done                                                                                 |
| 3   | Dev nạp `process.env.VITE_DEV_SERVER_URL` (§0.6) | `process.env.VITE_DEV_SERVER_URL ?? DEV_SERVER_URL` | Biến đó chỉ được đặt khi electron-vite tự quản renderer. Ở đây renderer do package `frontend/` chạy riêng, nên phải có hằng số dự phòng ở `shared/constants.js`                          |
| 4   | —                                                | Ghim `server.host: '127.0.0.1'`                     | Trên máy này Vite chỉ bind vào `[::1]` (IPv6), khiến `wait-on tcp:127.0.0.1:5173` **treo vĩnh viễn**. Ghim cả ba nơi về `127.0.0.1` cho tất định                                         |
| 5   | ESLint cấu hình **cho từng package** (§0.9)      | **Một `.eslintrc.cjs` duy nhất ở gốc**              | `shared/` không thuộc package nào. Luật ranh giới phải nhìn thấy đồng thời cả ba vùng mới kiểm được — đúng như `coding-standards.md` §7 mô tả bằng `overrides` theo đường dẫn            |
| 6   | Gốc chỉ có `concurrently`, `wait-on` (§0.1)      | Thêm `prettier` và bộ `eslint` ở gốc                | Hệ quả của #5, và `shared/` cũng cần được format. Không gói nào trong số này bị đóng gói vào app                                                                                         |
| 7   | —                                                | `npm install` lần đầu **không** tải binary Electron | Postinstall của gói `electron` im lặng bỏ qua. Triệu chứng: `Error: Electron uninstall`. Chữa bằng `node node_modules/electron/install.js` trong `backend/`                              |

| 8 | CSP dev theo `project-structure.md` §8 | Dev phải thêm **`script-src ... 'unsafe-inline'`** | `@vitejs/plugin-react` chèn preamble React Refresh dưới dạng **inline script**. Chặn nó thì `main.jsx` không chạy và **cửa sổ trắng trơn, không báo lỗi gì ở terminal**. Chỉ nới ở nhánh dev; bản đóng gói giữ `script-src 'self'` |

**Một cảnh báo vô hại**: `electron-vite build` in `renderer config is missing`. Đúng như thiết kế —
renderer do `frontend/` build ra thẳng `backend/renderer/`, electron-vite chỉ lo `main` và `preload`.
