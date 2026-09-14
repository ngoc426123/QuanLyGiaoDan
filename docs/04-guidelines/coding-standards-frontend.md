# Quy chuẩn code — Frontend

> **Áp dụng cho**: Package `frontend/` (Renderer Process — React 18 + Vite).
> **Điều kiện tiên quyết**: [coding-standards.md](./coding-standards.md) (phần chung).
> **Phạm vi**: Chỉ **cách viết code**. Bố cục màn hình, design token, phím tắt, yêu cầu a11y nằm ở [ui-structure.md](../03-frontend/ui-structure.md); quy tắc state và cache nằm ở [state-management.md](../03-frontend/state-management.md) — không chép lại ở đây.

---

## 1. Ranh giới

### Frontend KHÔNG được phép

| Cấm | Thay vào đó |
|---|---|
| Import `electron`, `fs`, `path`, `better-sqlite3`, mọi module Node | Gọi qua `window.api` |
| Chứa quy tắc nghiệp vụ quyết định tính đúng sai của dữ liệu | Đưa xuống Service ở Backend |
| Coi validate ở UI là lớp bảo vệ | Backend **luôn** validate lại; UI chỉ để phản hồi nhanh |
| Tự chế thông điệp lỗi thay cho thông điệp Backend gửi sang | Hiển thị `error.message` từ envelope |

> **Phân biệt**: FE được phép biết `status === 'done'` thì gạch ngang chữ (**luật hiển thị**). FE **không** được quyết định *khi nào* một bản ghi được phép chuyển sang `done` (**luật nghiệp vụ** — thuộc Backend).

---

## 2. Tổ chức file

```
frontend/
├── package.json
├── vite.config.js                base:'./' | outDir:'../backend/renderer' | alias @shared
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx                   Provider + Router
    ├── pages/                    Màn hình gắn với route — PHẢI MỎNG (< 150 dòng)
    ├── components/
    │   ├── ui/                   Nguyên thuỷ, không biết nghiệp vụ
    │   └── layout/               App Shell, Sidebar, TopBar
    ├── features/<domain>/        Nhóm theo NGHIỆP VỤ, không theo loại file
    │   ├── components/
    │   ├── hooks/
    │   ├── api/                  Wrapper mỏng quanh window.api
    │   ├── utils/
    │   └── constants.js
    ├── hooks/                    Hook dùng chung nhiều feature
    ├── stores/                   Zustand store
    ├── shared/                   invoke.js, queryKeys.js
    ├── styles/                   tokens.css, global.css
    └── utils/
```

### 2.1. Luật phụ thuộc

```
pages/  -->  features/  -->  components/ui/
```

| Luật | Diễn giải |
|---|---|
| `components/ui/` là tầng đáy | **Không** import từ `features/`, `pages/`, `stores/` |
| Feature A **không** import vào trong Feature B | Cần dùng chung thì nâng lên `components/ui/` hoặc `shared/` |
| `pages/` chỉ lắp ráp | Không chứa logic dữ liệu |

### 2.2. Quy ước tên file và export

| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Component | `PascalCase.jsx` | `InvoiceListItem.jsx` |
| Hook | `camelCase.js`, tiền tố `use` | `useInvoiceMutations.js` |
| Store | `camelCase.store.js` | `ui.store.js` |
| API wrapper | `<domain>.api.js` | `invoice.api.js` |
| Tiện ích | `<chủ đề>.<nhóm>.js` | `date.format.js` |
| CSS Module | `<Component>.module.css` | `InvoiceListItem.module.css` |

- Component và hook: **named export**, không dùng `export default` (đổi tên nhất quán, IDE auto-import chính xác).
- Một component chính trên một file.

---

## 3. Quy tắc viết Component

### 3.1. Giới hạn

| Chỉ số | Ngưỡng | Vượt thì làm gì |
|---|---|---|
| Số dòng của component | 200 | Tách component con |
| Số props | 8 | Gom thành object hoặc tách component |
| Độ sâu JSX lồng nhau | 4 cấp | Tách component con |
| Số `useEffect` trong một component | 3 | Gộp hoặc tách thành custom hook |
| Độ sâu prop drilling | 2 cấp | Dùng Context hoặc store |

### 3.2. Thứ tự bên trong component

```
1. Hooks lấy dữ liệu      useInvoices, useParams
2. Hooks state cục bộ     useState, useReducer
3. Giá trị dẫn xuất       useMemo
4. Handler sự kiện        handleXxx
5. Side effects           useEffect
6. Trả về sớm             loading / error / empty
7. JSX chính
```

### 3.3. Bắt buộc

| Quy tắc | Lý do |
|---|---|
| **Không** định nghĩa component bên trong component khác | Mỗi lần render tạo type mới → React unmount toàn bộ cây con, mất hết state |
| `key` trong danh sách là **id ổn định**, không phải chỉ số mảng | Dùng index gây lỗi khi sắp xếp/xoá |
| Component `ui/` phải chuyển tiếp `ref` và `...rest` | Để cha gắn được thuộc tính HTML và `aria-*` |
| Props tuỳ chọn có giá trị mặc định ngay tại chữ ký hàm | Tránh `undefined` lọt xuống DOM |
| Props boolean đặt tên **khẳng định** (`isDisabled`), callback theo mẫu `on<Sự kiện>` | |

### 3.4. Điều kiện render

Dùng `{items.length > 0 && ...}`, không dùng `{items.length && ...}` (hiển thị số 0 ra màn hình).
Từ 3 nhánh trở lên → tách thành hàm `renderContent()`, không ternary lồng nhau trong JSX.

---

## 4. Hooks

| Quy tắc | Ghi chú |
|---|---|
| Mọi `useEffect` có đăng ký (listener IPC, timer) **phải** có cleanup | Không cleanup thì mỗi lần hot-reload lại chồng thêm một listener |
| Listener IPC trả về hàm huỷ — `return` hàm đó trong `useEffect` | |
| `useEffect` **chỉ** dùng để đồng bộ với hệ thống ngoài React | Không dùng để tính giá trị dẫn xuất, không dùng để lấy dữ liệu (dùng `useQuery`) |
| `useMemo`/`useCallback` chỉ khi truyền cho `React.memo`, nằm trong dependency hook khác, hoặc phép tính nặng **đã đo** | Không bọc tất cả mọi thứ |
| Tách custom hook khi logic dùng lại ở ≥ 2 nơi, hoặc component có quá 3 `useEffect` | Đặt tên theo việc nó làm: `useInvoiceFilters` |

---

---

## 5. Style và CSS

Danh mục design token đầy đủ: [ui-structure.md §5](../03-frontend/ui-structure.md).

| Luật | Ghi chú |
|---|---|
| Style component dùng **CSS Modules** (`.module.css`) | Không dùng CSS-in-JS runtime, không sinh class động bằng nối chuỗi |
| **Cấm hardcode** màu / khoảng cách / cỡ chữ / bo góc / `z-index` | Tất cả qua `var(--token)`. Thiếu token thì **thêm token mới** |
| Không dùng selector con quá 2 cấp | CSS Module đã cô lập phạm vi |
| Không dùng `!important` | Dấu hiệu selector đang đánh nhau |
| Không đặt `outline: none` mà không có thay thế | Phá hỏng điều hướng bàn phím — dùng `:focus-visible` |
| Chuyển động bọc trong `@media (prefers-reduced-motion: no-preference)` | |
| Dùng Flexbox/Grid, không dùng `position: absolute` cho bố cục chính | |

```
/* SAI */  .card { padding: 16px; color: #1f2937; }
/* ĐÚNG */ .card { padding: var(--space-4); color: var(--color-text-primary); }
```

---

## 6. Giao tiếp với Backend

### 6.1. Ba tầng bắt buộc

```
Component  -->  Custom hook  -->  <domain>.api.js  -->  window.api.*
(không biết    (useQuery /       (wrapper mỏng,      (preload)
 IPC tồn tại)   useMutation)      gọi invoke())
```

| Luật | Lý do |
|---|---|
| Component **không bao giờ** gọi `window.api` trực tiếp | Không test được, không cache được, lặp code xử lý lỗi |
| Component **không** gọi `useQuery`/`useMutation` trực tiếp | Phải bọc trong custom hook của feature |
| Mọi lời gọi đi qua `shared/invoke.js` | Nơi duy nhất bóc envelope và ném lỗi có kiểu |
| Query key lấy từ `shared/queryKeys.js` | Cấm viết mảng key trực tiếp |
| Phân nhánh lỗi theo `error.code` | **Cấm** so khớp nội dung `error.message` |

Quy tắc cache, invalidate, optimistic update: [state-management.md](../03-frontend/state-management.md).

### 6.2. Chống bấm hai lần (Double-submit)

Người dùng bấm Lưu hai lần sẽ tạo **hai bản ghi trùng nhau**. Đây là cách **duy nhất** dự án này chống double-submit — Backend không có cơ chế idempotency, và ID do Backend sinh.

| Luật | Cách làm |
|---|---|
| Nút submit khoá khi mutation đang chạy | `disabled={mutation.isPending}` — không tự quản bằng `useState` riêng |
| Handler kiểm tra `isPending` ngay đầu, trả về sớm | Chặn submit lặp bằng phím Enter |
| Nút có phản hồi thị giác | Spinner hoặc đổi nhãn "Đang lưu…" |
| Thao tác xoá có bước xác nhận | Chống bấm nhầm và bấm đúp |

### 6.3. Hiển thị thời gian

Backend gửi mốc thời gian dạng **ISO UTC**, ngày trên lịch dạng `YYYY-MM-DD` ([database-conventions.md §1.2b](../02-backend-data/database-conventions.md)).

| Luật | Lý do |
|---|---|
| Frontend đổi UTC sang **giờ địa phương** khi hiển thị | Backend không bao giờ format thời gian |
| Ngày `YYYY-MM-DD` **không được** đưa qua `new Date()` rồi format lại | `new Date('2026-09-11')` bị hiểu là UTC midnight → lệch một ngày |
| So sánh "hôm nay", "quá hạn" tính theo **lịch địa phương** | Tính theo UTC sẽ lệch với người dùng UTC+7 |
| Logic format tập trung ở `utils/date.format.js` | Không rải khắp component |

### 6.4. Xử lý lỗi

| Mức | Xử lý bởi | Áp dụng cho |
|---|---|---|
| Theo trường | Form đọc `error.details.fieldErrors` | `VALIDATION_ERROR` |
| Theo thao tác | Toast | Mutation thất bại |
| Theo màn hình | `<ErrorState />` kèm nút "Thử lại" | Query thất bại |
| Toàn ứng dụng | Error Boundary (2 cấp: toàn app + vùng nội dung) | Lỗi render không lường trước |

---

## 7. Hiệu năng render

| Quy tắc | Ghi chú |
|---|---|
| Danh sách > 200 phần tử phải dùng virtual scroll | Render hết sẽ đơ khi cuộn |
| Selector Zustand lấy đúng mẩu cần dùng | `useUIStore((s) => s.theme)`, không lấy nguyên store |
| Selector trả về object/mảng mới phải kèm so sánh nông | Không thì re-render vô hạn |
| Không tạo object/mảng/hàm mới trong JSX khi truyền cho component `memo` | Phá vỡ tác dụng của `memo` |
| Debounce ô tìm kiếm 250–300ms | |
| Đo trước khi tối ưu | React DevTools Profiler |

---

## 8. Cấm tuyệt đối

```
// 1. Truy cập Node từ Renderer
import fs from 'fs'
const { ipcRenderer } = window.require('electron')

// 2. Gọi IPC thẳng trong component
const items = await window.api.invoice.list()

// 3. Sao chép dữ liệu server vào Zustand
const useInvoiceStore = create((set) => ({ items: [] }))

// 4. Định nghĩa component bên trong component
function Page() {
  function Row() { return <div /> }   // mất state mỗi lần render
  return <Row />
}

// 5. dangerouslySetInnerHTML với nội dung người dùng chưa sanitize
<div dangerouslySetInnerHTML={{ __html: item.description }} />

// 6. Thao tác DOM trực tiếp — dùng ref
document.querySelector('.list-item').classList.add('active')

// 7. Key là index khi danh sách có thể sắp xếp/xoá
{items.map((it, i) => <ListItem key={i} />)}

// 8. <div onClick> thay cho <button>
```

---

## 9. ESLint riêng cho `frontend/`

| Luật | Mức | Ghi chú |
|---|---|---|
| `react-hooks/rules-of-hooks` | **error** | Vi phạm là lỗi runtime chắc chắn |
| `react-hooks/exhaustive-deps` | **warn** | Xem xét từng trường hợp, không tắt bừa |
| `react/jsx-key` | error | |
| `react/no-unstable-nested-components` | error | Chặn component lồng nhau |
| `jsx-a11y/alt-text`, `anchor-is-valid` | error | |
| `jsx-a11y/click-events-have-key-events` | warn | Chặn `<div onClick>` |
| `no-restricted-imports` | error | Chặn `electron`, `fs`, `path`, `better-sqlite3` |
| `no-restricted-globals` | error | Chặn `require`, `process`, `__dirname` |

---

## 10. Kiểm thử Frontend

| Loại | Công cụ | Phạm vi |
|---|---|---|
| Component | Vitest + React Testing Library | Component `ui/` và component có logic hiển thị |
| Hook | Vitest + `renderHook` | Custom hook có logic |
| Tích hợp màn hình | RTL với `window.api` được mock | Luồng chính của mỗi màn hình |

- Mock ở tầng `window.api`, **không** mock từng hook — như vậy mới test được cả hook lẫn component.
- Tìm phần tử bằng `role` và `label`, không dùng class hay test-id trừ khi bất đắc dĩ.
- **Không** test chi tiết cài đặt nội bộ. Test kết quả nhìn thấy được.
- Bắt buộc test: mọi form có validate, mọi component xử lý đủ 5 trạng thái, mọi hook có nhánh điều kiện.

---

## 11. Checklist Pull Request — Frontend

> Dùng **cộng thêm** checklist chung ở [coding-standards.md §8](./coding-standards.md).

- [ ] Không import module Node; không gọi `window.api` trực tiếp trong component
- [ ] Không có màu / khoảng cách / cỡ chữ hardcode — tất cả qua token
- [ ] Component không vượt 200 dòng, JSX không lồng quá 4 cấp
- [ ] Mọi `useEffect` có đăng ký đều có cleanup
- [ ] `key` của danh sách là id ổn định
- [ ] Query key lấy từ `queryKeys.js`; mutation invalidate đủ key liên quan
- [ ] Không có dữ liệu server nào bị sao chép vào Zustand
- [ ] Nút submit khoá khi `isPending`
- [ ] Màn hình xử lý đủ 5 trạng thái ([ui-structure.md §3.1](../03-frontend/ui-structure.md))
- [ ] Đúng ở cả theme sáng và tối; điều hướng được bằng bàn phím
- [ ] Chạy đúng ở kích thước cửa sổ tối thiểu 940 × 600
- [ ] Mọi chuỗi hiển thị là tiếng Việt
- [ ] Danh sách dài đã dùng virtual scroll

---

## Tài liệu liên quan

- [Quy chuẩn code — Phần chung](./coding-standards.md)
- [Cấu trúc giao diện](../03-frontend/ui-structure.md) — layout, token, phím tắt, a11y
- [Quản lý state](../03-frontend/state-management.md) — cache, invalidate, optimistic
