# Mô hình bảo mật

> Ứng dụng offline, một người dùng. Mối đe doạ không đến từ mạng mà từ **dữ liệu và code đi vào ứng dụng**.
> File này xác định **thứ tự ưu tiên** — và quan trọng không kém, **những gì KHÔNG cần làm**.

---

## 1. Xếp hạng bề mặt tấn công

Theo mức đáng đầu tư công sức, không theo mức "nghe đáng sợ":

| Hạng | Bề mặt | Quy định ở |
|---|---|---|
| 1 | Preload + IPC — cầu duy nhất giữa sandbox và vùng toàn quyền | [ipc-communication.md §7](./ipc-communication.md) |
| 2 | Thư viện npm trong `backend/dependencies` — chạy toàn quyền, không sandbox | Mục 3 |
| 3 | Cấu hình `BrowserWindow` | [overview.md §3](./overview.md) |
| 4 | Xử lý file và đường dẫn | Mục 4 |
| 5 | Câu truy vấn SQL | [coding-standards-backend.md §3](../04-guidelines/coding-standards-backend.md) |
| 6 | Mã hoá file DB — thường **không cần**, xem mục 5 | [storage-strategy.md §7](../02-backend-data/storage-strategy.md) |

Năm nguồn dữ liệu/code không đáng tin, xếp theo mức thực tế: **thư viện npm** > dữ liệu import (CSV/JSON) > nội dung người dùng dán vào > file đính kèm > người dùng nghịch DevTools.

---

## 2. Ba sự thật về file SQLite cục bộ

Quyết định những gì **không được** làm:

| Sự thật | Hệ quả — luật bắt buộc |
|---|---|
| File `app.db` nằm trong `%APPDATA%`, ai cũng mở được bằng DB Browser | **Cấm** lưu mật khẩu / token / API key trong DB. Dùng `safeStorage` (DPAPI / Keychain) |
| SQLite không có `GRANT`, không có role | Không thiết kế tính năng dựa trên giả định "chỉ admin sửa được bảng này" |
| Thư mục `backups/` là bản sao đầy đủ | Mọi luật áp cho `app.db` đều áp cho backup. Cảnh báo rõ trong UI khi người dùng gửi backup đi nhờ hỗ trợ |

---

## 3. Thư viện npm — rủi ro thực tế nhất

Một gói trong `frontend/` chạy trong sandbox Renderer. Cùng gói đó trong `backend/dependencies` chạy với quyền như `cmd.exe`. **Ngưỡng chấp nhận dependency ở Backend phải khắt khe hơn hẳn.**

| Luật |
|---|
| Commit `package-lock.json` của **cả hai** package |
| Ghim chính xác phiên bản `electron` và `better-sqlite3` |
| Tối thiểu hoá `backend/dependencies` |
| Chạy `npm audit` trước mỗi lần phát hành |
| Không thêm gói chỉ để dùng một hàm nhỏ |
| Xem xét kỹ gói có script `postinstall` |

---

## 4. File và đường dẫn

Áp dụng khi làm tính năng đính kèm (Phase 5+):

| Rủi ro | Cách chặn |
|---|---|
| Path traversal (`..\..\Windows\System32\x.dll`) | **Không bao giờ** dùng tên file người dùng đặt làm tên trên đĩa. Sinh tên bằng UUID, lưu tên gốc vào cột `file_name` |
| Ghi ra ngoài vùng cho phép | Sau khi ghép đường dẫn, kiểm tra kết quả **vẫn nằm trong** `userData` |
| Giới hạn 260 ký tự của Windows | Tên UUID luôn ngắn; phân thư mục theo `năm/tháng` |
| `shell.openPath` với `.exe`, `.bat` | Whitelist phần mở rộng; còn lại chỉ cho "Mở thư mục chứa file" |
| `openExternal` với `javascript:` / `file://` | Chỉ cho phép giao thức `https:` |

---

## 5. Mã hoá database

**Quyết định dự án Elecrusion: CÓ.** Dữ liệu được mã hóa bằng SQLCipher. Người quản lý nhập mật khẩu chính khi mở ứng dụng; mật khẩu không được lưu. Mỗi file backup xuất thủ công có mật khẩu riêng và chỉ mở được khi biết mật khẩu đó.

Chỉ cân nhắc SQLCipher khi ứng dụng lưu dữ liệu mà người dùng khác trên cùng máy tuyệt đối không được xem.

> **Quyết định một chiều.** Chuyển DB đã phát hành sang SQLCipher đòi hỏi giải mã–mã hoá lại dữ liệu của mọi người dùng, không có đường lui. Phải chốt **trước Phase 7**.

---

## 6. KHÔNG cần lo — đừng phức tạp hoá

| Không cần | Vì sao |
|---|---|
| Rate limiting cho IPC | Không có kẻ tấn công từ xa. Người dùng spam nút là bài toán UX (khoá nút) |
| Xác thực / phân quyền người dùng | Một người dùng, chạy dưới tài khoản OS — OS đã xác thực |
| Chống CSRF | Không có HTTP request, không có cookie |
| Hash mật khẩu | Ứng dụng không có mật khẩu |
| HTTPS / TLS | Không có giao tiếp mạng |
| Obfuscate mã nguồn | Không ngăn được ai thực sự muốn đọc, chỉ làm khó lúc debug |
| Chống người dùng tự sửa file DB | Máy và dữ liệu của họ. Chỉ cần app **không sập** khi gặp dữ liệu lạ |
| Sanitize dấu nháy trước khi lưu vào DB | Sai — làm hỏng tên `O'Brien`. Tham số hoá đã xử lý xong |

---

## 7. Checklist theo giai đoạn

**Phase 0–1**
- [ ] `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- [ ] Preload chỉ expose API whitelist, không expose `ipcRenderer` thô
- [ ] Chặn `will-navigate` và `setWindowOpenHandler`
- [ ] `app:openExternal` chỉ chấp nhận `https:`
- [ ] Từ chối mặc định mọi permission request
- [ ] `window.require` trong DevTools trả về `undefined`

**Phase 2**
- [ ] Mọi câu SQL tham số hoá; `ORDER BY` đối chiếu whitelist
- [ ] Mọi kênh IPC có schema validate ở Main
- [ ] Không có token/mật khẩu nào trong bảng dữ liệu
- [ ] Thử tiêu đề chứa dấu nháy đơn `'` và emoji — lưu và đọc lại nguyên vẹn

**Phase 5+**
- [ ] Tên file trên đĩa sinh bằng UUID
- [ ] Kiểm tra đường dẫn sau khi ghép vẫn trong `userData`
- [ ] Dữ liệu import đi qua đúng tầng validate như dữ liệu nhập tay
- [ ] Không `dangerouslySetInnerHTML` với nội dung người dùng chưa sanitize

**Phase 7**
- [x] CSP production nghiêm ngặt, không `unsafe-eval` / `unsafe-inline`
- [x] DevTools không mở được ở bản production
- [x] `npm audit` đã chạy và đã xem xét
- [x] `package-lock.json` của cả hai package đã commit
- [x] Đã chốt câu hỏi mã hoá DB ở mục 5

Kiểm chứng Phase 7 ngày 2026-09-21: E2E chạy trên bản `win-unpacked` và executable đã cài
đạt; cài đè giữ dữ liệu, còn gỡ cài xóa ứng dụng và registry nhưng giữ database người dùng.

---

## Tài liệu liên quan

- [Tổng quan kiến trúc](./overview.md) §3
- [Quy tắc giao tiếp IPC](./ipc-communication.md) §7
- [Quy chuẩn code — Backend](../04-guidelines/coding-standards-backend.md) §3 (SQL), §4 (file)
