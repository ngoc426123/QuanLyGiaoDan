# Phase 3 — Bộ khung giao diện

> **Mục tiêu**: App Shell hoàn chỉnh với điều hướng, theme và design token — **dùng dữ liệu giả**.
> Chưa gọi dữ liệu thật, chưa có form.
>
> **Ước lượng**: 2–3 ngày · **Tiền đề**: Phase 2 đạt đủ Definition of Done

**Đọc trước**: `docs/03-frontend/ui-structure.md`, `docs/03-frontend/state-management.md`,
`docs/04-guidelines/coding-standards-frontend.md`.

> Phase này cố tình **tách khỏi dữ liệu thật**. Dựng xong khung rồi mới đổ nghiệp vụ vào ở Phase 4.

---

## 3.1 — `frontend/src/styles/tokens.css`

Toàn bộ giá trị thiết kế khai báo dưới dạng CSS custom property trên `:root`.
**Cấm hardcode màu / khoảng cách / cỡ chữ / `z-index` trong component.**

Danh mục token (`ui-structure.md` §5.1) — khai báo **đủ cả nhóm** ngay từ đầu:

| Nhóm          | Tiền tố                    | Ví dụ                                                                    |
| ------------- | -------------------------- | ------------------------------------------------------------------------ |
| Màu nền       | `--color-bg-*`             | `--color-bg-base`, `--color-bg-subtle`, `--color-bg-hover`               |
| Màu chữ       | `--color-text-*`           | `--color-text-primary`, `--color-text-muted`                             |
| Màu viền      | `--color-border-*`         | `--color-border-default`, `--color-border-focus`                         |
| Màu ngữ nghĩa | `--color-<ý nghĩa>`        | `--color-accent`, `--color-danger`, `--color-success`, `--color-warning` |
| Khoảng cách   | `--space-<n>`              | Thang 4px: `--space-1` = 4px … `--space-8` = 32px                        |
| Bo góc        | `--radius-*`               | `--radius-sm`, `--radius-md`, `--radius-full`                            |
| Cỡ chữ        | `--font-size-*`            | `--font-size-xs` … `--font-size-xl`                                      |
| Độ đậm        | `--font-weight-*`          | `--font-weight-normal`, `--font-weight-medium`                           |
| Đổ bóng       | `--shadow-*`               | `--shadow-sm`, `--shadow-popover`                                        |
| Lớp chồng     | `--z-*`                    | `--z-dropdown: 100`, `--z-modal: 400`, `--z-toast: 500`                  |
| Chuyển động   | `--duration-*`, `--ease-*` | `--duration-fast: 120ms`                                                 |

**Chế độ sáng/tối** (§5.2): bộ sáng trên `:root`, bộ tối dưới `[data-theme="dark"]`.

**Font** (§5.3) — ngăn xếp font hệ thống, hiển thị tiếng Việt chuẩn:

```
--font-sans: "Segoe UI Variable", "Segoe UI", -apple-system,
             BlinkMacSystemFont, "Inter", "Noto Sans", system-ui, sans-serif;
--font-mono: "Cascadia Code", "SF Mono", Consolas, monospace;
```

---

## 3.2 — Reset CSS + style toàn cục

**File**: `frontend/src/styles/global.css`

| Luật                                                    | Lý do                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `html`, `body`: `overflow: hidden`, `height: 100%`      | **Toàn bộ trang không bao giờ cuộn** (`ui-structure.md` §2.2) |
| Chỉ Sidebar và Content Area có `overflow-y: auto` riêng |                                                               |
| Hỗ trợ `prefers-reduced-motion`                         | Tắt animation khi người dùng yêu cầu (§6)                     |
| **Không bao giờ** `outline: none` mà không có thay thế  | Dùng `:focus-visible` (§6)                                    |

---

## 3.3 — App Shell

**File**: `frontend/src/components/layout/` — `AppShell.jsx`, `AppSidebar.jsx`, `AppTopBar.jsx`,
`AppStatusBar.jsx`, `OverlayRoot.jsx`

```
┌───────────────────────────────────────────────────────────────────┐
│  TITLE BAR (tuỳ chọn)                                   – □ ×     │
├──────────────┬────────────────────────────────────────────────────┤
│              │  TOP BAR                                           │
│   SIDEBAR    │  [tiêu đề màn hình] [ô tìm kiếm] [lọc] [+ Thêm]    │
│              ├────────────────────────────────────────────────────┤
│ • Tổng quan  │                                                    │
│ • Giáo dân   │              CONTENT AREA                          │
│ • Gia đình   │         (vùng cuộn độc lập)                        │
│ • Giáo họ    │                                                    │
│  ─────────   ├────────────────────────────────────────────────────┤
│ ⚙ Cài đặt    │  STATUS BAR (số lượng, chỉ báo lỗi)                │
└──────────────┴────────────────────────────────────────────────────┘
```

| Vùng      | Component          | Trách nhiệm                                           |
| --------- | ------------------ | ----------------------------------------------------- |
| Sidebar   | `<AppSidebar />`   | Điều hướng chính                                      |
| TopBar    | `<AppTopBar />`    | Tiêu đề màn hình, tìm kiếm, bộ lọc, hành động chính   |
| Content   | `<Outlet />`       | Nội dung theo route                                   |
| StatusBar | `<AppStatusBar />` | Tổng số giáo dân / hộ, chỉ báo lỗi                    |
| Overlays  | `<OverlayRoot />`  | Modal, drawer, toast, context menu — qua React Portal |

Kích thước (§1): mặc định 1280×800 · tối thiểu **940×600** · dưới 1080px sidebar tự thu thành dải icon.

---

## 3.4 — Router

**File**: `frontend/src/App.jsx`, `frontend/src/pages/`

**Bắt buộc `HashRouter`**, không dùng `BrowserRouter` — app đóng gói chạy qua `file://`,
`BrowserRouter` sẽ hỏng khi tải lại trang (`state-management.md` §6.2).

Tạo **đủ** route theo bản đồ màn hình đã chốt ([00-domain-lock-in.md](./00-domain-lock-in.md) §6),
mỗi route một page rỗng có tiêu đề:

| Route           | Page                   | Ưu tiên |
| --------------- | ---------------------- | ------- |
| `/`             | `DashboardPage.jsx`    | P0      |
| `/persons`      | `PersonListPage.jsx`   | P0      |
| `/persons/:id`  | `PersonDetailPage.jsx` | P0      |
| `/families`     | `FamilyListPage.jsx`   | P0      |
| `/families/:id` | `FamilyDetailPage.jsx` | P0      |
| `/zones`        | `ZoneListPage.jsx`     | P1      |
| `/zones/:id`    | `ZoneDetailPage.jsx`   | P1      |
| `/search`       | `SearchPage.jsx`       | P1      |
| `/trash`        | `TrashPage.jsx`        | P2      |
| `/settings`     | `SettingsPage.jsx`     | P1      |

**Page phải mỏng (< 150 dòng)** — chỉ lắp ráp, không chứa logic dữ liệu.

---

## 3.5 — UI primitives

**File**: `frontend/src/components/ui/`

Bộ tối thiểu cho Phase 4 dùng lại:

| Component                                         | Ghi chú                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `Button`                                          | Hỗ trợ `disabled` + trạng thái đang chạy                                 |
| `Input`, `Select`, `DateInput`                    | `DateInput` làm việc với chuỗi `YYYY-MM-DD`, **không** với object `Date` |
| `Modal`, `Drawer`                                 | Bẫy focus, `Esc` đóng, đóng xong trả focus về nơi kích hoạt              |
| `Toast`                                           | `role="status"` / `role="alert"`                                         |
| `EmptyState`, `ErrorState`, `Spinner`, `Skeleton` | Bốn trạng thái ngoài `success`                                           |
| `VirtualList`                                     | Danh sách trên 200 phần tử **phải** dùng                                 |
| `Table`                                           | Dùng chung cho 3 màn hình danh sách                                      |
| `ConfirmDialog`                                   | Xác nhận trước khi xoá                                                   |

**Ràng buộc cốt lõi** (`ui-structure.md` §4):

- `components/ui/` **không** import từ `features/`, `pages/`, `stores/`
- **không** gọi `window.api`. Dữ liệu vào qua props, hành động ra qua callback
- Component **named export**, không `export default`
- Một component chính trên một file, tối đa **200 dòng**

---

## 3.6 — TanStack Query + Zustand

**File cần tạo**:

| File                                     | Nội dung                                                 |
| ---------------------------------------- | -------------------------------------------------------- |
| `frontend/src/shared/invoke.js`          | Lớp bọc envelope — xem dưới                              |
| `frontend/src/shared/queryKeys.js`       | `zoneKeys`, `familyKeys`, `personKeys`, `settingKeys`    |
| `frontend/src/stores/ui.store.js`        | `theme`, `isSidebarCollapsed`, `sidebarWidth`, `density` |
| `frontend/src/stores/overlay.store.js`   | Ngăn xếp modal/drawer đang mở                            |
| `frontend/src/stores/filter.store.js`    | Bộ lọc và sắp xếp hiện hành                              |
| `frontend/src/stores/selection.store.js` | Tập id đang chọn                                         |
| `frontend/src/stores/toast.store.js`     | Hàng đợi thông báo                                       |

**`invoke.js`** — bắt buộc, vì `window.api` trả envelope còn TanStack Query hiểu lỗi qua **throw**:

```
Nhận envelope
  ├── ok === true   → trả về envelope.data
  └── ok === false  → throw AppClientError(error.code, error.message, error.details)
```

Toàn bộ `queryFn` và `mutationFn` **phải** đi qua hàm này.

**`queryKeys.js`** — mẫu phân cấp, một bộ cho mỗi domain:

```
personKeys = {
  all:     ['person'],
  lists:   ['person', 'list'],
  list:    (filters) => ['person', 'list', filters],
  details: ['person', 'detail'],
  detail:  (id) => ['person', 'detail', id],
}
```

**Cấm viết mảng key trực tiếp trong component.**

**Cấu hình mặc định QueryClient** (`state-management.md` §2.2) — khác hẳn app web:

| Tuỳ chọn               | Giá trị      | Lý do                                                                |
| ---------------------- | ------------ | -------------------------------------------------------------------- |
| `staleTime`            | `30_000`     | Dữ liệu chỉ đổi khi chính app này ghi, lúc đó đã chủ động invalidate |
| `gcTime`               | `5 * 60_000` |                                                                      |
| `retry`                | `0`          | Truy vấn cục bộ thất bại thì thử lại vô ích. Lỗi thật cần hiện ra    |
| `refetchOnWindowFocus` | `false`      | Đã có broadcast event lo đồng bộ                                     |
| `refetchOnReconnect`   | `false`      | Không liên quan tới mạng                                             |

**Không có `usePersonStore` / `useFamilyStore`.** Dữ liệu nghiệp vụ thuộc TanStack Query.
**Cấm sao chép dữ liệu server vào Zustand** (§1.2).

**Luật viết store** (§5.2): luôn dùng **selector**, không lấy nguyên store — lấy nguyên store
thì re-render mỗi khi **bất kỳ** trường nào đổi.

---

## 3.7 — Theme

| Việc                | Chi tiết                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ba chế độ           | `light` / `dark` / `system`                                                                                                                                |
| `system`            | Theo dõi `prefers-color-scheme`, cập nhật ngay khi OS đổi                                                                                                  |
| Áp dụng             | Gán `data-theme` vào `document.documentElement` **trước lần render đầu tiên**                                                                              |
| **Chống nhấp nháy** | `theme` đọc từ DB nên không có ngay. Ghi đệm giá trị lần trước vào `localStorage`, áp ngay lúc HTML load, sau đó đồng bộ lại với giá trị thật từ DB (§5.3) |

**Bền hoá** (§5.3):

| State                                | Lưu ở đâu                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `theme`, `density`, `language`       | **Bảng `settings` trong SQLite** (qua `setting:set`) — là cấu hình thật, cần backup cùng dữ liệu |
| `sidebarWidth`, `isSidebarCollapsed` | `localStorage` — thuộc từng máy, mất cũng không sao                                              |
| Bộ lọc, lựa chọn, overlay đang mở    | Không lưu                                                                                        |

---

## 3.8 — Trạng thái cửa sổ

**File**: `backend/src/main/window-manager.js` + `window-state.json` trong `userData`

Lưu JSON riêng, **không** lưu trong DB — cần đọc **trước khi** mở DB (`storage-strategy.md` §2).

**Khôi phục an toàn** (`overview.md` §6.2): đối chiếu `screen.getAllDisplays()`.
Toạ độ nằm ngoài mọi màn hình → **bỏ, mở giữa màn hình chính**.
Không có bước này thì người dùng tháo màn hình phụ ra là app mở vào hư vô.

---

## 3.9 — Error Boundary hai cấp

| Cấp | Bọc                 | Mục đích                                      |
| --- | ------------------- | --------------------------------------------- |
| 1   | Toàn app            | Lỗi render không lường trước                  |
| 2   | Riêng vùng nội dung | Một màn hình lỗi **không làm sập cả sidebar** |

Bốn mức xử lý lỗi (`state-management.md` §8.1) — dựng đủ khung ở phase này:

| Mức           | Xử lý bởi                                       | Cho                   |
| ------------- | ----------------------------------------------- | --------------------- |
| Theo trường   | Component form, đọc `error.details.fieldErrors` | `VALIDATION_ERROR`    |
| Theo thao tác | Toast từ `useToastStore`                        | Thao tác ghi thất bại |
| Theo màn hình | `<ErrorState />` + nút "Thử lại"                | Truy vấn đọc thất bại |
| Toàn ứng dụng | Error Boundary                                  | Lỗi render            |

Thông điệp lấy từ `error.message` do Main gửi sang (đã là tiếng Việt), **không tự chế lại**.
Phân nhánh theo `error.code`, **tuyệt đối không so khớp `error.message`**.

---

## Definition of Done

Bằng chứng và giới hạn: [báo cáo Phase 3](../project/phase-3-review.md). Các mục để trống
là chưa kiểm chứng đầy đủ, không suy diễn từ test mô phỏng sang Electron thật.

- [x] Thu nhỏ cửa sổ xuống **940×600** — layout không vỡ (việc còn nợ từ Phase 0)
- [x] Điều hướng qua lại giữa **tất cả** route mượt, sidebar đánh dấu đúng mục đang mở
- [ ] Đổi theme áp dụng tức thì, khởi động lại vẫn nhớ, **không nháy trắng** lúc mở app
- [x] Thu nhỏ cửa sổ về 940×600 — bố cục không vỡ, sidebar thu thành dải icon dưới 1080px
- [ ] Đóng app rồi mở lại — cửa sổ về đúng vị trí và kích thước cũ
- [ ] Tháo màn hình phụ rồi mở app → cửa sổ mở giữa màn hình chính, không mất tích
- [x] **Không có giá trị màu / khoảng cách / cỡ chữ / `z-index` nào hardcode** trong component
- [x] Ném lỗi thử trong một màn hình → Error Boundary bắt được, **sidebar vẫn dùng được**
- [x] Toàn bộ chuỗi hiển thị là tiếng Việt, không còn chuỗi tiếng Anh sót lại
- [x] Trang không bao giờ cuộn — chỉ Sidebar và Content cuộn riêng
- [ ] Điều hướng được hoàn toàn bằng bàn phím, focus ring rõ ràng ở cả hai theme
- [x] Độ tương phản đạt **4.5:1** ở cả hai theme
- [x] `npm run lint` + `npm run format:check` sạch

---

## Cạm bẫy của phase này

| Cạm bẫy                                    | Hệ quả                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Dùng `BrowserRouter`                       | Bản đóng gói hỏng khi tải lại trang                                       |
| Quên áp theme trước render đầu             | Nháy trắng mỗi lần mở app ở chế độ tối                                    |
| Lấy nguyên store Zustand thay vì selector  | Re-render toàn bộ khi bất kỳ trường nào đổi — giật rõ rệt khi kéo sidebar |
| Copy dữ liệu server vào Zustand "cho tiện" | Dữ liệu cũ dần, không biết cũ tới mức nào                                 |
| Hardcode một màu "tạm thời"                | Chế độ tối vỡ, và không ai nhớ quay lại sửa                               |
| `outline: none` cho đẹp                    | Mất hoàn toàn khả năng dùng bàn phím                                      |
| Page chứa logic dữ liệu                    | Vượt 150 dòng, khó test, khó tái sử dụng                                  |

---

## Docs phải cập nhật trong phase này

| Thay đổi         | File                                        |
| ---------------- | ------------------------------------------- |
| Design token mới | `docs/03-frontend/ui-structure.md` §5.1     |
| Route mới        | `docs/03-frontend/ui-structure.md` §3       |
| Phím tắt mới     | `docs/03-frontend/ui-structure.md` §7       |
| Store mới        | `docs/03-frontend/state-management.md` §5.1 |

**Xong → [phase-4-core-crud.md](./phase-4-core-crud.md)**

## Phạm vi triển khai đã xác định — 2026-09-13

- Người dùng chốt chỉ tiếng Việt, cho phép package và bộ test, làm trực tiếp trên develop.
- Hoàn thiện `setting:getAll`, `setting:set` theo hợp đồng có sẵn: schema, repository,
  service, IPC, preload; thêm sự kiện đổi cài đặt và hook frontend tương ứng.
- Di chuyển thao tác xuất/nhập đã có vào Cài đặt, qua API wrapper + mutation hook.
- File hỗ trợ App Shell: metadata route, dữ liệu minh hoạ, hook theme, hook phím tắt,
  Error Boundary, CSS Module, cấu hình và test UI. Không thêm màn hình ngoài bản đồ.
- Người dùng cho phép cập nhật template: bổ sung danh mục token dùng chung tại
  `docs/03-frontend/ui-structure.md` §5.1a, tăng TEMPLATE_VERSION lên 1.8.0, ghi CHANGELOG;
  đã sửa template gốc rồi đồng bộ về dự án. Giá trị thiết kế cụ thể giữ trong tokens.css.
