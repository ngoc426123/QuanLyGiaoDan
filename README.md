# HỆ THỐNG QUẢN LÝ GIÁO DÂN

> Đây là hệ thống quản lý giáo dân của một giáo xứ, mục đích hệ thống này dùng cho việc dễ dàng tìm kiếm thông tin giáo dân, thêm, bớt, chỉnh sửa hoặc xuất các tài liệu liên quan, không sử dụng excel mà thay bằng quản lý hệ thống này giúp tiết kiệm tối đa thời gian truy xuất và làm việc

> Hệ thống này mới mẻ và được hỗ trợ bởi các lập trình viên có kinh nghiệm lâu năm, tuy thế nhưng vẫn sẽ có lỗi trong lúc sử dụng, đừng ngại mà hãy liên hệ với chúng tôi theom thông tin dưới cùng để nhận được sự hỗ trợ kịp thời.
## CÔNG NGHỆ

**Client:** Boostrap, JS thuần

**Server:** PHP > 8, Codeigniter 4

**Database:** SQLite


## CÀI ĐẶT

Đây là ứng dụng được viết trên nền codeigniter (web framwork), vì đây là ứng dụng web, không phải là ứng dụng window nên cần một số bước cài đặt bên dưới:

1. Sao chép hệ thống này về từ link github:

```bash
git clone https://github.com/ngoc426123/QuanLyGiaoDan.git
```

2. Tải và cài đặt php phiên bản mới nhất trở lên, link download php bên dưới, hãy tải bản **Thread Safe** (tìm trong nội dung download)

```bash
https://windows.php.net/download/
```

3. Giải nén php vô một thư mục bất kỳ và khi nhớ đường dẫn thư mụa này.

4. Chỉnh hoặc thêm mới sửa nội dung PATH trong *Window Environment Variables* để cấu hình trỏ đến folder chứa php đã cài đặt (từ bước này trở đi nếu gặp khó khăn, xin liên hệ đội ngũ kỹ thuật để được hỗ trợ).

5. Sau đó mở terminal (Window PowerShell), chạy lệnh bên dướid để kiểm tra php đã hoạt động chưa.

6. Chỉnh sửa file php.init để mở các extension dùng cho hệ thống, danh sách các extension bên dưới đây:

```bash
intl
mbstring
sqlite3
```

7. Nếu cài đặt php khác với *C:/php* thì vui lòng kiểm tra dòng dưới đây, đảm bảo folder extension trỏ tới đúng folder *ext* trong php

```bash
extension_dir = "./"
```

## CHẠY HỆ THỐNG

1. Ở trong source code bạn sao chép về từ github - bước 1 ở phần *CÀI ĐẶT*, bạn sẽ tìm thấy file này, *(file này thường nằm đầu tiên)*

```bash
QuanLyGiaoDan.exe
```

2. Bước này, bạn có thể tạo một shortcut của window ra ngoài màn hình desktop để tiện cho việc chạy hệ thống sau này - Click chuột phải vô file: *Sent to -> Desktop*

3. Nhấn vô file này hoặc shortcut bạn tạo ở desktop để hệ thống tự bắt đầu khởi động server và mở phần quản lý 

4. Đợi khoảng *5 giây* để hệ thống khởi động, tuy là không cần tới 5 giây đâu, nhưng chúng tôi set con số này để chắc chắn server chạy lên hoàn tất ở các máy cấu hình yếu.

5. Sau *5 giây*, hệ thống sẽ tự mở phần quản lý bằng trình duyệt đã được lập trình sẵn *(bằng trình duyệt chorme, nếu muốn thay bằng trình duyệt nào hãy liên hệ với thông tin bên dưới để được hỗ trợ)*.


## TẮT HỆ THỐNG

1. Khi chạy server sẽ xuất hiện 2 terminal, chỉ cần tắt 2 bảng terminal đó đi là được, thường thường thì terminal sẽ có nền màu đen và chữ màu trắng.

3. Chạy file này để tắt server tránh gây lỗi.
## 🚀 THÔNG TIN LIÊN HỆ
HOÀNG MINH NGỌC

Sđt: 037.399.6947

Email: minhngoc.ith@gmail.com
