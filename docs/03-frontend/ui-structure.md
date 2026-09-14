# Cấu trúc giao diện (UI Structure)

> **Công nghệ**: React 18 + Vite, chạy trong Renderer Process.
> **Nguyên tắc nền**: Renderer chỉ biết hiển thị. Mọi dữ liệu đến từ `window.api`, không có kết nối trực tiếp nào tới DB hay file system.

---

## 1. Khác biệt với một ứng dụng web

Đây không phải website. Những điểm phải nhớ khi thiết kế UI desktop:

| Khía cạnh | Web | Ứng dụng desktop này |
|---|---|---|
| Điều hướng | URL, nút back của trình duyệt | `HashRouter`, không có thanh địa chỉ. Phím tắt quan trọng hơn breadcrumb |
| Bố cục | Cuộn dọc theo trang | **Chiều cao cố định 100vh**, các vùng cuộn độc lập bên trong |
| Trạng thái tải | Spinner là bình thường | Dữ liệu cục bộ rất nhanh → spinner nhấp nháy gây khó chịu. Dùng ngưỡng trễ |
| Kích thước cửa sổ | Responsive theo thiết bị | Người dùng kéo thu nhỏ tuỳ ý → phải chịu được chiều rộng tối thiểu |
| Chuột phải | Menu của trình duyệt | Context menu riêng của ứng dụng |
| Font | Web font | Ưu tiên **font hệ thống** để hoà hợp với OS |

**Kích thước cửa sổ quy định:**

| Thông số | Giá trị |
|---|---|
| Tối thiểu | 940 × 600 px |
| Mặc định lần đầu | 1280 × 800 px |
| Ngưỡng thu gọn sidebar | < 1080 px → sidebar tự thu thành dải icon |

---

## 2. Khung bố cục tổng thể (App Shell)

```
┌───────────────────────────────────────────────────────────────────┐
│  TITLE BAR  (tuỳ chọn: thanh tiêu đề tuỳ biến)          – □ ×     │
├──────────────┬────────────────────────────────────────────────────┤
│              │  TOP BAR                                           │
│   SIDEBAR    │  [tiêu đề màn hình] [ô tìm kiếm] [lọc] [+ Thêm]    │
│              ├────────────────────────────────────────────────────┤
│  • Tổng quan │                                                    │
│  • Mục lục A │                                                    │
│  • Mục lục B │              CONTENT AREA                          │
│  ─────────   │         (vùng cuộn độc lập)                        │
│  Nhóm 1      │                                                    │
│   • Mục A    │                                                    │
│   • Mục B    │                                                    │
│  ─────────   │                                                    │
│  Nhóm 2      │                                                    │
│  ─────────   ├────────────────────────────────────────────────────┤
│  ⚙ Cài đặt   │  STATUS BAR  (số lượng, trạng thái đồng bộ, lỗi)   │
└──────────────┴────────────────────────────────────────────────────┘
                                    ┌──────────────────┐
        Lớp phủ (overlay):          │  DETAIL PANEL    │  trượt từ phải
        Modal / Drawer / Toast      │  (chi tiết mục)  │
        / Command Palette           └──────────────────┘
```

### 2.1. Các vùng và trách nhiệm

| Vùng | Component | Trách nhiệm |
|---|---|---|
| `TitleBar` | `<AppTitleBar />` | Thanh tiêu đề tuỳ biến (nếu dùng `frame: false`), nút thu/phóng/đóng |
| `Sidebar` | `<AppSidebar />` | Điều hướng chính, danh sách nhóm, kéo-thả sắp xếp |
| `TopBar` | `<AppTopBar />` | Tiêu đề màn hình hiện tại, tìm kiếm, bộ lọc, hành động chính |
| `Content` | `<Outlet />` | Nội dung màn hình theo route |
| `StatusBar` | `<AppStatusBar />` | Thông tin phụ, tiến độ tác vụ nền, chỉ báo lỗi |
| `Overlays` | `<OverlayRoot />` | Modal, drawer, toast, context menu — render qua React Portal |

### 2.2. Quy tắc cuộn

- `<html>` và `<body>` đặt `overflow: hidden`, chiều cao `100%`. **Toàn bộ trang không bao giờ cuộn.**
- Chỉ Sidebar và Content Area có `overflow-y: auto` riêng.
- Danh sách trên 200 phần tử phải dùng **virtual scrolling**.

---

## 3. Trạng thái bắt buộc của mỗi màn hình

> **Bản đồ màn hình** của dự án nằm ở `project/screen-map.md`.
> Mục này quy định thứ áp cho **mọi** màn hình, ở mọi dự án.

Mọi màn hình hiển thị dữ liệu **bắt buộc** xử lý đủ 5 trạng thái. Thiếu một trạng thái là thiếu sót cần sửa trước khi review:

| Trạng thái | Yêu cầu hiển thị |
|---|---|
| **Loading** | Skeleton, **chỉ hiện sau 150ms** (tránh nhấp nháy với dữ liệu cục bộ nhanh) |
| **Empty** | Icon minh hoạ + câu giải thích + nút hành động gợi ý ("Tạo mục đầu tiên") |
| **Error** | Thông điệp tiếng Việt rõ ràng + nút "Thử lại" + (dev) mã lỗi |
| **Partial / Filtered empty** | "Không có kết quả khớp bộ lọc" + nút "Xoá bộ lọc" — khác hoàn toàn với Empty |
| **Success** | Nội dung thật |

---

## 4. Phân loại component

Chia 4 nhóm theo mức độ phụ thuộc nghiệp vụ. Đây là trục chính để quyết định đặt file ở đâu.

| Nhóm | Thư mục | Biết gì | Ví dụ |
|---|---|---|---|
| **1. UI Primitives** | `components/ui/` | Không biết gì về nghiệp vụ | `Button`, `Input`, `Modal`, `Toast`, `EmptyState`, `ErrorState`, `VirtualList` |
| **2. Layout** | `components/layout/` | Biết cấu trúc app, không biết dữ liệu | `AppShell`, `AppSidebar`, `AppTopBar`, `OverlayRoot` |
| **3. Features** | `features/<domain>/` | Biết dữ liệu và quy tắc của domain | `InvoiceList`, `InvoiceForm`, `useInvoices` |
| **4. Pages** | `pages/` | Lắp ráp, gắn với route | `DashboardPage`, `InvoiceDetailPage` |

**Ràng buộc cốt lõi:**

- `components/ui/` **không** import từ `features/`, `stores/`, và **không** gọi `window.api`. Dữ liệu vào qua props, hành động ra qua callback.
- Feature A **không** import trực tiếp vào Feature B.
- Page phải mỏng (< 150 dòng). Vượt quá là dấu hiệu logic bị nhét sai chỗ.

> Cấu trúc thư mục chi tiết, quy ước đặt tên file, giới hạn số dòng và quy tắc viết component: [coding-standards-frontend.md §2–§4](../04-guidelines/coding-standards-frontend.md).

---

## 5. Hệ thống style

Quy tắc viết CSS (CSS Modules, cấm hardcode, cấm `!important`…): [coding-standards-frontend.md §5](../04-guidelines/coding-standards-frontend.md).
Mục này định nghĩa **danh mục token** — nguồn chân lý về giá trị thiết kế.

### 5.1. Design Tokens — `frontend/src/styles/tokens.css`

Toàn bộ giá trị thiết kế khai báo dưới dạng CSS custom property trên `:root`. **Cấm hardcode màu, khoảng cách, cỡ chữ trực tiếp trong component.**

| Nhóm token | Tiền tố | Ví dụ |
|---|---|---|
| Màu nền | `--color-bg-*` | `--color-bg-base`, `--color-bg-subtle`, `--color-bg-hover` |
| Màu chữ | `--color-text-*` | `--color-text-primary`, `--color-text-muted` |
| Màu viền | `--color-border-*` | `--color-border-default`, `--color-border-focus` |
| Màu ngữ nghĩa | `--color-<ý nghĩa>` | `--color-accent`, `--color-danger`, `--color-success`, `--color-warning` |
| Khoảng cách | `--space-<n>` | Thang 4px: `--space-1` = 4px ... `--space-8` = 32px |
| Bo góc | `--radius-*` | `--radius-sm`, `--radius-md`, `--radius-full` |
| Cỡ chữ | `--font-size-*` | `--font-size-xs` ... `--font-size-xl` |
| Độ đậm | `--font-weight-*` | `--font-weight-normal`, `--font-weight-medium` |
| Đổ bóng | `--shadow-*` | `--shadow-sm`, `--shadow-popover` |
| Lớp chồng | `--z-*` | `--z-dropdown: 100`, `--z-modal: 400`, `--z-toast: 500` |
| Chuyển động | `--duration-*`, `--ease-*` | `--duration-fast: 120ms` |

### 5.1a. Token bố cục, điều khiển và focus

Các kích thước dùng lại trong App Shell và UI primitives cũng phải có token trong
`tokens.css`. Danh mục dưới dùng chung giữa các dự án; giá trị cụ thể do thiết kế
của từng dự án quyết định, không sao chép kích thước vào CSS của component.

| Nhóm | Token |
|---|---|
| Khung ứng dụng | `--sidebar-width`, `--sidebar-collapsed-width`, `--topbar-height`, `--statusbar-height` |
| Điều khiển | `--control-height`, `--control-min`, `--icon-size` |
| Giới hạn nội dung | `--modal-width`, `--drawer-width`, `--search-width`, `--content-width` |
| Danh sách | `--virtual-height`, `--row-height` |
| Viền và focus | `--border-width`, `--focus-width`, `--focus-offset` |
| Kiểu chữ | `--line-height` |
| Màu bổ trợ | `--color-on-accent`, `--color-overlay`, `--color-bg-selected` |

- Mật độ hiển thị có thể ghi đè token chiều cao hàng và điều khiển; vùng bấm vẫn đạt
  tối thiểu 32 × 32 px theo §6.
- Màu chữ trên nền nhấn phải dùng token riêng và đạt tương phản ở cả hai theme,
  kể cả trạng thái hover. Không mặc định chữ trắng luôn phù hợp với màu nhấn.
- Offset và tổng chiều cao của danh sách ảo tính từ dữ liệu/vị trí cuộn là giá trị
  động, không phải design token cố định; chiều cao hàng dùng để tính phải khớp CSS.

### 5.2. Chế độ sáng / tối

- Token khai báo hai bộ giá trị: mặc định (sáng) trên `:root`, bộ tối dưới `[data-theme="dark"]`.
- Chế độ `system` theo dõi `prefers-color-scheme` và cập nhật ngay khi OS đổi.
- Giá trị theme đọc từ `settings` và gán vào `document.documentElement` **trước lần render đầu tiên**, tránh nhấp nháy màu trắng.

### 5.3. Font chữ

Dùng ngăn xếp font hệ thống để giao diện hoà hợp với OS và hiển thị tiếng Việt chuẩn:

```
--font-sans: "Segoe UI Variable", "Segoe UI", -apple-system,
             BlinkMacSystemFont, "Inter", "Noto Sans", system-ui, sans-serif;
--font-mono: "Cascadia Code", "SF Mono", Consolas, monospace;
```

---

## 6. Khả năng tiếp cận (Accessibility)

Là bắt buộc, không phải tuỳ chọn:

| Yêu cầu | Chi tiết |
|---|---|
| Điều hướng bàn phím | Mọi hành động phải làm được bằng bàn phím. `Tab` đi đúng thứ tự đọc |
| Vòng focus rõ ràng | **Không bao giờ** đặt `outline: none` mà không có thay thế. Dùng `:focus-visible` |
| Bẫy focus | Modal/Drawer giữ focus bên trong; `Esc` đóng; đóng xong trả focus về nơi đã kích hoạt |
| Nhãn ngữ nghĩa | Nút chỉ có icon phải có `aria-label` |
| Độ tương phản | Tối thiểu 4.5:1 cho chữ thường, ở **cả hai** chế độ sáng và tối |
| Vùng bấm | Tối thiểu 32 × 32 px |
| Thông báo động | Toast và lỗi dùng `role="status"` / `role="alert"` |
| Tôn trọng hệ thống | Hỗ trợ `prefers-reduced-motion` — tắt animation khi người dùng yêu cầu |

---

## 7. Phím tắt

| Phím | Hành động | Phạm vi |
|---|---|---|
| `Ctrl/Cmd + K` | Mở Command Palette | Toàn cục |
| `Ctrl/Cmd + N` | Tạo bản ghi mới *(hành động chính của domain)* | Toàn cục |
| `Ctrl/Cmd + F` | Focus ô tìm kiếm | Toàn cục |
| `Ctrl/Cmd + ,` | Mở Cài đặt | Toàn cục |
| `Ctrl/Cmd + B` | Ẩn/hiện sidebar | Toàn cục |
| `Esc` | Đóng lớp phủ trên cùng | Khi có overlay |
| `↑` `↓` | Di chuyển trong danh sách | Khi danh sách có focus |
| `Enter` | Mở chi tiết mục đang chọn | Khi danh sách có focus |
| `Delete` | Xoá mục đang chọn | Khi danh sách có focus |

> Phím tắt **riêng của domain** (hành động nghiệp vụ đặc thù) khai báo ở `project/screen-map.md`.

**Quy tắc:** Phím tắt toàn cục đăng ký **một lần duy nhất** ở tầng `AppShell`, không rải rác trong từng component. Phím tắt phải tự động vô hiệu khi con trỏ đang ở trong ô nhập liệu.

---

## 8. Checklist trước khi merge một màn hình mới

- [ ] Có đủ 5 trạng thái (loading / empty / error / filtered-empty / success)
- [ ] Hoạt động được ở kích thước cửa sổ tối thiểu 940×600
- [ ] Đúng ở cả chế độ sáng và tối
- [ ] Điều hướng được hoàn toàn bằng bàn phím, focus ring rõ ràng
- [ ] Không có màu / khoảng cách / cỡ chữ hardcode — tất cả qua token
- [ ] Toàn bộ chuỗi hiển thị là tiếng Việt, không còn chuỗi tiếng Anh sót lại
- [ ] Danh sách dài đã dùng virtual scroll
- [ ] Component không vượt 200 dòng
- [ ] Không gọi `window.api` trực tiếp trong component — phải qua hook

---

## Tài liệu liên quan

- [Quản lý state](./state-management.md)
- [Quy tắc giao tiếp IPC](../01-architecture/ipc-communication.md)
- [Quy chuẩn code — Frontend](../04-guidelines/coding-standards-frontend.md)
- [Quy chuẩn code — Phần chung](../04-guidelines/coding-standards.md)
