# Quản lý trạng thái phía giao diện

> **Nguyên tắc cốt lõi**: Nguồn chân lý của dữ liệu nghiệp vụ là **SQLite ở Main Process**, không phải store của React. Renderer chỉ giữ **bản sao có thời hạn (cache)** của dữ liệu đó.

Đây là khác biệt lớn nhất so với ứng dụng web thông thường và là gốc rễ của hầu hết lỗi đồng bộ dữ liệu trong app Electron.

---

## 1. Phân loại state — quyết định trước khi viết code

Mọi mẩu state đều phải rơi vào đúng một trong bốn nhóm sau. Đặt sai nhóm là nguyên nhân chính khiến giao diện lệch dữ liệu.

| Nhóm | Bản chất | Công cụ | Ví dụ |
|---|---|---|---|
| **1. Server State** | Dữ liệu **thuộc về DB**, Renderer chỉ mượn | TanStack Query | Danh sách bản ghi, chi tiết một bản ghi, kết quả tìm kiếm |
| **2. Global UI State** | Trạng thái giao diện dùng chung nhiều nơi | Zustand | Theme, sidebar đóng/mở, modal đang mở, bộ lọc hiện tại |
| **3. Local State** | Chỉ một component quan tâm | `useState` / `useReducer` | Giá trị đang gõ trong ô input, tab con đang chọn |
| **4. URL State** | Trạng thái cần chia sẻ / khôi phục qua điều hướng | React Router | `<entity>Id`, từ khoá tìm kiếm, chế độ xem list/board |

### 1.1. Cây quyết định

```
State này có phải là dữ liệu đọc ra từ DB không?
├── CÓ  ──▶ Nhóm 1: TanStack Query. TUYỆT ĐỐI không copy sang Zustand.
└── KHÔNG
     │
     Nó có cần tồn tại khi người dùng bấm back / chia sẻ / mở lại không?
     ├── CÓ  ──▶ Nhóm 4: đưa vào URL
     └── KHÔNG
          │
          Có hơn một component ở nhánh cây khác nhau cần đọc nó không?
          ├── CÓ  ──▶ Nhóm 2: Zustand
          └── KHÔNG ──▶ Nhóm 3: useState
```

### 1.2. Lỗi kinh điển

**Cấm sao chép dữ liệu server vào Zustand.** Từ giây phút copy, dữ liệu bắt đầu cũ đi: không biết cũ tới mức nào, cửa sổ khác sửa thì không hay biết, và khi xoá một bản ghi phải tự tìm cập nhật ở mọi nơi đang giữ bản sao.

Không có `useInvoiceStore`, không có `useCustomerStore` — **không có store nào cho dữ liệu nghiệp vụ**. Nó thuộc Nhóm 1.

---

---

## 2. Nhóm 1 — Server State (TanStack Query)

### 2.1. Quy ước Query Key

Query key là **định danh của dữ liệu trong cache**. Sai query key thì cache sẽ sai — đây là chỗ dễ gây lỗi nhất, nên phải tập trung một chỗ.

Định nghĩa tại `frontend/src/shared/queryKeys.js`, theo mẫu phân cấp:

```
invoiceKeys = {
  all:      ['invoice'],
  lists:    ['invoice', 'list'],
  list:     (filters) => ['invoice', 'list', filters],
  details:  ['invoice', 'detail'],
  detail:   (id) => ['invoice', 'detail', id],
}
```

**Lợi ích của phân cấp**: invalidate được theo mức độ rộng hẹp tuỳ ý.

| Muốn làm mới | Gọi invalidate với key |
|---|---|
| Toàn bộ dữ liệu của thực thể | `invoiceKeys.all` |
| Mọi danh sách (mọi bộ lọc) | `invoiceKeys.lists` |
| Đúng một danh sách với bộ lọc cụ thể | `invoiceKeys.list(filters)` |
| Đúng một bản ghi | `invoiceKeys.detail(id)` |

**Cấm viết mảng key trực tiếp trong component.** Luôn import từ `queryKeys.js`.

### 2.2. Cấu hình mặc định

Dữ liệu cục bộ nhanh và ít biến động ngoài tầm kiểm soát, nên cấu hình khác hẳn app web:

| Tuỳ chọn | Giá trị | Lý do |
|---|---|---|
| `staleTime` | `30_000` (30 giây) | Dữ liệu chỉ đổi khi chính app này ghi, mà lúc đó ta đã chủ động invalidate |
| `gcTime` | `5 * 60_000` | Giữ cache 5 phút sau khi không còn component nào dùng |
| `retry` | `0` | Truy vấn cục bộ thất bại thì thử lại cũng vô ích. Lỗi thật cần hiện ra, không giấu đi |
| `refetchOnWindowFocus` | `false` | Người dùng alt-tab liên tục; đã có broadcast event lo việc đồng bộ |
| `refetchOnReconnect` | `false` | Không liên quan tới mạng |

### 2.3. Lớp bọc bắt buộc: xử lý envelope

`window.api` trả về envelope `{ ok, data, error }`, trong khi TanStack Query hiểu lỗi qua cơ chế **throw**. Cần một hàm bọc đặt tại `frontend/src/shared/invoke.js`:

```
Nhận envelope
  ├── ok === true   -> trả về envelope.data
  └── ok === false  -> throw AppClientError(error.code, error.message, error.details)
```

Toàn bộ `queryFn` và `mutationFn` **phải** đi qua hàm bọc này. Nhờ vậy component chỉ cần đọc `error.code` để phân nhánh xử lý.

### 2.4. Quy ước viết hook dữ liệu

Component **không bao giờ** gọi `useQuery` trực tiếp. Mỗi truy vấn được gói trong một custom hook đặt tại `features/<domain>/hooks/`.

| Hook | Vai trò |
|---|---|
| `useInvoices(filters)` | Danh sách có lọc và phân trang |
| `useInvoice(id)` | Chi tiết một bản ghi, tự tắt khi `id` là `null` (`enabled: Boolean(id)`) |
| `useInvoiceMutations()` | Trả về `createInvoice`, `updateInvoice`, `removeInvoice`, và các thao tác nghiệp vụ riêng |

**Lợi ích**: đổi cách lấy dữ liệu sau này chỉ sửa một chỗ, component không bị ảnh hưởng.

---

## 3. Quy tắc invalidate cache

Đây là phần quan trọng nhất của tài liệu này. Sai ở đây → UI hiển thị dữ liệu cũ.

### 3.1. Bảng quy tắc

**Bảng tra cứu riêng của domain nằm ở `project/invalidate-rules.md`.**

Mỗi khi thêm một quan hệ dữ liệu mới, bổ sung một dòng vào bảng đó — đây là bước
dễ quên nhất trong toàn bộ quy trình thêm thực thể (`recipes.md` Công thức 1 bước 14).

Ba loại quan hệ hay bị bỏ sót:

| Loại | Ví dụ | Phải invalidate thêm |
|---|---|---|
| Thao tác trên **con** làm đổi số đếm ở **cha** | Tạo một bản ghi con → `childCount` của cha đổi | key danh sách của **cha** |
| Bản ghi **đổi cha** | Chuyển bản ghi từ nhóm A sang nhóm B | danh sách của **cả hai** cha |
| Bản ghi bị **xoá** | | dùng `removeQueries` cho key chi tiết, **không** `invalidateQueries` |


### 3.2. Nguyên tắc

1. **Invalidate rộng còn hơn thiếu.** Truy vấn lại SQLite cục bộ tốn vài mili-giây; hiển thị sai dữ liệu tốn niềm tin của người dùng.
2. Invalidate ở **`onSuccess` của mutation**, không rải rác trong component.
3. Với bản ghi đã xoá, dùng `removeQueries` cho key chi tiết (khác `invalidateQueries` — tránh việc tự động fetch lại một bản ghi không còn tồn tại).

---

## 4. Đồng bộ với sự kiện từ Main Process

Chỉ invalidate sau mutation là **chưa đủ**. Dữ liệu còn đổi do: cửa sổ thứ hai, tác vụ nền, import, dọn thùng rác tự động.

### 4.1. Cơ chế

Đăng ký **một lần duy nhất** ở tầng cao nhất (`AppShell` hoặc một provider riêng), không đăng ký trong từng component:

```
useEffect(() => {
  const off = window.api.events.onInvoiceChanged((payload) => {
    queryClient.invalidateQueries({ queryKey: invoiceKeys.lists })
    if (payload.id) {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(payload.id) })
    }
  })
  return off          // BẮT BUỘC: gỡ listener khi unmount
}, [queryClient])
```

### 4.2. Quy tắc

| Quy tắc | Lý do |
|---|---|
| Event chỉ dùng để **invalidate**, không dùng để **ghi đè** dữ liệu vào cache | Payload của event thường rút gọn; ghi đè bằng nó sẽ làm mất trường. Invalidate buộc lấy dữ liệu đầy đủ từ nguồn |
| Luôn trả về hàm cleanup từ `useEffect` | Không cleanup thì mỗi lần hot-reload lại chồng thêm một listener, dẫn tới invalidate hàng chục lần |
| Debounce với event dồn dập | `event:import-progress` bắn liên tục — gom lại, cập nhật tối đa ~10 lần/giây |
| Bỏ qua event do **chính cửa sổ này** vừa gây ra (nếu Main gửi kèm `sourceWindowId`) | Tránh invalidate hai lần liên tiếp cho cùng một thao tác |

---

## 5. Nhóm 2 — Global UI State (Zustand)

> Dùng Zustand thay Context API vì Context re-render **toàn bộ** cây con mỗi khi giá trị đổi — giật rõ rệt với state đổi thường xuyên (ví dụ kéo chiều rộng sidebar). Zustand subscribe theo từng mẩu qua selector.

### 5.1. Danh sách store

| Store | File | Nội dung |
|---|---|---|
| `useUIStore` | `stores/ui.store.js` | `theme`, `isSidebarCollapsed`, `sidebarWidth`, `density` |
| `useOverlayStore` | `stores/overlay.store.js` | Ngăn xếp modal/drawer đang mở, tham số kèm theo |
| `useFilterStore` | `stores/filter.store.js` | Bộ lọc và sắp xếp hiện hành của từng màn hình |
| `useSelectionStore` | `stores/selection.store.js` | Tập id đang được chọn (phục vụ thao tác hàng loạt) |
| `useToastStore` | `stores/toast.store.js` | Hàng đợi thông báo |

> **Không có** store nào cho dữ liệu nghiệp vụ. Nó thuộc Nhóm 1.

### 5.2. Quy tắc viết store

1. **Store phẳng, chia nhỏ theo mối quan tâm.** Tránh một store khổng lồ chứa mọi thứ.
2. **Luôn dùng selector**, không lấy nguyên store:
   ```
   // SAI — re-render mỗi khi BẤT KỲ trường nào trong store đổi
   const store = useUIStore()

   // ĐÚNG — chỉ re-render khi theme đổi
   const theme = useUIStore((s) => s.theme)
   ```
3. Selector trả về object hoặc mảng mới phải kèm so sánh nông (`useShallow`), nếu không sẽ re-render vô hạn.
4. Action đặt **bên trong** store, không viết logic cập nhật rải rác ở component.
5. State phải là dữ liệu **serializable** để lưu và khôi phục được.

### 5.3. Bền hoá (Persist)

| State | Lưu ở đâu | Lý do |
|---|---|---|
| `theme`, `density`, `language` | **Bảng `settings` trong SQLite** (qua `setting:set`) | Là cấu hình thật của người dùng, cần backup cùng dữ liệu |
| `sidebarWidth`, `isSidebarCollapsed` | `localStorage` | Thuộc về từng máy/cửa sổ, mất cũng không ảnh hưởng |
| Bộ lọc, lựa chọn, overlay đang mở | Không lưu | Tạm thời theo phiên làm việc |

> **Lưu ý về thứ tự khởi động**: `theme` đọc từ DB nên không có ngay lập tức. Để tránh nhấp nháy màu trắng, giá trị theme lần trước được ghi đệm vào `localStorage` và áp dụng ngay lúc HTML load, sau đó mới đồng bộ lại với giá trị thật từ DB.

---

## 6. Nhóm 4 — URL State

### 6.1. Cái gì nên nằm trên URL

| Nên | Không nên |
|---|---|
| Id bản ghi đang xem (`/invoices/:id`) | Dữ liệu form đang gõ dở |
| Từ khoá tìm kiếm (`?q=`) | Trạng thái đóng/mở của modal xác nhận |
| Chế độ xem (`?view=board`) | Vị trí thanh cuộn |
| Bộ lọc quan trọng (`?status=todo`) | Dữ liệu nhạy cảm |

### 6.2. Quy ước

- Dùng **`HashRouter`**, không dùng `BrowserRouter`. Ứng dụng đóng gói chạy qua giao thức `file://`, `BrowserRouter` sẽ hỏng khi tải lại trang.
- Tham số URL luôn là **chuỗi**. Phải ép kiểu và kiểm tra khi đọc ra, không tin tưởng giá trị.
- Giá trị không hợp lệ trên URL → rơi về mặc định một cách im lặng, **không** làm sập màn hình.

---

## 7. Optimistic Update

### 7.1. Khi nào dùng

| Nên dùng | Không nên dùng |
|---|---|
| Đánh dấu hoàn thành (bấm là thấy ngay) | Tạo bản ghi cần id do server sinh |
| Kéo-thả sắp xếp | Thao tác có thể thất bại vì quy tắc nghiệp vụ phức tạp |
| Đổi một thuộc tính đơn giản (cờ, mức độ) | Thao tác xoá không hoàn tác được |

> Thao tác trên SQLite cục bộ thường dưới 10ms. **Đừng lạm dụng optimistic update** — độ phức tạp nó mang lại thường lớn hơn lợi ích. Chỉ dùng cho các tương tác cần cảm giác "tức thì" như kéo-thả và tick checkbox.

### 7.2. Khuôn mẫu bắt buộc bốn bước

```
onMutate:   1. Huỷ các truy vấn đang chạy trên key liên quan (tránh đè ngược dữ liệu cũ)
            2. Chụp lại snapshot cache hiện tại
            3. Cập nhật cache theo kết quả kỳ vọng
            4. Trả snapshot ra làm context

onError:    Khôi phục cache từ snapshot trong context + hiện toast lỗi

onSettled:  Invalidate key liên quan để đồng bộ lại với sự thật từ DB
```

Thiếu bước huỷ truy vấn ở `onMutate` là lỗi phổ biến: một request đang bay về sẽ ghi đè lại dữ liệu vừa cập nhật lạc quan.

---

## 8. Xử lý lỗi trên giao diện

### 8.1. Phân tầng

| Mức | Xử lý bởi | Áp dụng cho |
|---|---|---|
| Lỗi theo trường | Component form, đọc `error.details.fieldErrors` | `VALIDATION_ERROR` |
| Lỗi theo thao tác | Toast từ `useToastStore` | Thao tác ghi thất bại |
| Lỗi theo màn hình | `<ErrorState />` kèm nút "Thử lại" | Truy vấn đọc thất bại |
| Lỗi toàn ứng dụng | React Error Boundary | Lỗi render không lường trước |

### 8.2. Quy tắc

- Thông điệp hiển thị lấy từ `error.message` do Main gửi sang (đã là tiếng Việt), **không tự chế lại** ở Renderer.
- Phân nhánh xử lý dựa trên `error.code`, tuyệt đối không so khớp nội dung `error.message`.
- `NOT_FOUND` trên màn hình chi tiết → điều hướng về danh sách kèm toast giải thích, không để màn hình trống khó hiểu.
- Error Boundary đặt ở hai cấp: bọc toàn app, và bọc riêng vùng nội dung để một màn hình lỗi không làm sập cả sidebar.

---

## 9. Checklist khi thêm một tính năng có dữ liệu

- [ ] Đã phân loại state vào đúng 1 trong 4 nhóm
- [ ] Query key khai báo trong `queryKeys.js`, không viết mảng trực tiếp
- [ ] Có custom hook riêng, component không gọi `useQuery` trực tiếp
- [ ] Mutation có `onSuccess` invalidate đủ các key liên quan (đối chiếu bảng mục 3.1)
- [ ] Đã cập nhật bảng quy tắc invalidate ở mục 3.1 nếu phát sinh quan hệ mới
- [ ] Nếu có broadcast event mới: đã đăng ký listener kèm cleanup
- [ ] Selector Zustand lấy đúng mẩu cần dùng, không lấy nguyên store
- [ ] Đã xử lý đủ 4 mức lỗi ở mục 8.1
- [ ] Không có dữ liệu server nào bị sao chép vào Zustand

---

## Tài liệu liên quan

- [Cấu trúc giao diện](./ui-structure.md)
- [Quy tắc giao tiếp IPC](../01-architecture/ipc-communication.md)
- [Quy chuẩn code — Frontend](../04-guidelines/coding-standards-frontend.md)
- [Quy chuẩn code — Phần chung](../04-guidelines/coding-standards.md)
