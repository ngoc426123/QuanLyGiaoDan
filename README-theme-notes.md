# UI Themes

Ứng dụng hiện có 2 giao diện:

- Vista (mặc định): public/css/vista.css (bật bằng `<body class="vista-theme">`)
- Windows 10: public/css/win10.css
- Material (MUI-style): public/css/material.css (bật bằng `<body class="material-theme">`)

Cách thử nhanh Windows 10:

1) Thêm dòng link CSS trong `app/Views/partials/header.php`:

    <link rel="stylesheet" href="<?= base_url('css/win10.css') ?>">

Material theme:

    <link rel="stylesheet" href="<?= base_url('css/material.css') ?>">
    <body class="material-theme">

2) Đổi class trên thẻ body (cùng file) thành `win10-theme`:

    <body class="win10-theme">

Lưu ý: Chỉ để 1 class theme trên `<body>` mỗi lần.

Trong tương lai có thể thêm phần “Tuỳ chỉnh” để bật/tắt theme từ giao diện và lưu lựa chọn người dùng.
