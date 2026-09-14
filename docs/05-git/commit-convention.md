# Quy ước commit và nhánh

> Đây là **quy ước về nội dung**, không phải hướng dẫn thực thi. Agent soạn message theo mẫu này rồi đưa cho người dùng — không chạy `git commit` ([rules.md](./rules.md)).

---

## 1. Nhánh

| Mẫu tên | Dùng cho | Tách từ |
|---|---|---|
| `main` | Nhánh ổn định, luôn build được | — |
| `develop` | Nhánh tích hợp | `main` |
| `feature/<mô-tả-ngắn>` | Tính năng mới | `develop` |
| `fix/<mô-tả-ngắn>` | Sửa lỗi | `develop` |
| `hotfix/<mô-tả-ngắn>` | Sửa lỗi khẩn trên bản đã phát hành | `main` |
| `refactor/<mô-tả-ngắn>` | Tái cấu trúc, không đổi hành vi | `develop` |
| `docs/<mô-tả-ngắn>` | Chỉ sửa tài liệu | `develop` |

Mô tả ngắn viết `kebab-case`, tiếng Anh, 2–4 từ: `feature/invoice-crud`, `fix/migration-rollback`.

---

## 2. Commit message — Conventional Commits

```
<type>(<scope>): <mô tả ngắn, thể mệnh lệnh, không dấu chấm cuối>

[thân: giải thích TẠI SAO, không phải CÁI GÌ. Xuống dòng ở cột 72]

[footer: tham chiếu issue, ghi chú breaking change]
```

### 2.1. `type`

| `type` | Dùng khi |
|---|---|
| `feat` | Thêm tính năng |
| `fix` | Sửa lỗi |
| `refactor` | Đổi cấu trúc, giữ nguyên hành vi |
| `perf` | Cải thiện hiệu năng |
| `style` | Format, không đổi logic |
| `docs` | Tài liệu |
| `test` | Thêm/sửa test |
| `chore` | Cấu hình, phụ thuộc, công cụ |
| `build` | Đóng gói, CI |

### 2.2. `scope` — phải cho biết vùng nào bị ảnh hưởng

| `scope` | Vùng |
|---|---|
| `fe`, `ui`, `<domain>-ui` | Frontend |
| `be`, `ipc`, `db`, `service`, `repo` | Backend |
| `shared` | **Báo hiệu ảnh hưởng CẢ HAI bên** |
| `build`, `config` | Hạ tầng |
| `docs` | Tài liệu |

### 2.3. Ví dụ

```
feat(invoice-ui): thêm kéo-thả sắp xếp thứ tự danh sách

Dùng sort_order thay vì thứ tự trả về từ SQL, để người dùng
tự sắp xếp được. Cập nhật N dòng trong một transaction để
tránh trạng thái nửa vời khi app bị tắt giữa chừng.
```

```
fix(db): chặn khởi động khi user_version cao hơn số migration

Cài đè bản cũ lên DB mới khiến code cũ ghi đè schema mới và
hỏng dữ liệu vĩnh viễn. Nay app hiện dialog và thoát an toàn.
```

```
feat(shared)!: thêm expectedUpdatedAt vào mọi kênh update

BREAKING CHANGE: mọi kênh *:update bắt buộc nhận
expectedUpdatedAt. Đã cập nhật đồng thời backend/src/schemas,
backend/src/services và frontend/src/features.
```

---

## 3. Quy tắc về nội dung commit

| Luật | Lý do |
|---|---|
| **Một commit — một việc** | Không gộp sửa lỗi với tái cấu trúc, không gộp hai tính năng |
| Commit chạm `shared/` phải nêu rõ trong thân là **cả FE và BE** bị ảnh hưởng | `shared/` là hợp đồng chung |
| Không commit code đang hỏng vào `develop` hay `main` | |
| Thay đổi phá vỡ tương thích → thêm `!` sau scope **và** mục `BREAKING CHANGE:` ở footer | |
| Mô tả viết bằng **tiếng Việt** | Thống nhất với docs. Giữ `type`/`scope` tiếng Anh |
| Thân commit giải thích **tại sao**, không liệt kê lại file đã sửa | `git diff` đã nói file nào đổi |

---

## 4. Khi nào tách commit

Nếu một lần làm việc chạm nhiều loại thay đổi, tách thành nhiều commit theo thứ tự:

```
1. chore/build   cấu hình, dependency
2. docs          cập nhật tài liệu (nếu là tiền đề cho thay đổi sau)
3. feat/fix      thay đổi chính
4. test          test đi kèm (hoặc gộp vào commit 3)
```

Ví dụ một lần thêm thực thể mới (theo [recipes.md công thức 1](../04-guidelines/recipes.md)) nên tách:

```
docs(db): bổ sung bảng tags vào schema và ERD
feat(db): migration 002 tạo bảng tags và invoice_tags
feat(be): thêm TagService, TagRepository và kênh tag:*
feat(ui): thêm màn hình quản lý tag và gán tag cho bản ghi
```

---

## 5. Pull Request

| Mục | Yêu cầu |
|---|---|
| Tiêu đề | Cùng định dạng commit message |
| Mô tả | Làm gì · vì sao · đã kiểm thử thế nào · ảnh hưởng tới đâu |
| Phạm vi | Một PR — một mục đích. Không kèm refactor ngoài phạm vi |
| Checklist | Đối chiếu checklist ở cuối file quy chuẩn tương ứng trước khi mở PR |
| Chạm `shared/` | Bắt buộc sửa **cả FE và BE trong cùng PR** |

---

## 6. Ghi chú khi agent được yêu cầu commit

Trường hợp người dùng yêu cầu rõ ràng "commit hộ tôi":

- Chỉ stage **đúng những file thuộc phạm vi công việc**, liệt kê từng file. Không `git add .`
- Không `--no-verify`. Hook fail thì dừng, báo lỗi, sửa nguyên nhân
- Nếu đang ở nhánh `main` → dừng và hỏi, đề nghị tạo nhánh hoặc worktree trước
- Message kết thúc bằng dòng:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

---

## 7. File cấu hình Git bắt buộc

| File | Nội dung tối thiểu | Vì sao |
|---|---|---|
| `.gitattributes` | `* text=auto eol=lf` | Không có thì Windows commit CRLF, diff nhiễu, script trong repo gãy |
| `.gitignore` | `node_modules/`, `frontend/dist/`, `backend/out/`, `backend/renderer/`, `backend/release/`, `*.db`, `*.db-wal`, `*.db-shm`, `logs/`, `.env*` | Thiếu `*.db` là có ngày commit nhầm dữ liệu thật |

Danh sách đầy đủ những gì không bao giờ được commit: [rules.md §6](./rules.md).

---

## Tài liệu liên quan

- [Quy tắc Git — ràng buộc hành vi](./rules.md)
- [Quy trình Worktree](./worktree.md)
- [Công thức thay đổi](../04-guidelines/recipes.md)
