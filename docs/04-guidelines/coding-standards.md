# Quy chuẩn code — Phần chung

> **Áp dụng cho**: cả package `frontend/` và `backend/`.
> **Phạm vi**: Chỉ những luật **riêng của dự án này**. Các nguyên tắc lập trình phổ thông (early return, hàm nhỏ, đặt tên có nghĩa, bất biến) được coi là mặc định, không liệt kê lại.

| Vai trò | Đọc |
|---|---|
| Dev Frontend | Tài liệu này + [coding-standards-frontend.md](./coding-standards-frontend.md) |
| Dev Backend | Tài liệu này + [coding-standards-backend.md](./coding-standards-backend.md) |

Khi thêm luật mới: đúng với cả hai bên → viết vào đây; chỉ đúng một bên → viết vào file riêng. **Không chép một luật vào cả hai file riêng.**

---

## 1. Ranh giới Frontend ↔ Backend

Mục quan trọng nhất của tài liệu này.

```
   frontend/  (Package 1)               backend/  (Package 2)
   React, DOM, CSS                      Node.js, SQLite, fs
   Sandbox Chromium                     Toàn quyền hệ thống

              |                                    |
              +--------> window.api <--------------+     (Preload — cổng DUY NHẤT)
              +-------->  shared/   <--------------+     (JS thuần ở gốc repo)
```

### 1.1. Luật cấm import chéo

| Vùng | Cấm import |
|---|---|
| `frontend/src/**` | `electron`, `fs`, `path`, `os`, `child_process`, `better-sqlite3`, mọi file trong `backend/` |
| `backend/src/**` | `react`, `react-dom`, mọi file trong `frontend/` |
| `shared/**` | `fs`, `path`, `electron`, `react`, và mọi thứ ngoài chính nó |

Dùng chung code: cả hai bên trỏ tới `shared/` ở gốc repo qua alias `@shared`. Bundler mỗi bên tự nhét nội dung vào output — không phải import chéo package.

> Luật này được **ESLint cưỡng chế** (mục 7.2). Không trông chờ code review.

### 1.2. Ngôn ngữ chung qua IPC

| Hạng mục | Quy ước |
|---|---|
| Kiểu chữ của trường | `camelCase`. DB dùng `snake_case`, chuyển đổi **kết thúc trong Repository** |
| Mốc thời gian | Chuỗi ISO 8601 **UTC**. Không truyền object `Date` |
| Ngày trên lịch | Chuỗi `YYYY-MM-DD`, không múi giờ ([database-conventions.md §1.2b](../02-backend-data/database-conventions.md)) |
| Boolean | `true`/`false` thật. DB lưu `0/1`, Repository phải đổi trước khi trả ra |
| Số thập phân nhạy cảm | Số nguyên đơn vị nhỏ nhất |
| Hình dạng phản hồi | `{ ok, data, meta? }` hoặc `{ ok, error }` |
| Mã lỗi | Hằng số trong `shared/errors.js`. FE phân nhánh theo `error.code`, **không** so khớp `error.message` |
| Tên kênh IPC | Hằng số trong `shared/channels.js`. Cấm viết chuỗi tên kênh trực tiếp |

### 1.3. Khi hợp đồng thay đổi

Thêm/sửa kênh IPC là thay đổi **cả hai bên**:

1. Cập nhật `shared/channels.js` và `backend/src/schemas/` trước.
2. Cập nhật bảng danh mục kênh trong [ipc-communication.md §5](../01-architecture/ipc-communication.md).
3. Sửa BE và FE **trong cùng một Pull Request**.

---

## 2. Ngôn ngữ và công cụ

- JavaScript ES2022+, chuẩn **ESM**. JSDoc để chú thích kiểu. Không dùng `require` trừ khi native module bắt buộc.
- **Prettier** + **ESLint**, cảnh báo bị coi là lỗi trong CI.
- `npm`. Commit `package-lock.json` của **cả hai** package.

### 2.1. Ghim phiên bản

Có native module nên **lệch phiên bản là gãy build**, không phải khác biệt nhỏ.

| Đối tượng | Luật |
|---|---|
| `electron`, `better-sqlite3` | Ghim **chính xác** (`"38.2.1"`), không dùng `^` hay `~` |
| Node.js | Ghi trong `engines` + file `.nvmrc` |
| Gói khác | `^` chấp nhận được (đã có lockfile) |

**Khi nâng Electron** — đúng thứ tự, không bỏ bước:

```
1. Đổi số phiên bản trong backend/package.json
2. Xoá backend/node_modules
3. npm install
4. npx electron-builder install-app-deps     <- CHỈ với native module NAN (project-structure.md 6.1)
5. Chạy dev, kiểm tra mở DB thành công
6. BUILD BẢN ĐÓNG GÓI và test trên máy sạch  <- KHÔNG được bỏ
```

### 2.2. File cấu hình bắt buộc ở gốc repo

| File | Nội dung tối thiểu | Vì sao bắt buộc |
|---|---|---|
| `.gitattributes` | `* text=auto eol=lf` | Không có thì Windows commit CRLF, diff nhiễu |
| `.editorconfig` | `end_of_line=lf`, `charset=utf-8`, `indent_size=2` | IDE tuân thủ ngay cả khi chưa cài Prettier |
| `.nvmrc` | Phiên bản Node | |
| `.gitignore` | `node_modules/`, `backend/out/`, `backend/renderer/`, `backend/release/`, `frontend/dist/`, `*.db`, `*.db-wal`, `*.db-shm`, `.env*` | Thiếu `*.db` là có ngày commit nhầm dữ liệu thật |

---

## 3. Đặt tên

| Đối tượng | Kiểu chữ | Ví dụ | Vùng |
|---|---|---|---|
| Biến, tham số, hàm | `camelCase` | `taskList`, `createTask` | Chung |
| Hằng số toàn cục | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE` | Chung |
| Class | `PascalCase` | `AppError`, `TaskRepository` | Chung |
| Thư mục | `kebab-case` | `time-log/` | Chung |
| Kênh IPC | `domain:action` | `invoice:create` | Chung |
| React component + file | `PascalCase` / `PascalCase.jsx` | `TaskListItem.jsx` | FE |
| Custom hook | `use` + `camelCase` | `useTaskMutations` | FE |
| CSS class (Module) / custom property | `camelCase` / `--kebab-case` | `.taskItem` / `--color-text-primary` | FE |
| File tầng BE | `<domain>.<tầng>.js` | `invoice.service.js` | BE |
| Bảng và cột DB | `snake_case` | `created_at`, `invoice_tags` | BE |

**Tiền tố động từ có ý nghĩa cố định:**

| Tiền tố | Nghĩa |
|---|---|
| `get` | Lấy giá trị, đồng bộ, không side effect |
| `find` | Tìm, **có thể trả về `null`** |
| `fetch` / `load` | Lấy dữ liệu bất đồng bộ |
| `remove` | Xoá — dùng thay `delete` (từ khoá JS) |
| `is` / `has` / `can` | Trả về boolean |
| `to` / `format` | Chuyển đổi định dạng |
| `handle` / `on` | Xử lý sự kiện |
| `validate` | Kiểm tra, ném lỗi nếu sai |
| `ensure` | Đảm bảo điều kiện, tự khắc phục nếu thiếu |

**Bổ sung riêng của dự án:**

- Đơn vị đo phải có trong tên: `timeoutMs`, `sizeBytes`, `durationSeconds`.
- **Tên định danh bằng tiếng Anh.** Tiếng Việt chỉ dùng cho chuỗi hiển thị, comment và tài liệu.

---

## 4. Giới hạn kích thước

| Chỉ số | Ngưỡng |
|---|---|
| Số dòng của một hàm | 50 |
| Số tham số (vượt thì gom thành object) | 3 |
| Độ sâu lồng nhau | 3 |

Giới hạn riêng cho component React và tầng Backend nằm ở hai tài liệu con.

---

## 5. Định dạng (Prettier) — không tranh luận, bật Format on Save

| Tuỳ chọn | Giá trị |
|---|---|
| `semi` | `false` |
| `singleQuote` | `true` (JSX dùng nháy kép) |
| `printWidth` | `100` |
| `tabWidth` | `2`, không dùng tab |
| `trailingComma` | `'all'` |
| `arrowParens` | `'always'` |
| `endOfLine` | `'lf'` — **quan trọng trên Windows** |

---

## 5b. Chính sách kiểm thử — khi nào BẮT BUỘC có test

Không phải mọi thứ đều cần test. Nhưng ba loại dưới đây **không được** merge nếu thiếu test:

| Bắt buộc có test | Vì sao |
|---|---|
| **Quy tắc nghiệp vụ** ở tầng Service | Đây là thứ dễ hồi quy nhất và khó phát hiện bằng mắt |
| **Hàm có nhánh transaction** | Phải chứng minh rollback đúng khi lỗi giữa chừng |
| **Migration mới** | Chạy từ DB rỗng **và** trên bản sao dữ liệu mẫu |

| Nên có test | Không cần test |
|---|---|
| Repository (SQLite `:memory:`) | Component thuần hiển thị, không có nhánh |
| Hàm tiện ích có nhánh điều kiện | Wrapper mỏng quanh `window.api` |
| Form có validate | Cấu hình, hằng số |
| Custom hook có logic lọc/tính toán | Style |

**Nguyên tắc:**

- **Sửa lỗi thì viết test tái hiện lỗi trước khi sửa** — nếu phạm vi đó có test.
- Test theo **hành vi quan sát được**, không test chi tiết cài đặt nội bộ (state biến gì, hàm nào được gọi).
- Không đặt ngưỡng phần trăm coverage. Coverage cao không đồng nghĩa test tốt, và chạy theo con số sẽ đẻ ra test vô nghĩa.
- Test phải chạy được **không cần khởi động Electron** (đó là lý do `services/` cấm import `electron`).

---

## 6. Import và comment

**Thứ tự import** — 5 nhóm cách nhau một dòng trống: thư viện ngoài → `shared/` → cùng tầng/tầng dưới → tài nguyên & style (FE) → kiểu dữ liệu.

- Alias: FE `@/` → `frontend/src/`; BE `#/` → `backend/src/`; cả hai `@shared/` → `shared/`.
- Tránh đường dẫn tương đối sâu quá 2 cấp. **Cấm import vòng** (`import/no-cycle`).

**Comment** — bắt buộc có khi: workaround cho lỗi thư viện (kèm link issue), tối ưu làm code khó đọc, quy tắc nghiệp vụ không hiển nhiên, regex phức tạp, code trông thừa nhưng thực ra cần.

Nhãn chuẩn: `TODO:` `FIXME:` `HACK:` `NOTE:` `PERF:` — đều phải kèm ngữ cảnh.

**JSDoc** bắt buộc cho: hàm public của Service và Repository, hàm tiện ích dùng chung, custom hook. Tối thiểu: mô tả một dòng, `@param`, `@returns`, `@throws`.

Comment giải thích nghiệp vụ viết **tiếng Việt**; thuật ngữ kỹ thuật giữ tiếng Anh.

---

## 7. ESLint — luật ranh giới FE/BE (quan trọng nhất)

Cấu hình `overrides` theo đường dẫn, dùng `no-restricted-imports`. **Một file cấu hình duy nhất ở gốc repo** — đặt trong từng package thì `shared/` không được lint (xem `phase-framework.md` mục 0.9):

| Phạm vi | Chặn | Thông điệp lỗi nên ghi |
|---|---|---|
| `frontend/src/**` | `electron`, `fs`, `path`, `os`, `child_process`, `better-sqlite3`, `../../backend/**` | "Renderer không được truy cập Node. Dùng window.api." |
| `backend/src/**` | `react`, `react-dom`, `../../frontend/**` | "Backend không được phụ thuộc vào tầng giao diện." |
| `backend/src/services/**` | `electron` | "Service phải chạy được bằng Node thuần để unit test." |
| `backend/src/repositories/**` | `../services/**` | "Repository không được phụ thuộc ngược lên Service." |
| `shared/**` | `fs`, `path`, `electron`, `react`, mọi đường dẫn ngoài `shared/` | "shared/ phải là JS thuần." |

Luật nền cả hai vùng: `eslint:recommended`, `no-unused-vars`, `import/no-cycle`, `eqeqeq`, `no-var`, `prefer-const` — đều mức `error`. Luật riêng từng vùng nằm ở hai tài liệu con.

---

## 8. Checklist chung trước khi tạo Pull Request

Áp dụng cho mọi PR, **cộng thêm** checklist riêng của vùng tương ứng.

- [ ] `npm run lint` và `npm run format:check` sạch ở cả hai package
- [ ] Test liên quan đã pass
- [ ] Không còn `console.log`, code chết, hoặc code bị comment lại "để phòng khi cần"
- [ ] Không vi phạm ranh giới FE/BE ở mục 1
- [ ] Nếu chạm `shared/`: đã sửa **cả hai bên** trong cùng PR và cập nhật danh mục IPC
- [ ] Đã cập nhật `docs/` nếu thay đổi ảnh hưởng kiến trúc, schema, hoặc hợp đồng IPC

---

## Tài liệu liên quan

- [Quy chuẩn code — Frontend](./coding-standards-frontend.md)
- [Quy chuẩn code — Backend](./coding-standards-backend.md)
- [Quy tắc giao tiếp IPC](../01-architecture/ipc-communication.md)
