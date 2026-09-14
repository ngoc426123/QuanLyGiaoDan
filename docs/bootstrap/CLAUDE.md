# ⚠️ REPO NÀY CHƯA KHỞI TẠO

> File này được tự nạp mỗi phiên. Nó tồn tại **chỉ để chặn bạn viết code quá sớm**.
> Khi khởi tạo xong, chính nó sẽ bị thay bằng `CLAUDE.md` thật của dự án.

---

## Đây là gì

Một **template** cho ứng dụng desktop **Electron + React 18/Vite + SQLite cục bộ**, offline,
một người dùng. Thư mục `docs/` chứa toàn bộ luật kiến trúc — đã được viết sẵn và kiểm chứng,
**không phải viết lại**.

Cái chưa có là **nghiệp vụ**: chưa biết ứng dụng này làm gì, có những thực thể nào,
màn hình nào. Đó là việc của bước khởi tạo.

---

## Việc duy nhất được phép làm lúc này

**Đọc `docs/bootstrap/INIT.md` và làm theo từ đầu đến cuối.**

Đó là một quy trình phỏng vấn. Nó sẽ hỏi người dùng vài câu, rồi điền toàn bộ thư mục
`project/`, rồi sinh ra `CLAUDE.md` thật để thay file này.

---

## Cấm tuyệt đối cho tới khi khởi tạo xong

```
1. Viết bất kỳ file mã nguồn nào (.js, .jsx, .json, .sql, .css)
2. Tạo frontend/, backend/, shared/
3. Chạy npm install, hoặc thêm bất kỳ dependency nào
4. Sửa bất kỳ file nào trong docs/  — đó là template dùng chung
5. Tự đoán domain nghiệp vụ thay vì hỏi người dùng
6. Chạy bất kỳ lệnh git nào
```

Lý do cho mục 5: schema, kênh IPC và bản đồ màn hình đều phái sinh từ domain.
Đoán sai domain thì phải viết lại toàn bộ — xem `docs/00-meta/decisions-baseline.md` §2, Q01.

---

## Nếu người dùng yêu cầu làm việc khác

Nói rõ một câu: *"Repo đang ở trạng thái template chưa khởi tạo. Tôi cần chạy
`docs/bootstrap/INIT.md` trước, mất khoảng 10–15 phút hỏi đáp. Bắt đầu nhé?"*

Rồi chờ. **Không** vừa khởi tạo vừa làm việc khác.

Ngoại lệ duy nhất: người dùng chỉ hỏi để tìm hiểu (đọc file, giải thích luật) — trả lời bình thường.

---

## Bản đồ nhanh

| Thư mục | Là gì | Được sửa? |
|---|---|---|
| `docs/` | Template — luật kiến trúc, IPC, bảo mật, SQL, Git | **Không.** Dùng chung nhiều dự án |
| `docs/bootstrap/` | Quy trình khởi tạo. Xoá được sau khi xong | — |
| `docs/examples/sample-domain.md` | Một domain đã điền đầy đủ, làm mẫu đối chiếu | Không |
| `project/` | Nghiệp vụ của dự án. **Đang rỗng** | Có — đây là việc của INIT |
| `CLAUDE.md` | File này. Sẽ bị thay ở bước cuối của INIT | Có, ở bước cuối |

Bắt đầu: `docs/README.md` §1 (luật ranh giới) → `docs/bootstrap/INIT.md`.
