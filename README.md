# HỆ THỐNG QUẢN LÝ GIÁO DÂN

> Đây là hệ thống quản lý giáo dân của một giáo xứ, mục đích hệ thống này dùng cho việc dễ dàng tìm kiếm thông tin giáo dân, thêm, bớt, chỉnh sửa hoặc xuất các tài liệu liên quan, không sử dụng excel mà thay bằng quản lý hệ thống này giúp tiết kiệm tối đa thời gian truy xuất và làm việc

> Hệ thống này mới mẻ và được hỗ trợ bởi các lập trình viên có kinh nghiệm lâu năm, tuy thế nhưng vẫn sẽ có lỗi trong lúc sử dụng, đừng ngại mà hãy liên hệ với chúng tôi theom thông tin dưới cùng để nhận được sự hỗ trợ kịp thời.
## CÔNG NGHỆ

**Client:** Boostrap, JS thuần

**Server:** PHP > 8, Codeigniter 4



## CÀI ĐẶT

Đây là ứng dụng được viết trên nền codeigniter (web framwork), vì đây là ứng dụng web, không phải là ứng dụng window nên cần một số bước cài đặt bên dưới:

1. Sao chép hệ thống này về từ link github:

```bash
git clone https://github.com/ngoc426123/QuanLyGiaoDan.git
```

2. Tải và cài đặt xampp phiên bản nào có **PHP 8.0** trở lên, link download xampp bên dưới

```bash
https://www.apachefriends.org/download.html
```

3. Mở *Xampp Control Panel* bằng **quyền admin** sau khi đã cài đặt thành công (chuột phải vô icon xampp chọn *Run as administrator*), nhấn hai nút *Start* ở hai dòng *Apache* và *MySQL*. Nếu thành công thì hai chữ Apache và MySQL sẽ có nền màu xanh lá cây.

4. Nhấn vô nút *Admin* của dòng *MySQL* để vô trang quản lý database

5. Tại đây, menu bên phải, click nút new để tạo database mới , đặt tên bất kỳ cho database này tại ô *Database name* *(nhớ tên database này bạn nhé, không dùng khoảng cách, các ký tự đặc biệt, chỉ chữ và sớ)*, sau đó nhấn *Create*.

6. Hệ thống quản lý sẽ tự tạo và giúp bạn truy cập vào database bạn vừa tạo. Ở đây, ngay trên thanh menu nằm trang, hãy tìm menu *Import*. Tại vùng có tiêu đề là *File to import* bạn sẽ thấy input chọn file, hãy tìm đến file **Database.sql** trong source bạn vừa sao chép về ở bước 1 *(file này thường nằm đầu tiên ở trong source code bạn sao chép về từ github)*, khi chọn xong, kéo xuống dưới, hãy click vô nút *Import* để hệ thống nhập file database đã dựng sẵn.

7. Sau khi Import file thành công, bạn quay lại ứng dụng *Xampp Control Panel* đang chạy, cột bên trái sẽ thấy nút *Explorer*, nhấn vô để window tự tìm đến folder để chạy source.

8. Khi window mở được cửa sổ, hãy tìm folder *htdocs* và truy cập vô folder đó *(double click)*

9. Xóa hết các file trong folder *htdocs* đi, copy toàn bộ source code bạn sao chép về từ bước 1 vô đây.

10. Gần chạy được hệ thống rồi! Kế tiếp hãy truy cập source đã copy, đi theo theo đường dẫn bên dưới và mở file này lên.

```bash
app/config/Database.php
```

11. Hãy kiểm tra dòng bên dưới, đây là mảng các biến dùng để cấu hình kết nối tới database bạn tạo ở bước 5.

```bash
  public array $default
```

12. Kiểm tra các thông tin sau:

```bash
'hostname' => localhost
'username' => 'root'
'password' => ''
'database' => '' // bạn điền tên database bạn mới vừa tạo ra ở bước 5, đặt trong dấu ' nhé.
```

13. Quay trở lại *Xampp Control Panel*, nhấn hai nút *Stop* ở hai dòng *Apache* và *MySQL* để tắt server đi.

14. Vậy là xong, đây là các bước cài đặt cho Hệ Thống Quản Lý chạy bình thường, vui lòng không bỏ qua bước nào bên trên, nếu không làm được hay bị kẹt ở bước nào, đừng ngại liên hệ thông tin bên dưới để được hỗ trợ cài đặt miễn phí.
## CHẠY HỆ THỐNG

1. Ở trong source code bạn sao chép về từ github - bước 1 ở phần *CÀI ĐẶT*, bạn sẽ tìm thấy file này, *(file này thường nằm đầu tiên)*

```bash
QuanLyGiaoDan.bat
```

2. Bước này, bạn có thể tạo một shortcut của window ra ngoài màn hình desktop để tiện cho việc chạy hệ thống sau này - Click chuột phải vô file: *Sent to -> Desktop*

3. Nhấn vô file này hoặc shortcut bạn tạo ở desktop để hệ thống tự bắt đầu khởi động server và mở phần quản lý 

4. Đợi khoảng *10 giây* để hệ thống khởi động, tuy là không cần tới 10 giây đâu, nhưng chúng tôi set con số này để chắc chắn server chạy lên hoàn tất ở các máy cấu hình yếu.

5. Sau *10 giây*, hệ thống sẽ tự mở phần quản lý bằng trình duyệt đã được lập trình sẵn *(bằng trình duyệt chorme, nếu muốn thay bằng trình duyệt nào hãy liên hệ với thông tin bên dưới để được hỗ trợ)*.


## TẮT HỆ THỐNG
Về phần này, bạn đừng tắt *terminal - cái cửa sổ màu đen hoặc màu xanh mà xampp mở lên* mà hệ thống đã khởi động trước đây, tránh tình trạng lỗi server phải cài đặt lại, để tắt nó, hãy làm theo bước sau:

1. Tìm đến nơi cài đặt *Xampp (hãy nhờ ai biết kỹ thuật để giúp bạn tìm)*

2. Tìm đến file *xampp_stop.exe* theo đường dẫn bên dưới

```bash
xampp/xampp_stop.exe
```

3. "Chạy file này để tắt server tránh gây lỗi.
## 🚀 THÔNG TIN LIÊN HỆ
HOÀNG MINH NGỌC

Sđt: 037.399.6947

Email: minhngoc.ith@gmail.com

