# Kế hoạch triển khai Elecrusion — Quản lý giáo dân giáo xứ

> **File này là chỉ mục.** Mỗi phase một file, mô tả **từng bước cụ thể** cần làm:
> tạo file nào, nội dung gì, kiểm chứng ra sao.

---

## Quan hệ với `docs/` và `project/`

| Nguồn      | Vai trò                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| `docs/`    | **Template** — luật kiến trúc dùng chung cho mọi dự án Electron + SQLite. Nguồn chân lý về _cách làm_ |
| `project/` | **Đặc tả nghiệp vụ** — schema, kênh IPC, màn hình, thuật ngữ. Nguồn chân lý về _làm cái gì_           |
| `plan/`    | **Bản thi công** — dịch hợp đồng thành danh sách việc theo thứ tự                                     |

**Khi `plan/` lệch với `docs/` hoặc `project/` → hai file kia đúng.** Sửa `plan/`, không sửa chúng để hợp thức hoá.
Cách xử lý mâu thuẫn: `docs/00-meta/agent-rules.md` §6.

`plan/` **không** định nghĩa luật mới. Mọi dòng ở đây phải truy ngược được về một mục trong `docs/` hoặc `project/`.

> **Cấm sửa `docs/`** khi đang thi công — đó là template dùng chung. Chi tiết: `project/README.md`.

---

## Thứ tự thực hiện

| #   | File                                                 | Tên                                      | Ước lượng  | Trạng thái |
| --- | ---------------------------------------------------- | ---------------------------------------- | ---------- | :--------: |
| —   | [00-domain-lock-in.md](./00-domain-lock-in.md)       | **Tiền đề** — chốt domain, cập nhật docs | 0.5–1 ngày |     ☑      |
| 0   | [phase-0-bootstrap.md](./phase-0-bootstrap.md)       | Khởi tạo & Hạ tầng                       | 1–2 ngày   |     ☑      |
| 1   | [phase-1-ipc-backbone.md](./phase-1-ipc-backbone.md) | Xương sống IPC                           | 1–2 ngày   |     ☑      |
| 2   | [phase-2-data-layer.md](./phase-2-data-layer.md)     | Tầng dữ liệu                             | 2–3 ngày   |     ☑      |
| 3   | [phase-3-ui-shell.md](./phase-3-ui-shell.md)         | Bộ khung giao diện                       | 2–3 ngày   |     ☑      |
| 4   | [phase-4-core-crud.md](./phase-4-core-crud.md)       | Nghiệp vụ lõi (CRUD)                     | 5–7 ngày   |     ◐      |
| 5   | [phase-5-experience.md](./phase-5-experience.md)     | Hoàn thiện trải nghiệm                   | 3–5 ngày   |     ☐      |
| 6   | [phase-6-reliability.md](./phase-6-reliability.md)   | Độ tin cậy                               | 2–3 ngày   |     ☐      |
| 7   | [phase-7-packaging.md](./phase-7-packaging.md)       | Đóng gói & Phát hành                     | 2–3 ngày   |     ☐      |
| 8   | [phase-8-extensions.md](./phase-8-extensions.md)     | Mở rộng sau phát hành                    | —          |     ☐      |

> **Tiền đề phải xong trước Phase 0.** Không có domain đã chốt thì `001_init.sql` ở Phase 2 không viết được.
>
> Ước lượng cho **một người làm toàn thời gian**. Phase 4 dài hơn roadmap gốc (4–6 ngày) vì domain
> này có 4 thực thể chứ không phải 3, và `family_members` có ràng buộc nghiệp vụ riêng.

---

## Luật xuyên suốt — áp cho mọi phase

| Luật                                                                              | Nguồn                                      |
| --------------------------------------------------------------------------------- | ------------------------------------------ |
| **Không nhảy phase.** Hạ tầng xong trước tính năng                                | `docs/04-guidelines/phase-framework.md` §3 |
| Mỗi phase kết thúc bằng sản phẩm **chạy được**, không dở dang                     | `docs/04-guidelines/phase-framework.md` §3 |
| Docs cập nhật **trong cùng phase**, không để dồn                                  | `agent-rules.md` §7                        |
| "Xong" = chạy được + lint sạch + format sạch + test pass + đối chiếu checklist PR | `agent-rules.md` §4                        |
| **Xong một phase → chạy bước tự rà soát trước khi báo xong**                      | `agent-rules.md` §4.1                      |
| Không tự chốt "Quyết định còn bỏ ngỏ"                                             | `CLAUDE.md`, `agent-rules.md` §9           |
| Không thêm dependency mà không hỏi                                                | `recipes.md` Công thức 6                   |
| Không chạy lệnh `git` khi chưa được yêu cầu                                       | `docs/05-git/rules.md`                     |
| Tính năng mới làm trong **git worktree** riêng                                    | `docs/05-git/worktree.md`                  |

---

## Bản đồ domain (tóm tắt)

Chi tiết đầy đủ ở [00-domain-lock-in.md](./00-domain-lock-in.md).

```
zones (Giáo họ)
  │ 1
  │
  │ N
families (Gia đình / hộ)  ──┐
  │ 1                       │
  │                         │ N
  │ N                  family_members (Thành viên hộ)
persons (Giáo dân) ─────────┘  có from_date / to_date
  │
  └─ 5 cột ngày bí tích: baptism / first_communion / confirmation / marriage / death

settings (key-value, xoá cứng)
```

4 bảng nghiệp vụ + 1 bảng cấu hình. Không có `person_zone`, không có `family_zone`
— giáo họ của một người suy ra từ hộ hiện hành.
