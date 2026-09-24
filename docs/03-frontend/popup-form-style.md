# Popup Form Style

Quy ước này được rút ra từ popup thêm/sửa Hôn phối. Dùng làm mẫu khi thiết kế các popup nghiệp vụ khác.

## Bố cục

- Chia form thành các `section` theo nhóm nghiệp vụ, không để tất cả trường trong một lưới phẳng.
- Mỗi section có tiêu đề ngắn, mô tả một dòng và số thứ tự nếu quy trình có nhiều bước.
- Các trường liên quan đặt trong cùng section; thông tin phụ hoặc trường phát sinh đặt trong panel con.
- Trên màn hình rộng dùng hai cột cho các trường cùng cấp; trên màn hình hẹp chuyển về một cột.
- Nút lưu đặt trong footer riêng ở cuối form, tách khỏi các trường nhập liệu.

## Tầng nền

- Nền popup dùng `--color-bg-base`.
- Section dùng `--color-bg-subtle`, viền `--color-border-default` và bo góc nhỏ.
- Panel con dùng lại nền base, có `border-left` màu `--color-accent` để thể hiện ngữ cảnh phụ.
- Không dùng đổ bóng hoặc màu nền quá mạnh cho từng trường; nền chỉ dùng để phân cấp thông tin.

## Khoảng cách và responsive

- Section có padding `var(--space-4)`, trên màn hình hẹp giảm về `var(--space-3)`.
- Khoảng cách giữa trường dùng `var(--space-3)`; giữa các section dùng khoảng cách nhỏ hơn để popup không quá dài.
- Grid dùng `repeat(2, minmax(0, 1fr))`; breakpoint `520px` chuyển thành một cột.
- Footer xếp dọc trên màn hình hẹp và nút lưu chiếm toàn bộ chiều rộng.

## Nội dung và tương tác

- Label phải mô tả rõ vai trò của trường, tránh lặp lại quá nhiều chữ trong label.
- Với lựa chọn phụ thuộc vào loại đối tượng, đặt một select chọn loại trước rồi mới hiển thị nhóm trường tương ứng.
- Danh sách dài dùng searchable dropdown với ô nhập ngay trong component, hỗ trợ tìm có dấu và không dấu.
- Searchable dropdown chỉ render 50 kết quả đầu; khi cuộn gần cuối thì nạp thêm 50 kết quả.
- Thông báo lỗi hiển thị ngay dưới trường liên quan; lỗi chung đặt trước footer.
