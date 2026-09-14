# Phase 1 — Xương sống IPC

> **Mục tiêu**: Chứng minh đường ống Renderer → Preload → Main → Service → về lại Renderer
> hoạt động đúng, **trước khi** có database.
>
> **Ước lượng**: 1–2 ngày · **Tiền đề**: Phase 0 đạt đủ Definition of Done

**Đọc trước**: `docs/01-architecture/ipc-communication.md` (toàn bộ), `docs/02-backend-data/data-services.md` §5 (xử lý lỗi).

> **Đây là phase quan trọng nhất của dự án** (`docs/04-guidelines/phase-framework.md`). Đường ống này sẽ được dùng lại
> hàng trăm lần. Làm ẩu ở đây thì mọi tính năng sau đều thừa hưởng cái ẩu đó.
>
> Phase này **chưa chạm tới `zones` / `families` / `persons`**. Chỉ dựng cơ chế, dùng `app:*` để kiểm chứng.

---

## 1.1 — `shared/channels.js`

Khai báo **toàn bộ** tên kênh dưới dạng hằng số. Đây là **nguồn chân lý duy nhất**
(`ipc-communication.md` §2.3) — cấm magic string ở bất kỳ đâu khác.

Cấu trúc, theo đúng danh mục đã chốt ở [00-domain-lock-in.md](./00-domain-lock-in.md) §5:

```
CHANNELS = {
  ZONE:          { LIST, GET_BY_ID, CREATE, UPDATE, REMOVE },
  FAMILY:        { LIST, GET_BY_ID, CREATE, UPDATE, REMOVE },
  PERSON:        { LIST, GET_BY_ID, CREATE, UPDATE, REMOVE },
  FAMILY_MEMBER: { ADD, UPDATE, MOVE, REMOVE },
  APP:           { GET_VERSION, GET_PATHS, OPEN_EXTERNAL, SHOW_OPEN_DIALOG, SHOW_SAVE_DIALOG },
  SETTING:       { GET_ALL, SET },
  EVENTS:        { ZONE_CHANGED, FAMILY_CHANGED, PERSON_CHANGED, APP_ERROR, UPDATE_STATUS },
}
```

Quy ước tên (§2.1):

| Loại             | Cú pháp                    | Ví dụ                  |
| ---------------- | -------------------------- | ---------------------- |
| Request/Response | `<domain>:<action>`        | `person:create`        |
| Event            | `event:<domain>-<quá khứ>` | `event:person-changed` |

- `domain` — danh từ **số ít, kebab-case**: `person`, `family`, `zone`, `family-member`
- `action` — động từ camelCase: `list`, `getById`, `create`, `update`, `remove`
- **Dùng `remove`, không dùng `delete`** — `delete` là từ khoá JS

> Khai báo **đủ cả nhóm** ngay từ Phase 1, kể cả kênh chưa có handler. Hằng số không tốn gì,
> mà tránh việc mỗi phase lại đi sửa file này.

---

## 1.2 — `shared/errors.js`

Tám mã lỗi chuẩn (`ipc-communication.md` §6) + lớp `AppError`:

| `code`                  | Khi nào ném                                                | Renderer làm gì                                        |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `VALIDATION_ERROR`      | Payload sai hình dạng                                      | Hiện lỗi tại trường trong form (`details.fieldErrors`) |
| `NOT_FOUND`             | Bản ghi không tồn tại                                      | Điều hướng về danh sách kèm toast                      |
| `CONFLICT`              | Trùng giá trị duy nhất **hoặc** bản ghi đã bị sửa nơi khác | Trùng: yêu cầu đổi. Chồng chéo: xử lý theo §4b.2       |
| `FOREIGN_KEY_VIOLATION` | Xoá bản ghi đang được tham chiếu                           | Hỏi người dùng chọn chiến lược                         |
| `DB_ERROR`              | Lỗi tầng DB                                                | Toast chung + gợi ý thử lại                            |
| `IO_ERROR`              | Lỗi đọc/ghi file                                           | Toast kèm đường dẫn                                    |
| `PERMISSION_DENIED`     | Không đủ quyền hệ thống                                    | Hướng dẫn cấp quyền                                    |
| `UNKNOWN_ERROR`         | Không phân loại được                                       | Toast chung + ghi log                                  |

`AppError` mang `code`, `message` (**tiếng Việt, hiển thị được trực tiếp**), `details`.

> `shared/` là JS thuần: **cấm** import `fs`, `path`, `electron`, `react` (`project-structure.md` §3).

---

## 1.3 — Hàm dựng envelope

**File**: `backend/src/main/ipc/envelope.js`

Hai hình dạng, không có hình dạng thứ ba (`ipc-communication.md` §3):

```
thành công:  { ok: true,  data, meta? }
thất bại:    { ok: false, error: { code, message, details? } }
```

Kèm `toErrorEnvelope(err)` dùng chung:

| Loại lỗi đầu vào | Ra                                         |
| ---------------- | ------------------------------------------ |
| `AppError`       | envelope đúng `code` của nó                |
| `ZodError`       | `VALIDATION_ERROR` + `details.fieldErrors` |
| Lỗi SQLite       | ánh xạ theo `data-services.md` §5.3        |
| Còn lại          | `UNKNOWN_ERROR`                            |

**Stack trace chỉ ghi vào log của Main, không gửi sang Renderer ở bản production** (§3.3).

---

## 1.4 — Bộ đăng ký handler

**File**: `backend/src/main/ipc/index.js`

Mỗi handler đi đúng 5 bước, không bỏ bước nào (`ipc-communication.md` §8):

```
1. Nhận payload
2. VALIDATE bằng schema      → sai thì trả VALIDATION_ERROR ngay
3. Gọi Service               (handler KHÔNG chứa nghiệp vụ)
4. Bọc kết quả vào envelope  { ok: true, data }
5. Nếu là thao tác ghi       → phát broadcast event
```

Ràng buộc:

- Toàn bộ thân handler nằm trong `try/catch`. **Không bao giờ throw xuyên ranh giới IPC.**
- **Không tin payload từ Renderer** kể cả khi UI đã validate — Renderer có thể bị thao túng qua DevTools.
- Handler phải **idempotent** với thao tác xoá: xoá một `id` đã bị xoá vẫn trả `ok: true`.
- Mỗi kênh chỉ được `handle` **một lần**. Đăng ký trùng ném lỗi lúc khởi động — **đây là hành vi mong muốn**, không được bọc `try/catch` để giấu đi.
- **Cấm `ipcRenderer.sendSync`** — block toàn bộ luồng render.

---

## 1.5 — Zod + schema mẫu

> **Cài dependency mới → phải hỏi trước** (`recipes.md` Công thức 6). `zod` đã được `CLAUDE.md`
> chốt sẵn nên không cần hỏi lại, nhưng đặt đúng chỗ: **`backend/devDependencies`**
> (JS thuần, bundler nhét được vào `out/main.js`).

**File**: `backend/src/schemas/app.schema.js`

Quy ước schema (`data-services.md` §4.2):

- `.strict()` — từ chối trường lạ
- Thông điệp lỗi **tiếng Việt**
- Một schema cho mỗi kênh, đặt tên theo kênh

Ghép vào handler ở bước 2. Kiểm chứng: gửi payload thừa một trường → phải nhận `VALIDATION_ERROR`.

---

## 1.6 — Hoàn thiện preload

**File**: `backend/src/preload/index.js` (mở rộng từ Phase 0)

Sáu luật bắt buộc (`ipc-communication.md` §7.1):

1. Chỉ expose **một** object gốc: `window.api`
2. Nhóm theo domain, phản chiếu 1-1 danh mục kênh: `window.api.person.list()`, `window.api.app.getVersion()`
3. Mỗi hàm là **wrapper cố định tên kênh** — tên kênh **không** nhận từ tham số của Renderer
4. `Object.freeze` object expose
5. Hàm đăng ký listener **phải trả về hàm huỷ đăng ký** — để `useEffect` cleanup được
6. Listener chỉ nhận `payload`, **không** truyền object `event` của Electron sang Renderer (nó chứa tham chiếu tới `sender`, rò rỉ quyền)

Cấm tuyệt đối (§7.2): expose `invoke(channel, data)` động, expose nguyên `ipcRenderer`, expose module Node.

---

## 1.7 — Nhóm `app:*`

| Kênh                 | Trả về                            | Ghi chú                                                                     |
| -------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| `app:getVersion`     | `{ app, electron, node, chrome }` |                                                                             |
| `app:getPaths`       | `{ userData, dbFile, logs }`      | Dùng `app.getPath()`, không hardcode                                        |
| `app:openExternal`   | `{ opened: boolean }`             | **Bắt buộc whitelist giao thức `https:`** — chặn `javascript:` và `file://` |
| `app:showOpenDialog` | `{ canceled, filePaths }`         |                                                                             |
| `app:showSaveDialog` | `{ canceled, filePath }`          |                                                                             |

> `app:*` handler được phép gọi `electron` trực tiếp vì nó nằm ở tầng `ipc/`.
> Từ Phase 2 trở đi, **`services/` không được import `electron`** — cần đường dẫn thì **nhận qua tham số** (`data-services.md` §3.2).

---

## 1.8 — Broadcast event

**File**: `backend/src/main/ipc/broadcast.js`

- Gửi tới **mọi** `BrowserWindow` đang mở (`webContents.send`), không chỉ cửa sổ gọi.
- Hàm đăng ký phía preload trả về hàm huỷ.
- Phát ở **bước 5 của handler**, sau khi Service trả về thành công.

Kiểm chứng ở phase này: dựng một kênh giả phát event, xác nhận Renderer nhận được và huỷ đăng ký chạy đúng.

---

## 1.9 — `backend/src/main/security.js`

| Việc                   | Chi tiết                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Chặn `will-navigate`   | Điều hướng ra ngoài → chặn                                                                                                              |
| `setWindowOpenHandler` | Trả `{ action: 'deny' }`; link ngoài mở bằng `shell.openExternal`                                                                       |
| CSP                    | Hai chuỗi riêng, chọn theo `app.isPackaged`. Áp bằng `session.defaultSession.webRequest.onHeadersReceived`, **không** dùng thẻ `<meta>` |
| Permission request     | **Từ chối mặc định** mọi yêu cầu camera/mic/geolocation                                                                                 |

CSP (`project-structure.md` §8):

| Môi trường  | Yêu cầu                                                                             |
| ----------- | ----------------------------------------------------------------------------------- |
| Development | Cho phép `http://localhost:5173` **và** `ws://localhost:5173` (Vite HMR cần cả hai) |
| Production  | `default-src 'self'`, không `unsafe-eval`, không `unsafe-inline`, không nguồn từ xa |

> CSP production để **Phase 7** bật và kiểm chứng trên bản đóng gói. Phase này viết sẵn cả hai chuỗi.

---

## Definition of Done

- [x] Gọi được `window.api.app.getVersion()` và nhận đúng envelope `{ ok: true, data }`
- [x] Gửi payload sai schema → nhận đúng `VALIDATION_ERROR` kèm `details.fieldErrors`
- [x] Gửi payload thừa một trường → cũng bị chặn (schema `.strict()`)
- [x] Ném lỗi trong Service → Renderer nhận envelope lỗi, **app không sập**
- [x] Gọi kênh không tồn tại → báo lỗi rõ ràng, không treo vô hạn
- [x] Đăng ký trùng một kênh → app ném lỗi lúc khởi động (hành vi đúng)
- [x] Thử mở link ngoài → mở bằng trình duyệt hệ thống, không mở trong app — _điều hướng trong app đã kiểm chứng là bị chặn (kể cả URL giả mạo tiền tố dev server); phần cửa sổ trình duyệt bật lên thì kiểm bằng mắt qua nút trong bảng kiểm chứng_
- [x] Thử `app:openExternal` với `javascript:alert(1)` → bị từ chối
- [x] Phát broadcast event → Renderer nhận được; gọi hàm huỷ → không nhận nữa
- [x] `window.require` trong DevTools → `undefined`
- [x] Không có chuỗi tên kênh nào viết trực tiếp ngoài `shared/channels.js`
- [x] `npm run lint` + `npm run format:check` sạch cả hai package

---

## Cạm bẫy của phase này

| Cạm bẫy                                          | Hệ quả                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Expose `invoke(channel, data)` động "cho tiện"   | Renderer gọi được **mọi** kênh kể cả kênh nội bộ — thủng toàn bộ mô hình bảo mật |
| Quên `Object.freeze`                             | Trang web ghi đè được hàm trong `window.api`                                     |
| Listener trả về `undefined` thay vì hàm huỷ      | `useEffect` không cleanup được → mỗi lần hot-reload chồng thêm một listener      |
| Truyền object `event` của Electron sang Renderer | Rò rỉ tham chiếu `sender`                                                        |
| Bọc `try/catch` quanh việc đăng ký handler       | Giấu mất lỗi đăng ký trùng kênh                                                  |
| Ném lỗi thẳng ra khỏi handler                    | Electron nuốt stack trace, Renderer nhận thông báo vô nghĩa                      |

---

## Docs phải cập nhật trong phase này

| Thay đổi                                      | File                                                                |
| --------------------------------------------- | ------------------------------------------------------------------- |
| Danh mục kênh (nếu phát sinh khác §5 đã chốt) | `docs/01-architecture/ipc-communication.md` §5                      |
| Mã lỗi mới (nếu có)                           | `docs/01-architecture/ipc-communication.md` §6 + `shared/errors.js` |

**Xong → [phase-2-data-layer.md](./phase-2-data-layer.md)**
