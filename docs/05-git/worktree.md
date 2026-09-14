# Quy trình Worktree

> **Luật**: Mỗi tính năng mới làm trong một **git worktree riêng**, không `checkout` qua lại trên cùng thư mục.
> **Lưu ý**: Agent **không tự tạo worktree**. Người dùng tạo, hoặc agent đề nghị và chờ đồng ý — xem [rules.md §7](./rules.md).

---

## 1. Vì sao worktree, không phải checkout

Với dự án này, chuyển nhánh bằng `checkout` gây ba vấn đề cụ thể:

| Vấn đề | Chi tiết |
|---|---|
| `node_modules` không khớp | Hai nhánh có `package.json` khác nhau → phải `npm install` lại mỗi lần chuyển, ở **cả hai** package |
| Native module phải build lại | `better-sqlite3` biên dịch theo phiên bản Electron. Nhánh nâng Electron sẽ làm hỏng bản build của nhánh kia |
| Mất trạng thái đang chạy | Dev server và tiến trình Electron phải tắt trước khi chuyển nhánh |

Worktree giữ mỗi nhánh ở một thư mục riêng, có `node_modules` riêng, chạy song song được.

---

## 2. Bố cục thư mục

Worktree đặt **ngoài** repo chính, cùng cấp:

```
D:\projects\
├── <project>\                     repo chính — nhánh develop
│   ├── .git\
│   ├── frontend\  node_modules\
│   └── backend\   node_modules\
│
├── <project>-feat-invoice-crud\      worktree — nhánh feature/invoice-crud
│   ├── frontend\  node_modules\    (riêng)
│   └── backend\   node_modules\    (riêng)
│
└── <project>-fix-migration\       worktree — nhánh fix/migration-rollback
```

> **Tuyệt đối không** đặt worktree bên trong thư mục repo chính. Git sẽ thấy nó như file chưa theo dõi, dễ commit nhầm cả cây thư mục.

**Quy ước đặt tên**: `<tên-repo>-<loại>-<mô-tả-ngắn>`, khớp với tên nhánh.

| Nhánh | Thư mục worktree |
|---|---|
| `feature/invoice-crud` | `<project>-feat-invoice-crud` |
| `fix/migration-rollback` | `<project>-fix-migration-rollback` |
| `refactor/ipc-envelope` | `<project>-refactor-ipc-envelope` |

---

## 3. Vòng đời một worktree

### Tạo

```bash
git worktree add ../<project>-feat-invoice-crud -b feature/invoice-crud develop
```

Tách nhánh mới từ `develop`, không phải từ `main`.

### Cài đặt sau khi tạo — BẮT BUỘC, không bỏ qua

```bash
cd ../<project>-feat-invoice-crud
npm run install:all
```

Worktree mới **không có** `node_modules` — git không theo dõi thư mục này. Bỏ qua bước cài là mọi lệnh sẽ lỗi.

Với native module kiểu Node-API (như `better-sqlite3` v12+) thì không cần thêm bước nào — prebuild nằm sẵn trong gói npm. Chỉ native module kiểu NAN mới phải chạy tay ([project-structure.md §6.1](../01-architecture/project-structure.md)):

```bash
cd backend && npx electron-builder install-app-deps
```

### Làm việc

Mở phiên Claude Code **tại thư mục worktree**, không phải repo chính. Lúc đó `CLAUDE.md` và `docs/` của nhánh đó được nạp — đúng ngữ cảnh.

### Kết thúc

Sau khi người dùng đã merge nhánh:

```bash
git worktree remove ../<project>-feat-invoice-crud
git worktree prune
```

> Agent **không chạy hai lệnh này**. Xoá worktree có thể mất thay đổi chưa commit.

---

## 4. Ba cạm bẫy riêng của dự án này

### 4.1. Cổng dev trùng nhau

Hai worktree cùng chạy `npm run dev` sẽ tranh cổng **5173**. Worktree thứ hai hoặc lỗi, hoặc Vite tự nhảy sang 5174 — khiến Main Process nạp nhầm giao diện của worktree kia.

**Giải pháp**: mỗi worktree đặt cổng riêng qua biến môi trường, và Main đọc `VITE_DEV_SERVER_URL` thay vì hardcode `5173`.

| Worktree | Cổng |
|---|---|
| repo chính | 5173 |
| worktree thứ 2 | 5273 |
| worktree thứ 3 | 5373 |

### 4.2. Dữ liệu dev dùng chung — nguy hiểm nhất

`app.getPath('userData')` trả về **cùng một đường dẫn** cho mọi worktree, vì nó phụ thuộc tên ứng dụng chứ không phụ thuộc thư mục mã nguồn.

```
<project>\               ─┐
<project>-feat-a\        ─┼──▶  %APPDATA%\<AppName>\data\app.db
<project>-fix-b\         ─┘     (CÙNG MỘT FILE)
```

Hậu quả: worktree đang phát triển migration `005` chạy lên DB dùng chung → `user_version` nhảy lên 5 → repo chính (chỉ có 4 migration) **từ chối khởi động** vì luật chặn hạ cấp, hoặc tệ hơn là dữ liệu thử nghiệm lẫn vào nhau.

**Giải pháp bắt buộc**: ở chế độ dev, tách `userData` theo worktree.

```
Dev:  app.setPath('userData', <userData mặc định> + '-dev-' + <tên nhánh hoặc APP_INSTANCE>)
Prod: giữ nguyên mặc định
```

Đặt `app.setPath` **trước** `app.whenReady()`, và chỉ khi `!app.isPackaged`.

> Đây là việc của **Phase 0**, không phải để dành. Không có nó thì worktree thứ hai sẽ làm hỏng dữ liệu dev của worktree thứ nhất.

### 4.3. Một tiến trình Electron tại một thời điểm

App dùng `requestSingleInstanceLock()`. Nếu lock theo tên ứng dụng, worktree thứ hai mở lên sẽ **tự thoát ngay** vì tưởng đã có instance chạy.

**Giải pháp**: ở dev, đưa định danh worktree vào `app.setName()` hoặc dùng khoá lock riêng, để mỗi worktree là một "ứng dụng" khác nhau dưới góc nhìn của OS.

---

## 5. Bảng kiểm khi mở một worktree mới

- [ ] Worktree nằm **ngoài** thư mục repo chính
- [ ] Nhánh tách từ `develop`, không phải `main`
- [ ] Đã chạy `npm run install:all` trong worktree
- [ ] `better-sqlite3` đã được rebuild (mở app, tạo thử một bản ghi)
- [ ] Cổng dev khác với worktree đang chạy
- [ ] `userData` ở dev đã tách riêng — kiểm bằng cách in đường dẫn DB ra log lúc khởi động
- [ ] Phiên Claude Code mở **tại thư mục worktree**, không phải repo chính

---

## 6. Khi nào KHÔNG cần worktree

Không phải việc gì cũng cần:

| Dùng worktree | Không cần |
|---|---|
| Tính năng mới (nhiều file, nhiều ngày) | Sửa lỗi chính tả trong docs |
| Nâng phiên bản Electron / native module | Sửa một dòng comment |
| Thử nghiệm có thể phải bỏ | Cập nhật một file tài liệu |
| Refactor lớn | |

Việc nhỏ, gọn trong một lượt → làm thẳng trên nhánh hiện tại, người dùng tự commit.

---

## 7. Lệnh tham khảo

> Agent **không tự chạy** các lệnh này. Bảng để người dùng dùng, và để agent soạn sẵn khi được yêu cầu.

| Việc | Lệnh |
|---|---|
| Liệt kê worktree | `git worktree list` |
| Tạo worktree + nhánh mới | `git worktree add ../<thư-mục> -b <nhánh> develop` |
| Tạo worktree từ nhánh đã có | `git worktree add ../<thư-mục> <nhánh>` |
| Xoá worktree | `git worktree remove ../<thư-mục>` |
| Dọn tham chiếu chết | `git worktree prune` |

---

## Tài liệu liên quan

- [Quy tắc Git — ràng buộc hành vi](./rules.md)
- [Quy ước commit và nhánh](./commit-convention.md)
- [Cấu trúc repo và Build](../01-architecture/project-structure.md)
