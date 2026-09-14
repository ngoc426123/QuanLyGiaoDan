# Phase 5 — Bàn giao và bằng chứng kiểm chứng

Ngày: 2026-09-14. Phase 5 hoàn tất theo phạm vi đã chốt; chức năng in giấy được để lại sau cùng
theo yêu cầu người dùng.

## Kết quả

| Hạng mục             | Kết quả                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tìm kiếm             | FTS5 tìm giáo dân và hộ bằng tiếng Việt có hoặc không dấu; dữ liệu Unicode NFD được chuẩn hóa.                                                             |
| Thao tác bàn phím    | Có Command Palette, phím tắt toàn cục, cùng `↑` / `↓` / `Enter` / `Delete` cho bảng danh sách.                                                             |
| Menu và batch        | Menu chuột phải có xem, sửa, chuyển hộ và xóa; batch chuyển/xóa chạy một transaction, một broadcast.                                                       |
| Thùng rác            | Khôi phục an toàn người/hộ/giáo họ và xóa vĩnh viễn.                                                                                                       |
| CSV                  | Xuất UTF-8 BOM; nhập chạy parse, kiểm tra trùng và ghi SQLite trong Worker; Main chỉ giữ token, backup và phát tiến độ tối đa 10 lần/giây.                 |
| Cài đặt              | Có tên giáo xứ, giữ thùng rác, mở thư mục dữ liệu, danh sách phím tắt và phiên bản runtime.                                                                |
| Xóa dữ liệu kiểm thử | Nhập đúng `XÓA DỮ LIỆU`, backup trước, xóa dữ liệu nghiệp vụ trong một transaction và giữ lại cấu hình.                                                    |
| Accessibility        | Focus-visible, dialog native, toast status/alert, reduced motion; các màu text chính/muted/danger đạt tối thiểu 4.74:1 ở theme sáng và 6.49:1 ở theme tối. |

## Kiểm chứng

| Lệnh                    | Kết quả                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `npm run format:check`  | Pass                                                         |
| `npm run lint`          | Pass                                                         |
| `npm run typecheck`     | Pass                                                         |
| `npm run test:backend`  | 75 pass, 0 fail; gồm import 1.200 dòng và batch 100 giáo dân |
| `npm run test:frontend` | 26 pass, 0 fail                                              |
| `npm run build`         | Pass; bundle có `out/csv-import.worker.js`                   |

## Đã rà soát — phát hiện gì

- Sửa điều kiện FTS khi khôi phục bản ghi đã xóa để không phát sinh lỗi virtual table.
- Tách import khỏi Main Process; Worker có kết nối SQLite riêng, đồng thời build đóng gói worker.
- Chặn nhập CSV trùng dữ liệu hiện có trước khi ghi bất kỳ dòng nào.
- Sửa selector của Zustand để danh sách chọn không lặp render ở frontend test.
- Bọc bảng bằng `role="grid"` để điều hướng bàn phím có ngữ nghĩa accessibility hợp lệ.
- Xác nhận thao tác xóa dữ liệu chỉ xóa giáo họ, hộ, giáo dân và thành viên hộ; settings và backup còn nguyên.
