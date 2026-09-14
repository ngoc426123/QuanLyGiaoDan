# Cấu trúc repo và quy trình Build

> Đặc tả cấu hình build. Ràng buộc cốt lõi đã nằm ở `CLAUDE.md`; file này là bản đầy đủ.

---

## 1. Cấu trúc repo

```
<project>/
├── package.json                 task runner. devDeps: concurrently, wait-on. KHÔNG ship
├── CLAUDE.md                    ràng buộc dự án
├── docs/
│
├── shared/                      JS thuần, KHÔNG có package.json
│   ├── channels.js              hằng số tên kênh IPC
│   ├── errors.js                mã lỗi chuẩn
│   └── constants.js
│
├── frontend/                    PACKAGE 1 — chỉ tồn tại lúc build
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│
└── backend/                     PACKAGE 2 — LÀ ứng dụng Electron
    ├── package.json             manifest của app
    ├── electron.vite.config.js
    ├── electron-builder.yml
    ├── resources/               icon, ảnh tĩnh
    ├── src/{main,preload,services,repositories,schemas,db}
    ├── out/                     (sinh ra) main.js, preload.cjs
    ├── renderer/                (sinh ra) FE build đổ vào đây
    └── release/                 (sinh ra) file cài đặt
```

`.gitignore` bắt buộc có: `node_modules/`, `backend/out/`, `backend/renderer/`, `backend/release/`, `frontend/dist/`, `*.db`, `*.db-wal`, `*.db-shm`, `.env*`

> **`backend/package.json` là manifest của toàn bộ ứng dụng**, không phải "package riêng của backend". `electron-builder` đọc `main`, `name`, `version` và `dependencies` từ đây.

---

## 2. Phân loại dependency

Tiêu chí: *"Gói này có bundle được không?"*

| Loại | Đặt ở | Ví dụ |
|---|---|---|
| Native module (có file `.node`) — không bundle được | `backend/dependencies` | `better-sqlite3` |
| Cần ở runtime thật | `backend/dependencies` | `electron-updater` |
| JS thuần — bundler nhét được vào `out/main.js` | `backend/devDependencies` | `zod`, `date-fns`, `uuid` |
| Công cụ build | `backend/devDependencies` | `electron`, `electron-builder`, `electron-vite` |
| Mọi thứ của Frontend | `frontend/*` | Vite bundle hết vào file tĩnh |

`electron` **luôn** ở `devDependencies`. Đặt vào `dependencies` khiến electron-builder nhét cả runtime ~200MB vào app.

---

## 3. Thư mục `shared/`

Không phải package — là thư mục file JS thuần, cả hai bên trỏ tới bằng alias, bundler mỗi bên tự nhét vào output riêng.

| Bên | Cấu hình |
|---|---|
| Frontend | `resolve.alias['@shared'] = '../shared'` **và** `server.fs.allow = ['..']` |
| Backend | `resolve.alias['@shared'] = '../shared'` |

Thiếu `server.fs.allow` → dev báo *"The request url is outside of Vite serving allow list"*.

`shared/` chỉ chứa hằng số và hàm thuần. Cấm import `fs`/`path`/`electron` (FE nuốt phải) và `react` (BE nuốt phải).

---

## 4. Luồng Development

```
npm run dev (ở gốc)
  ├─ frontend:  vite dev                      -> http://127.0.0.1:5173
  └─ backend:   wait-on cổng 5173 -> electron-vite dev --watch -> mở BrowserWindow
```

> **Cờ `--watch` là bắt buộc.** `electron-vite dev` trần chỉ nạp lại Renderer; sửa file Main **không** khởi động lại tiến trình — hụt một mục Definition of Done của Phase 0.
>
> **Ghim địa chỉ, đừng dùng `localhost`.** Trên Windows, Vite có thể chỉ bind vào `[::1]` (IPv6) trong khi `wait-on tcp:127.0.0.1:5173` chờ IPv4 — `npm run dev` **treo vĩnh viễn** ở bước chờ mà không báo lỗi gì. Đặt `server.host: '127.0.0.1'` trong `vite.config.js`, rồi dùng đúng địa chỉ đó ở `wait-on`, ở CSP và ở `loadURL`.

Main phân nhánh nạp nội dung:

| Môi trường | Nạp |
|---|---|
| `!app.isPackaged` | `win.loadURL(process.env.VITE_DEV_SERVER_URL)` |
| `app.isPackaged` | `win.loadFile(path.join(__dirname, '../renderer/index.html'))` |

Backend phải **đợi** Vite sẵn sàng rồi mới mở cửa sổ (`wait-on`), nếu không sẽ thấy màn hình trắng.

---

## 5. Luồng Build production

```
1. cd frontend && vite build        -> đổ thẳng vào backend/renderer/ (nhờ outDir)
2. cd backend  && electron-vite build -> backend/out/main.js, preload.cjs
3. electron-builder install-app-deps   -> CHỈ khi có native module kiểu NAN/ABI cũ (mục 6.1)
4. electron-builder --win              -> backend/release/<AppName>-Setup-x.y.z.exe
```

Bước 1 dùng `build.outDir: '../backend/renderer'` + `emptyOutDir: true` để bỏ hẳn bước copy — tránh khác biệt `xcopy` / `cp -r` giữa các hệ điều hành.

> `electron-vite build` in cảnh báo `renderer config is missing`. **Đúng như thiết kế** — renderer do package `frontend/` build thẳng vào `backend/renderer/` ở bước 1, `electron-vite` chỉ lo `main` và `preload`. Không phải lỗi, đừng thêm khối `renderer` vào `electron.vite.config.js` để "chữa".

---

## 6. Cấu hình then chốt

| File | Khoá | Giá trị | Hậu quả nếu sai |
|---|---|---|---|
| `frontend/vite.config.js` | `base` | `'./'` | Bản đóng gói **màn hình trắng** (đường dẫn tuyệt đối hỏng qua `file://`) |
| | `build.outDir` | `'../backend/renderer'` | Phải copy thủ công |
| | `server.fs.allow` | `['..']` | Dev không đọc được `shared/` |
| `backend/electron-builder.yml` | `files` | `out/**`, `renderer/**`, `package.json` | Thiếu `renderer/**` → màn hình trắng |
| | `asarUnpack` | `"**/*.node"` | Bản đóng gói crash: *Cannot find module ...node* |
| | `directories.output` | `release` | |
| | `npmRebuild` | `false` khi mọi native module là Node-API (mục 6.1) | Đóng gói đi rebuild thứ không cần rebuild → đòi toolchain C++ |
| `backend/package.json` | `postinstall` | `electron-builder install-app-deps` — **chỉ khi** có native module kiểu NAN/ABI cũ (mục 6.1) | `NODE_MODULE_VERSION mismatch` |

Bổ sung:

- Preload phải bundle thành **một file duy nhất**; đường dẫn truyền vào `BrowserWindow` là tuyệt đối (`path.join(__dirname, 'preload.cjs')`).
- **Preload bắt buộc là CommonJS.** `sandbox: true` không nạp được preload dạng ESM — đây là giới hạn của Electron, không phải tuỳ chọn. Nếu `backend/package.json` khai báo `"type": "module"` (Main viết bằng ESM) thì preload **phải** có đuôi `.cjs`, nếu không Node đọc nhầm định dạng và app không khởi động. Trong `electron.vite.config.js`: `preload.build.lib.formats: ['cjs']` + `rollupOptions.output.entryFileNames: 'preload.cjs'`.
- Mặc định `electron-vite` xuất ra `out/main/index.js` và `out/preload/index.js`. Muốn phẳng thành `out/main.js` + `out/preload.cjs` như `backend/package.json` khai báo ở khoá `main` thì phải tự đặt `build.outDir: 'out'` và `rollupOptions.output.entryFileNames` cho **cả hai** target — nhớ để `emptyOutDir: true` ở `main` và `false` ở `preload`, vì hai lần build ghi vào cùng thư mục.
- Dữ liệu **luôn** ghi vào `app.getPath('userData')`, không bao giờ ghi cạnh file `.exe`.

### 6.1. Native module có phải build lại theo ABI của Electron không?

Câu trả lời phụ thuộc **cách gói phát hành binary**, không phải vào việc nó có phải native hay không.
Kiểm tra bằng một lệnh, đừng đoán:

```bash
ls backend/node_modules/<tên-gói>/prebuilds
```

| Thấy gì | Loại | Phải làm gì |
|---|---|---|
| Có `prebuilds/<os>-<arch>.node` | **Node-API (N-API)** — ABI ổn định qua mọi phiên bản Node **và** Electron | **Không** rebuild. Không đặt `postinstall`; đặt `npmRebuild: false` trong `electron-builder.yml`. Vẫn **cần** `asarUnpack: "**/*.node"` |
| Không có `prebuilds/`, chỉ có `binding.gyp` và `build/Release/*.node` | NAN hoặc N-API tự build — binary gắn chặt với `NODE_MODULE_VERSION` | Cần `postinstall: electron-builder install-app-deps`, kèm **Python 3** và **VS Build Tools** trên mọi máy dev |

`better-sqlite3` **từ v12** thuộc nhóm thứ nhất: gói npm đã kèm sẵn `prebuilds/win32-x64.node`
và các nền tảng khác.

> **Cạm bẫy**: `electron-builder install-app-deps` **không** nhận biết Node-API. Nó thấy
> `binding.gyp` là gọi `node-gyp rebuild`, rồi fail với *Could not find any Python installation*
> trên máy không có toolchain C++ — **dù module chạy hoàn hảo mà không cần build gì cả**.
> Đặt `postinstall` trong trường hợp này chỉ làm `npm install` thoát lỗi vô cớ.

---

## 7. Biến môi trường

| Package | Cơ chế | Lưu ý |
|---|---|---|
| `frontend/` | `import.meta.env.VITE_*` | **Giá trị bị nhúng nguyên văn vào bundle** — công khai với mọi người |
| `backend/` | `process.env.*` | Chỉ tồn tại trong tiến trình Main |

- `VITE_` là bộ lọc, **không phải cơ chế bảo mật**. Bí mật phải nằm ở Backend, truy cập qua IPC.
- `.env*` trong `.gitignore`; commit `.env.example` chỉ liệt kê tên biến.
- Phân biệt môi trường bằng `app.isPackaged` (BE) và `import.meta.env.DEV` (FE), **không** dùng `process.env.NODE_ENV` — không đáng tin trong bản đóng gói.
- DevTools chỉ mở khi `!app.isPackaged`.

---

## 8. Content Security Policy

Hai chuỗi riêng, chọn theo `app.isPackaged`. Áp bằng `session.defaultSession.webRequest.onHeadersReceived`, **không** dùng thẻ `<meta>`.

| Môi trường | Yêu cầu |
|---|---|
| Development | Cho phép `http://localhost:5173` và `ws://localhost:5173` (Vite HMR cần cả hai) **và `script-src ... 'unsafe-inline'`** |
| Production | `default-src 'self'`, không `unsafe-eval`, không `unsafe-inline`, không nguồn từ xa |

> **Vì sao dev bắt buộc có `'unsafe-inline'` trong `script-src`**: `@vitejs/plugin-react` chèn preamble của React Refresh vào `<head>` dưới dạng **inline script**. CSP chặn nó thì `main.jsx` không chạy, **cửa sổ trắng trơn và terminal không báo gì** — lỗi chỉ hiện trong console của Renderer. Đây là nới lỏng **chỉ ở nhánh dev**; nhánh production giữ nguyên `script-src 'self'`.
>
> Không nới `'unsafe-eval'` ở bất kỳ môi trường nào — Electron sẽ in cảnh báo bảo mật.

Sau khi bật CSP production, mở DevTools của **bản đóng gói** ít nhất một lần — CSP chặn tài nguyên im lặng, giao diện vỡ mà không báo lỗi.

---

## 9. Môi trường Windows

`better-sqlite3` cần biên dịch native. Nếu `npm install` báo `gyp ERR!` hoặc `MSBuild.exe failed` → thiếu **Visual Studio Build Tools (Desktop development with C++)** và **Python 3**.

| Triệu chứng | Nguyên nhân | Khắc phục |
|---|---|---|
| `gyp ERR!` hoặc `MSBuild.exe failed` khi `npm install` | Thiếu Visual Studio Build Tools (Desktop development with C++) và Python 3 | **Kiểm tra mục 6.1 trước**: nếu gói có `prebuilds/` thì không cần build gì cả, bỏ `postinstall` đi. Chỉ khi thật sự là NAN mới cài toolchain |
| `Error: Electron uninstall` khi chạy dev | `npm install` đã bỏ qua postinstall của gói `electron`, binary chưa được tải về (kiểm tra: `backend/node_modules/electron/dist/` không tồn tại) | `node node_modules/electron/install.js` trong `backend/` |
| `NODE_MODULE_VERSION mismatch` | Native module build theo ABI của Node, không phải của Electron | Chỉ xảy ra với module NAN (mục 6.1): chạy `npx electron-builder install-app-deps` ở `backend/`. Module Node-API không bao giờ gặp lỗi này |

---

## 10. Test bản đóng gói sớm

Toàn bộ lỗi ở mục 6 **không xuất hiện lúc `npm run dev`** — chỉ lộ ra ở bản đóng gói.

**Bắt buộc**: build và cài thử lên máy sạch ngay khi Backend kết nối được SQLite (Phase 2, mục 2.1b của roadmap), rồi build lại sau mỗi phase. Để tới Phase 7 mới build lần đầu thì mọi lỗi ập đến cùng lúc.

### Checklist "build thành công"

- [ ] Cài được trên máy Windows **chưa cài Node.js**
- [ ] Mở app không màn hình trắng
- [ ] `window.api` tồn tại (kiểm bằng cách hiện version app lên UI)
- [ ] Tạo/đọc dữ liệu SQLite thành công (chứng tỏ native module nạp được)
- [ ] File DB nằm trong `%APPDATA%`, không nằm cạnh `.exe`
- [ ] Tắt mở lại — dữ liệu còn nguyên
- [ ] Cài đè bản mới lên bản cũ — migration chạy đúng, dữ liệu không mất
- [ ] Gỡ cài đặt — dữ liệu người dùng vẫn còn (hoặc có hỏi trước)
- [ ] Bản production không mở được DevTools
- [ ] Kích thước file cài 70–120MB (vượt 250MB → `electron` đang nằm nhầm ở `dependencies`)

---

## Tài liệu liên quan

- [Tổng quan kiến trúc](./overview.md)
- [Mô hình bảo mật](./security.md)
- [Khung lộ trình](../04-guidelines/phase-framework.md) — Phase 0 và Phase 7
