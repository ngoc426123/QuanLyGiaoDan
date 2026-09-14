# Tổng quan kiến trúc hệ thống

> **Trạng thái**: Bản quy hoạch (chưa triển khai code)
> **Phạm vi**: Mô hình đa tiến trình của Electron, ranh giới trách nhiệm và luồng dữ liệu tổng thể.

---

## 1. Mục tiêu kiến trúc

| Mục tiêu | Diễn giải |
|---|---|
| **An toàn (Security-first)** | Renderer **không bao giờ** truy cập trực tiếp Node.js, `fs`, hay database. Mọi thao tác đi qua một cổng IPC được kiểm soát. |
| **Tách bạch trách nhiệm** | Giao diện chỉ lo hiển thị; nghiệp vụ và dữ liệu nằm trọn ở Main Process. |
| **Thay thế được** | Đổi thư viện lưu trữ (SQLite → khác) không làm ảnh hưởng tới Renderer, nhờ tầng Repository. |
| **Offline-first** | Ứng dụng chạy hoàn toàn không cần mạng. Mọi dữ liệu nằm cục bộ trên máy người dùng. |
| **Testable** | Tầng Service thuần Node.js, test được mà không cần khởi động Electron. |

---

## 2. Ba vùng thực thi

| Vùng | Chịu trách nhiệm | Tuyệt đối không |
|---|---|---|
| **Main** (Node.js) | Vòng đời app, cửa sổ, menu, dialog, **toàn bộ nghiệp vụ**, DB, file system, đăng ký IPC handler | Chứa logic hiển thị |
| **Preload** | Expose `window.api` dạng whitelist qua `contextBridge` | Chứa nghiệp vụ; expose `ipcRenderer` thô |
| **Renderer** (React) | Render UI, state hiển thị, điều hướng | Truy cập Node, chứa quy tắc nghiệp vụ quyết định tính đúng sai của dữ liệu |

**Quy tắc phân định**: code cần `require('node:...')` thì **phải** ở Main. Validate ở Renderer chỉ để phản hồi nhanh, **không** được coi là lớp bảo vệ — Main luôn validate lại.

---

---

## 3. Cấu hình bảo mật bắt buộc

Khi khởi tạo `BrowserWindow`, các tuỳ chọn sau là **bắt buộc**, không được nới lỏng vì lý do "cho tiện khi dev":

| Tuỳ chọn | Giá trị bắt buộc | Lý do |
|---|---|---|
| `contextIsolation` | `true` | Tách bối cảnh JS của preload khỏi trang web, chống prototype pollution. |
| `nodeIntegration` | `false` | Ngăn trang web gọi thẳng Node.js API. |
| `sandbox` | `true` | Renderer chạy trong sandbox của Chromium. |
| `webSecurity` | `true` | Giữ nguyên same-origin policy. |
| `preload` | đường dẫn tuyệt đối | Điểm vào duy nhất của cầu nối. |

**Các quy tắc bổ sung:**

1. Chặn mọi điều hướng ra ngoài: xử lý `will-navigate` và `setWindowOpenHandler`. Link ngoài mở bằng trình duyệt hệ thống (`shell.openExternal`), không mở trong app.
2. Thiết lập **Content Security Policy** nghiêm ngặt ở production (không `unsafe-eval`, không `unsafe-inline`).
3. Không bao giờ nạp nội dung remote (URL http/https lạ) vào `BrowserWindow` chính.
4. Từ chối mặc định mọi `permission request` (camera, mic, geolocation) trừ khi tính năng thực sự cần.

---

## 4. Luồng dữ liệu

```
Đọc:  component -> hook -> window.api.x.y() -> handler (validate) -> Service -> Repository -> SQL
      -> envelope { ok, data } -> hook cache -> re-render

Ghi:  ... -> Service (transaction) -> envelope -> MAIN phát broadcast 'event:<domain>-changed'
      -> mọi Renderer invalidate cache liên quan
```

**Quy tắc bắt buộc:**

1. Mọi thao tác ghi thành công **phải** phát broadcast event. Lý do: app có thể mở nhiều cửa sổ, và dữ liệu còn đổi do tác vụ nền (import, dọn thùng rác tự động).
2. Renderer nhận event chỉ để **invalidate** cache, **không** ghi đè state bằng payload của event (payload thường rút gọn, ghi đè sẽ làm mất trường).
3. Main chủ động đẩy trạng thái qua `event:import-progress`, `event:update-status`, `event:app-error`.

---

---

## 5. Tổ chức mã nguồn

Dự án tách thành **hai package độc lập** — `frontend/` và `backend/` — mỗi bên có `package.json` và `node_modules` riêng.

> **Cây thư mục đầy đủ và quy trình build**: [project-structure.md](./project-structure.md). Mục này chỉ nêu **quy tắc phụ thuộc**.

### 5.1. Quy tắc phụ thuộc (Dependency Rule)

**Giữa hai package** — cấm import chéo trực tiếp:

```
   frontend/  ----X----  backend/        Không bao giờ import vào nhau
        |                    |
        +----->  shared/  <--+           Cả hai cùng dùng
```

- Kênh giao tiếp duy nhất giữa hai bên là `window.api` (IPC), không phải import.
- `shared/` chỉ chứa JS thuần: **cấm** import `fs`/`path`/`electron` (Frontend sẽ nuốt phải) và **cấm** import `react` (Backend sẽ nuốt phải).

**Bên trong `backend/src/`** — mũi tên là chiều được phép import, cấm ngược chiều:

```
ipc/  -->  services/  -->  repositories/  -->  db/
  |            |                |
  +------------+----------------+-------->  shared/ (gốc repo)
```

- `services/` **không được** import `electron`, để unit test chạy được bằng Node thuần.
- `repositories/` **không được** chứa quy tắc nghiệp vụ (chỉ CRUD và query).
- `ipc/` **không được** nhảy tầng gọi thẳng `repositories/`.

**Bên trong `frontend/src/`**:

```
pages/  -->  features/  -->  components/ui/
```

- `components/ui/` là tầng đáy, không import từ `features/` hay `stores/`.
- Feature A không import vào trong Feature B.

> Toàn bộ các luật trên được **ESLint cưỡng chế**, xem [coding-standards.md §7](../04-guidelines/coding-standards.md).

---

## 6. Vòng đời ứng dụng

| Giai đoạn | Việc cần làm |
|---|---|
| **Khởi động** | Kiểm tra single-instance lock → chạy migration DB → mở kết nối DB → đăng ký IPC handler → tạo cửa sổ. |
| **Sẵn sàng** | Chỉ hiển thị cửa sổ khi sự kiện `ready-to-show` bắn ra (tránh màn hình trắng nhấp nháy). |
| **Chạy** | Xử lý IPC; lưu trạng thái cửa sổ khi resize/move (có debounce). |
| **Tắt** | `before-quit`: flush dữ liệu đang chờ → đóng kết nối DB an toàn → gỡ listener. |

> **Bắt buộc**: Migration phải chạy **xong** trước khi cửa sổ đầu tiên được tạo. Nếu migration lỗi thì hiển thị dialog lỗi và thoát, tuyệt đối không để app chạy với schema sai.

### 6.1. Khoá một phiên bản chạy (Single Instance Lock) — BẮT BUỘC

Đây là quy tắc **không được bỏ qua**, và lý do quan trọng hơn nhiều người nghĩ:

```
Người dùng bấm đúp icon lần thứ hai
        |
   Không có lock  ──▶  Instance thứ 2 khởi động
                          |
                          +──▶ Chạy lại migration trên DB đang được instance 1 dùng
                          +──▶ Mở kết nối ghi thứ hai vào cùng file app.db
                          +──▶ Hai bộ cache giao diện không biết gì về nhau
                          +──▶ SQLITE_BUSY, dữ liệu ghi đè lẫn nhau
```

**Luật:**

1. Gọi `app.requestSingleInstanceLock()` **là việc đầu tiên**, trước cả `app.whenReady()`.
2. Không lấy được lock → `app.quit()` **ngay lập tức**, không mở cửa sổ, không chạy migration, không mở DB.
3. Instance đang chạy bắt sự kiện `second-instance` → khôi phục cửa sổ nếu đang thu nhỏ và đưa lên trước (`restore()` + `focus()`). Người dùng bấm đúp icon lần hai sẽ thấy cửa sổ hiện có, đúng như kỳ vọng.
4. Nếu về sau có tính năng đa cửa sổ (Phase 8), đó là **nhiều cửa sổ trong MỘT tiến trình**, không phải nhiều tiến trình.

### 6.2. Khôi phục vị trí cửa sổ an toàn

Lưu và khôi phục kích thước cửa sổ là tính năng nhỏ nhưng có một cái bẫy kinh điển:

> Người dùng kéo cửa sổ sang màn hình phụ rồi tắt app. Hôm sau rút màn hình phụ ra và mở app.
> Toạ độ đã lưu nằm ngoài vùng hiển thị → **cửa sổ mở ra ở nơi không nhìn thấy**, người dùng tưởng app hỏng.

**Luật**: Trước khi áp dụng toạ độ đã lưu, đối chiếu với danh sách màn hình hiện có (`screen.getAllDisplays()`). Nếu vùng cửa sổ không giao với màn hình nào → bỏ toạ độ cũ, mở ở giữa màn hình chính với kích thước mặc định.

Tương tự: kích thước đã lưu phải được kẹp lại trong khoảng cho phép (không nhỏ hơn kích thước tối thiểu, không lớn hơn màn hình hiện tại).

### 6.3. Xử lý khi Renderer chết hoặc treo

Renderer là tiến trình riêng — nó có thể chết mà Main vẫn sống. Nếu không xử lý, người dùng nhìn thấy một cửa sổ trắng đứng im.

| Sự kiện | Xử lý bắt buộc |
|---|---|
| `render-process-gone` | Ghi log kèm `details.reason`. Hiển thị dialog "Ứng dụng gặp sự cố" với hai lựa chọn: Tải lại / Thoát |
| `unresponsive` | Sau một ngưỡng chờ, hỏi người dùng có muốn tải lại cửa sổ không. **Không** tự ý reload — có thể mất dữ liệu đang nhập dở |
| `responsive` | Đóng dialog cảnh báo nếu đang hiện |
| `preload-error` (trên `webContents`) | Ghi log — đây là lỗi nghiêm trọng, `window.api` sẽ không tồn tại và app coi như không dùng được |

> **Ghi chú**: Main Process chết thì toàn bộ app chết. Vì vậy mọi thao tác nặng ở Main phải tuân thủ [data-services.md §7](../02-backend-data/data-services.md) — đẩy sang `worker_threads` khi vượt 300ms.

---

## 7. Nguyên tắc ra quyết định khi mở rộng

Khi thêm một tính năng mới, tự trả lời theo thứ tự:

1. Tính năng có cần chạm vào file / DB / OS không? → **Có**: viết ở Main. **Không**: viết ở Renderer.
2. Nếu ở Main, nó là *nghiệp vụ* hay *truy vấn*? → nghiệp vụ vào `services/`, truy vấn vào `repositories/`.
3. Cần kênh IPC mới không? → Nếu có, khai báo tên kênh trong `shared/channels.js` **trước**, rồi mới viết handler và preload.
4. UI có cần biết khi dữ liệu đổi từ nơi khác không? → Nếu có, thêm broadcast event.

---

## Tài liệu liên quan

- [Quy tắc giao tiếp IPC](./ipc-communication.md)
- [Chiến lược lưu trữ](../02-backend-data/storage-strategy.md)
- [Cấu trúc giao diện](../03-frontend/ui-structure.md)
