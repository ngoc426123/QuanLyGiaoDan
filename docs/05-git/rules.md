# Quy tắc Git — ràng buộc hành vi

> **Đây là ràng buộc mạnh nhất trong toàn bộ bộ tài liệu.** Git là nơi duy nhất agent có thể gây mất mát không phục hồi được (lịch sử bị viết lại, thay đổi chưa lưu bị xoá, dữ liệu bị đẩy lên remote).
> Khi phân vân giữa "làm" và "hỏi" → **luôn chọn hỏi**.

---

## 1. Luật nền

```
Mặc định: KHÔNG chạy bất kỳ lệnh git nào.

Chỉ chạy khi người dùng yêu cầu rõ ràng TRONG chính tin nhắn đó.
Được phép một lần không có nghĩa được phép lần sau.
```

Việc người dùng đã đồng ý cho chạy `git status` ở lượt trước **không** cho phép chạy `git diff` ở lượt sau. Mỗi lệnh, mỗi lần.

---

## 2. Ba nhóm lệnh

### Nhóm A — KHÔNG BAO GIỜ tự làm

Người dùng tự thực hiện. Agent không chạy, kể cả khi thấy "rõ ràng là nên commit".

| Lệnh | |
|---|---|
| `git commit` | Người dùng tự commit |
| `git push` | Người dùng tự push |
| `git merge` | |
| `git rebase` | |
| `git cherry-pick` | |
| `git tag` | |
| `git revert` | |

Khi công việc xong, agent **soạn sẵn commit message** và đưa cho người dùng (xem mục 4), **không** chạy lệnh.

### Nhóm B — CẤM TUYỆT ĐỐI, kể cả khi được yêu cầu

Những lệnh này phá huỷ công sức không phục hồi được. Nếu người dùng yêu cầu, **hỏi lại xác nhận** và nói rõ sẽ mất gì.

| Lệnh | Mất gì |
|---|---|
| `git reset --hard` | Toàn bộ thay đổi chưa commit |
| `git checkout -- <file>` / `git restore <file>` | Thay đổi chưa lưu của file đó |
| `git clean -fd` | Mọi file chưa được theo dõi — kể cả file người dùng mới tạo |
| `git push --force` | Lịch sử trên remote của người khác |
| `git push --force-with-lease` | Vẫn là ghi đè — phải xác nhận |
| `git branch -D` | Nhánh chưa merge |
| `git stash drop` / `git stash clear` | Stash đã lưu |
| `git commit --amend` | Commit cũ (ưu tiên tạo commit mới) |
| `git filter-branch`, `git reflog expire` | Lịch sử |

### Nhóm C — Chỉ đọc, vẫn phải được yêu cầu

`git status` · `git diff` · `git log` · `git branch --list` · `git worktree list` · `git remote -v`

Không phá hoại, nhưng theo luật nền vẫn **phải được yêu cầu**. Muốn biết file nào đã đổi thì dùng công cụ đọc file thông thường, không dùng git.

---

## 3. Cấm bỏ qua cơ chế an toàn

| Cấm | Vì sao |
|---|---|
| `--no-verify` | Bỏ qua pre-commit hook — hook tồn tại là có lý do. Hook fail thì **sửa nguyên nhân**, không bỏ qua |
| `--no-gpg-sign` | Bỏ qua ký commit |
| `git add -A` / `git add .` | Vơ cả file rác, file tạm, file bí mật. Nếu được yêu cầu commit thì **liệt kê từng file** thuộc phạm vi công việc |
| `git config` sửa cấu hình toàn cục | Ảnh hưởng mọi repo trên máy |
| Lệnh tương tác (`rebase -i`, `add -i`) | **Không chạy được** trong môi trường này — sẽ treo |

---

## 4. Khi công việc xong — làm gì thay vì commit

```
1. Liệt kê file đã tạo / sửa / xoá, kèm một dòng mô tả mỗi file
2. Soạn sẵn commit message đúng quy ước (xem commit-convention.md)
3. Nêu rõ nếu có file KHÔNG nên commit (file tạm, file thử nghiệm)
4. DỪNG. Người dùng tự commit.
```

Mẫu báo cáo:

```
Đã xong. Thay đổi:
  M  backend/src/services/invoice.service.js   thêm quy tắc chặn đóng bản ghi cha
  A  backend/src/repositories/invoice.repository.js
  M  project/database-schema.md              cập nhật bảng invoices

Commit message đề xuất:

feat(be): thêm quy tắc chặn đóng bản ghi cha khi còn bản ghi con

Bản ghi cha chỉ được chuyển sang 'done' khi mọi bản ghi con đã done hoặc
cancelled. Kiểm tra ở tầng Service, ném CONFLICT nếu vi phạm.
```

---

## 5. Xử lý xung đột (merge conflict)

| Luật |
|---|
| **Không tự ý giải quyết xung đột.** Hiển thị nội dung xung đột và hỏi chọn bên nào |
| Nếu được yêu cầu giải quyết: chỉ sửa đúng vùng xung đột, không nhân tiện sửa thứ khác |
| **Không bao giờ** giải quyết xung đột bằng cách xoá phần của người khác cho nhanh |
| Xung đột ở `package-lock.json` → không sửa tay, chạy lại `npm install` |
| Xung đột ở file migration → **dừng và hỏi**. Hai migration cùng số là lỗi nghiêm trọng, phải đánh số lại |

---

## 6. Những gì không bao giờ được đưa vào Git

Ngay cả khi người dùng yêu cầu commit, agent phải cảnh báo nếu thấy các file sau nằm trong phạm vi:

| Loại | Ví dụ |
|---|---|
| Bí mật | `.env`, `.env.local`, file chứa token/API key |
| Dữ liệu thật | `*.db`, `*.db-wal`, `*.db-shm`, thư mục `backups/` |
| Sản phẩm build | `node_modules/`, `frontend/dist/`, `backend/out/`, `backend/renderer/`, `backend/release/` |
| Log | `*.log`, thư mục `logs/` |
| File cá nhân | `.vscode/settings.json` (trừ khi cố ý dùng chung), file scratch |

> `.gitignore` đã chặn sẵn các mục này ([coding-standards.md §2.2](../04-guidelines/coding-standards.md)). Nếu thấy một file thuộc nhóm trên **vẫn xuất hiện** trong thay đổi → báo ngay, `.gitignore` đang thiếu.

---

## 7. Nhánh hiện tại

| Luật |
|---|
| **Không tự chuyển nhánh** (`git checkout`, `git switch`) |
| **Không tự tạo nhánh.** Tính năng mới dùng worktree — xem [worktree.md](./worktree.md) |
| Nếu phát hiện đang ở nhánh `main` và sắp sửa code → **dừng và báo**, đề nghị tạo worktree |
| Không xoá nhánh |

---

## 8. Tóm tắt — dán vào đầu mỗi phiên

```
KHÔNG commit. KHÔNG push. KHÔNG merge. KHÔNG rebase.
KHÔNG reset --hard. KHÔNG clean. KHÔNG force.
KHÔNG tự chuyển hay tạo nhánh.
Không chạy lệnh git nào khi chưa được yêu cầu — kể cả lệnh chỉ đọc.

Xong việc -> liệt kê file đã đổi + soạn commit message -> DỪNG.
```

---

## Tài liệu liên quan

- [Quy trình Worktree](./worktree.md)
- [Quy ước commit và nhánh](./commit-convention.md)
- [Quy tắc làm việc cho AI Agent](../00-meta/agent-rules.md)
