# Template tài liệu — ứng dụng Electron + SQLite cục bộ

> **Đây là xương sống dùng lại được, không phải tài liệu của một dự án cụ thể.**
> Thư mục này **không chứa nghiệp vụ**. Nghiệp vụ của dự án nằm ở `project/`.

| | |
|---|---|
| Phiên bản | xem [`TEMPLATE_VERSION`](./TEMPLATE_VERSION) · lịch sử ở [`CHANGELOG.md`](./CHANGELOG.md) |
| Phạm vi | Electron + React 18/Vite + SQLite (`better-sqlite3`), offline, một người dùng |
| Ngôn ngữ | Tài liệu tiếng Việt, định danh code tiếng Anh |

---

## 1. Luật ranh giới — đọc trước mọi thứ khác

**Sửa file trong `docs/` = sửa template, phải mang sang mọi dự án khác.
Nếu điều đó chỉ đúng với dự án hiện tại → nó thuộc `project/`.**

Khi phân vân, hỏi: *"Dự án Electron+SQLite tiếp theo của tôi có cần luật này không?"*

| Có | Không |
|---|---|
| "Mọi kênh `*:update` phải nhận `expectedUpdatedAt`" | "Kênh `invoice:update` nhận thêm `taxCode`" |
| "Mọi bảng nghiệp vụ có `deleted_at`" | "Bảng `invoices` có cột `issued_date`" |
| "Màn hình phải xử lý đủ 5 trạng thái" | "Có màn hình `/invoices/:id`" |
| → `docs/` | → `project/` |

---

## 2. Ba tầng tài liệu

| Tầng | Ở đâu | Nội dung | Sang dự án mới |
|---|---|---|---|
| 1. Template | `docs/` | Luật kiến trúc, IPC, bảo mật, SQL, Git | **Copy nguyên xi** |
| 2. Quyết định dự án | `project/decisions.md` | Cùng stack nhưng chọn khác: TypeScript? i18n? mã hoá DB? | Trả lời lại 5 câu hỏi |
| 3. Nghiệp vụ | `project/` (còn lại) | Schema, kênh IPC, màn hình, thuật ngữ | Viết mới hoàn toàn |

`CLAUDE.md` ở gốc repo **trộn cả 3 tầng** — bắt buộc, vì Claude tự nạp file đó và nó phải nằm ở gốc.
Sinh nó từ [`CLAUDE.template.md`](./CLAUDE.template.md).

---

## 3. Mục lục

### 00 — Meta (quy tắc vận hành)

| File | Nội dung |
|---|---|
| [agent-rules.md](./00-meta/agent-rules.md) | **Quy tắc làm việc cho AI agent.** Khi nào phải hỏi, phạm vi một lần thay đổi, định nghĩa "xong" và **bước tự rà soát bắt buộc**, báo cáo trung thực, xử lý khi docs mâu thuẫn thực tế, chống trôi dạt qua nhiều phiên |
| [naming-conventions.md](./00-meta/naming-conventions.md) | Quy ước ngôn ngữ (định danh EN ↔ hiển thị VN), thuật ngữ kỹ thuật thống nhất, cách viết chuỗi tiếng Việt trên UI, danh sách viết tắt được phép |
| [decisions-baseline.md](./00-meta/decisions-baseline.md) | **18 quyết định nền** của template kèm lý do và mức khó đảo ngược; **5 câu hỏi** mỗi dự án phải trả lời |

### 01 — Kiến trúc hệ thống

| File | Nội dung |
|---|---|
| [overview.md](./01-architecture/overview.md) | Ba vùng thực thi, **cấu hình bảo mật `BrowserWindow` bắt buộc**, luồng dữ liệu, quy tắc phụ thuộc, vòng đời app (single-instance lock, khôi phục cửa sổ, Renderer chết) |
| [project-structure.md](./01-architecture/project-structure.md) | **Đặc tả build.** Cấu trúc repo, phân loại dependency, thư mục `shared/`, luồng dev và build, **bảng giá trị cấu hình chính xác kèm hậu quả nếu sai**, biến môi trường, CSP, checklist build |
| [ipc-communication.md](./01-architecture/ipc-communication.md) | Ba kiểu giao tiếp, quy ước đặt tên kênh, envelope chuẩn, **chống mất dữ liệu khi cập nhật chồng chéo**, kênh hạ tầng, bảng mã lỗi, quy tắc viết Preload và Handler |
| [security.md](./01-architecture/security.md) | **Mô hình mối đe doạ.** Xếp hạng 6 bề mặt tấn công, ba sự thật về file SQLite cục bộ, rủi ro thư viện npm, xử lý file/đường dẫn, quyết định mã hoá DB, và **danh sách những thứ KHÔNG cần lo** |

### 02 — Xử lý dữ liệu & Lưu trữ

| File | Nội dung |
|---|---|
| [storage-strategy.md](./02-backend-data/storage-strategy.md) | Vì sao `better-sqlite3`, phân vai các kho lưu trữ, vị trí trên đĩa, **pragma bắt buộc**, migration + **chặn hạ cấp phiên bản**, backup |
| [database-conventions.md](./02-backend-data/database-conventions.md) | **Quy ước áp cho mọi bảng**: đặt tên, ánh xạ kiểu, hai loại thời gian, cột bắt buộc, soft delete, khoá ngoại, bảng `settings`, FTS5, checklist thêm bảng |
| [data-services.md](./02-backend-data/data-services.md) | **Sở hữu kiến trúc Backend**: phân tầng Handler → Service → Repository, validation ba tầng, xử lý lỗi, transaction, tác vụ nền, log, kiểm thử |

### 03 — Giao diện & UI/UX

| File | Nội dung |
|---|---|
| [ui-structure.md](./03-frontend/ui-structure.md) | Khác biệt với web, App Shell, **5 trạng thái bắt buộc của mỗi màn hình**, phân loại component 4 nhóm, danh mục design token, accessibility, phím tắt chung |
| [state-management.md](./03-frontend/state-management.md) | Phân loại 4 nhóm state, TanStack Query cho server state, Zustand cho UI state, quy ước query key, cơ chế invalidate, optimistic update |

### 04 — Quy chuẩn & Phát triển

| File | Nội dung |
|---|---|
| [coding-standards.md](./04-guidelines/coding-standards.md) | **Phần chung — cả hai bên bắt buộc đọc.** Ranh giới FE/BE và luật cấm import chéo, ngôn ngữ chung qua IPC, đặt tên, Prettier, chính sách test, ESLint nền |
| [coding-standards-frontend.md](./04-guidelines/coding-standards-frontend.md) | **Riêng `frontend/`** — tổ chức file, component và hooks, CSS Modules, giao tiếp với Backend qua hook, chống double-submit, hiển thị thời gian, hiệu năng render |
| [coding-standards-backend.md](./04-guidelines/coding-standards-backend.md) | **Riêng `backend/`** — tổ chức file, luật phụ thuộc 4 tầng, **luật viết SQL**, đường dẫn file, ESLint, checklist |
| [recipes.md](./04-guidelines/recipes.md) | **Công thức thay đổi.** 8 công thức: thêm thực thể mới (15 bước), thêm kênh IPC, thêm cột, thêm màn hình, thêm UI primitive, thêm dependency, sửa lỗi, chốt quyết định |
| [phase-framework.md](./04-guidelines/phase-framework.md) | **Khung 9 phase** kèm Definition of Done từng phase, quy tắc thực thi, sổ tay rủi ro cố hữu của stack |

### 05 — Git

| File | Nội dung |
|---|---|
| [rules.md](./05-git/rules.md) | **Ràng buộc hành vi.** Ba nhóm lệnh (không bao giờ tự làm / cấm tuyệt đối / chỉ đọc), cấm bỏ qua hook, xong việc thì soạn commit message rồi dừng, file không bao giờ được commit |
| [worktree.md](./05-git/worktree.md) | **Quy trình worktree** và **3 cạm bẫy riêng của stack này**: trùng cổng dev, dùng chung `userData`, single-instance lock |
| [commit-convention.md](./05-git/commit-convention.md) | Quy ước nhánh, Conventional Commits, khi nào tách commit, yêu cầu PR |

### Phụ lục

| File | Nội dung |
|---|---|
| [CLAUDE.template.md](./CLAUDE.template.md) | Khung `CLAUDE.md` cho dự án mới — copy lên gốc repo rồi điền `<...>` |
| [examples/sample-domain.md](./examples/sample-domain.md) | **Một domain đã điền đầy đủ** (Task Manager) — mẫu đối chiếu hình dạng cho `project/` |
| [bootstrap/INIT.md](./bootstrap/INIT.md) | **Quy trình khởi tạo dự án mới** — phỏng vấn domain rồi điền `project/`. Xem §4 |
| [CHANGELOG.md](./CHANGELOG.md) | Lịch sử thay đổi template + cách đánh số phiên bản |

---

## 4. Khởi tạo một dự án mới

### 4.0. Luật nền

> **Thứ duy nhất Claude Code tự nạp khi mở repo là `CLAUDE.md`** — ở **gốc repo**,
> và ở **`~/.claude/CLAUDE.md`** (cấu hình toàn cục của máy).
>
> Một repo chỉ có mỗi thư mục `docs/`, gốc không có `CLAUDE.md`, thì agent **không biết**
> `docs/` là gì và không có lý do gì để mở ra đọc.

Có hai cách vượt qua điều đó. Chọn một, hoặc dùng cả hai.

### 4.1. Cách A — luật toàn cục *(chỉ cần copy `docs/`)*

Thêm **một lần duy nhất** vào `~/.claude/CLAUDE.md`:

```markdown
# Uninitialized project template — check this FIRST, every session

At the very start of a session, before acting on anything I ask:

- If the repo root has **no** `CLAUDE.md` **and** the file `docs/bootstrap/INIT.md` **does**
  exist, then this repo is an **uninitialized project template**.
- Verify with a single check (e.g. `ls docs/bootstrap/INIT.md`). Do not guess.

When that is the case:

1. Tell me in one sentence that the repo is an uninitialized template and that you are going
   to run the initialization interview first.
2. Read `docs/bootstrap/INIT.md` and follow it from Step 0 to Step 6.
3. Until that process finishes, do **not**: write any source file, create
   `frontend/` / `backend/` / `shared/`, run `npm install`, add a dependency, or guess the
   business domain.
4. Never modify anything inside `docs/` — it is a template shared across projects.

If the root `CLAUDE.md` already exists, the project is initialized. Ignore this section entirely.
```

Từ đó, mỗi dự án mới chỉ cần **một lệnh**:

```bash
cp -r ../electron-sqlite-template/docs ./docs
```

Mở Claude Code, nói gì cũng được — agent kiểm tra, nhận ra template chưa khởi tạo, và chạy
`INIT.md` trước. Bước 0 của INIT tự lắp `project/` ra gốc.

| Ưu | Nhược |
|---|---|
| Đúng cái bạn muốn: chỉ copy `docs/` | Luật nằm ở **máy của bạn**, không nằm trong repo |
| Không phải nhớ chạy script | Người khác clone repo về sẽ không có luật này → repo không tự mô tả được |

### 4.2. Cách B — repo tự chứa *(copy `docs/` + 1 file)*

```bash
cp -r ../electron-sqlite-template/docs ./docs
cp docs/bootstrap/CLAUDE.md ./CLAUDE.md
```

Hai lệnh thay vì một, nhưng repo **tự mô tả được**: ai clone về cũng thấy ngay
`⚠️ REPO NÀY CHƯA KHỞI TẠO`, không phụ thuộc cấu hình máy.

Muốn có sẵn cả `project/` và lối tắt `/init-project` thì chạy
`bash docs/bootstrap/init.sh` (hoặc `pwsh docs/bootstrap/init.ps1`) thay cho lệnh thứ hai.

> **Khuyến nghị: làm cả hai.** Cách A cho tiện lúc bạn tự khởi tạo; cách B cho repo đứng
> một mình được. Chúng không đá nhau — khi gốc đã có `CLAUDE.md` thì luật toàn cục tự im.

### 4.3. Agent sẽ làm gì

`CLAUDE.md` mồi chặn mọi việc khác và chỉ agent đọc
[`bootstrap/INIT.md`](./bootstrap/INIT.md) — quy trình phỏng vấn:

| Bước | Việc |
|---|---|
| 0 | Kiểm tra repo thật sự chưa khởi tạo |
| 1 | Hỏi: app làm gì · tên · ai dùng · dữ liệu có nhạy cảm không · đã có dữ liệu sẵn chưa · 5 câu hỏi khung |
| 2 | Khai thác domain: thực thể, thuộc tính, quan hệ, màn hình — rồi **chốt lại với người dùng trước khi viết** |
| 3 | Điền 8 file `project/` theo đúng thứ tự phụ thuộc |
| 4 | Sinh `CLAUDE.md` thật từ [`CLAUDE.template.md`](./CLAUDE.template.md), **ghi đè bản mồi** |
| 5 | Kiểm chứng chéo 9 mục |
| 6 | Dọn dẹp, soạn commit message, bàn giao |

> Bước 4 là thứ đánh dấu "đã khởi tạo": bản mồi bị ghi đè bằng `CLAUDE.md` thật của dự án,
> và quy trình không chạy lại nữa.

**Không chạy được script?** Làm tay — copy ba thứ này từ `docs/bootstrap/` lên gốc repo:

| Từ | Tới |
|---|---|
| `docs/bootstrap/CLAUDE.md` | `CLAUDE.md` |
| `docs/bootstrap/project/` | `project/` |
| `docs/bootstrap/init-project.md` | `.claude/commands/init-project.md` |

Rồi mở Claude Code. Nếu vì lý do gì đó agent vẫn không nhận ra, bảo thẳng:
*"đọc `docs/bootstrap/INIT.md` và làm theo"*.

> **Thứ có giá trị nhất khi tái dùng không phải nội dung, mà là _cấu trúc câu hỏi_**: bộ tài liệu
> này ép phải trả lời những câu mà nếu bỏ qua sẽ trả giá về sau — ai sinh ID, thời gian lưu thế nào,
> xung đột cập nhật xử lý ra sao, migration hạ cấp thì sao, agent được tự quyết tới đâu.
>
> `bootstrap/INIT.md` là chỗ những câu đó được hỏi ra thành lời.

---

## 5. Cập nhật template về sau

Template sống trong repo riêng. Dự án copy nó kèm số phiên bản.

| Tình huống | Làm gì |
|---|---|
| Phát hiện một luật sai / thiếu **khi đang làm dự án** | Sửa ở **repo template**, tăng `TEMPLATE_VERSION`, ghi `CHANGELOG.md`. Rồi mới copy về dự án |
| Muốn biết dự án tụt hậu bao nhiêu | So `docs/TEMPLATE_VERSION` của dự án với bản mới nhất; đọc `CHANGELOG.md` phần ở giữa |
| Luật chỉ đúng với dự án này | **Không** sửa `docs/`. Ghi vào `project/decisions.md` §4 (ngoại lệ) |

**Cấm sửa `docs/` trực tiếp trong repo dự án** — thay đổi sẽ mất khi cập nhật template,
và dự án khác không bao giờ nhận được.

---

## 6. Đọc gì khi làm việc gì

| Đang làm gì | Chỉ cần đọc |
|---|---|
| Dựng dự án, cấu hình build, sửa lỗi đóng gói | `project-structure.md` |
| Viết màn hình / component React | `coding-standards-frontend.md` + `ui-structure.md` |
| Viết logic lấy/lưu dữ liệu ở UI | `state-management.md` + `project/invalidate-rules.md` |
| Thêm hoặc sửa một kênh IPC | `ipc-communication.md` + `project/ipc-channels.md` |
| Viết Service / Repository / migration | `data-services.md` + `coding-standards-backend.md` |
| Thêm bảng, đổi schema | `database-conventions.md` + `project/database-schema.md` + `storage-strategy.md` §5 |
| Thêm thực thể / kênh / cột / màn hình mới | `recipes.md` — làm theo đúng công thức |
| Bắt đầu một tính năng mới | `05-git/worktree.md` |
| Xong việc, chuẩn bị commit | `05-git/rules.md` §4 + `05-git/commit-convention.md` |
| Không rõ được tự quyết tới đâu | `00-meta/agent-rules.md` |
| Không rõ đặt tên gì | `00-meta/naming-conventions.md` + `project/glossary.md` |

**Đọc theo vai trò:**

| Vai trò | Thứ tự |
|---|---|
| **Dev Frontend** | `overview` → `project-structure` → `security` → `ipc-communication` → `ui-structure` → `state-management` → `coding-standards` → `coding-standards-frontend` |
| **Dev Backend** | `overview` → `project-structure` → `security` → `ipc-communication` → `storage-strategy` → `database-conventions` → `data-services` → `coding-standards` → `coding-standards-backend` |

Hai tài liệu **cả hai bên đều phải đọc** vì chúng là hợp đồng chung:
[ipc-communication.md](./01-architecture/ipc-communication.md) và
[coding-standards.md](./04-guidelines/coding-standards.md) §1 (Ranh giới FE/BE).

---

## 7. Nguyên tắc sử dụng

1. **Tài liệu là hợp đồng, không phải gợi ý.** Khi code khác tài liệu, một trong hai phải sửa — ngay, không để trôi.
2. **Mỗi tài liệu có checklist ở cuối.** Dùng nó khi review, đừng review bằng cảm tính.
3. **Cập nhật tài liệu nằm trong Definition of Done** của mỗi Pull Request.
4. **Luật chỉ nằm ở một chỗ.** Trước khi viết một luật mới, tìm xem nó đã tồn tại ở file nào chưa.
