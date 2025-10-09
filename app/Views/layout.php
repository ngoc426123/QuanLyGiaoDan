<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>User Management System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" type="image/png" href="/favicon.ico">
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <!-- Bootstrap JS -->
    <script src="/js/bootstrap.bundle.min.js"></script>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body style="background-color: #f6f8fa;">
    <div class="text-center">
    <span class="fw-light pt-5 d-block" style="font-size:1.25rem;">Nhà thờ Phú Hòa</span>
    </div>
    <h1 class="fw-bold text-center mb-5" style="font-size:2rem; text-transform:uppercase; color:#0074b7;">HỆ THỐNG QUẢN LÝ GIÁO DÂN</h1>
    <div class="container-fluid">
        <section class="web-section bg-white rounded shadow-sm border border-1 border-light" style="margin-bottom:2rem;">
            <section class="web-menu-section">
                <ul class="nav nav-pills justify-content-center bg-white menu-line web-menu mb-0">
                <li class="nav-item">
                    <a href="#" class="nav-link active d-flex flex-column align-items-center" style="color:#222; font-weight:300; background:linear-gradient(180deg, #fff 0%, #e0f2ff 100%);">
                        <img src="/images/icons/icon_person.png" alt="Giáo dân" class="mb-1" style="height:60px;">
                        <span class="fw-light">Giáo dân</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link d-flex flex-column align-items-center" style="color:#222; font-weight:300;">
                        <img src="/images/icons/icon_family.png" alt="Gia đình" class="mb-1" style="height:60px;">
                        <span class="fw-light">Gia đình</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link d-flex flex-column align-items-center" style="color:#222; font-weight:300;">
                        <img src="/images/icons/icon_church_zone.png" alt="Giáo khu" class="mb-1" style="height:60px;">
                        <span class="fw-light">Giáo khu</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link d-flex flex-column align-items-center" style="color:#222; font-weight:300;">
                        <img src="/images/icons/icon_export.png" alt="Xuất bản" class="mb-1" style="height:60px;">
                        <span class="fw-light">Xuất bản</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link d-flex flex-column align-items-center" style="color:#222; font-weight:300;">
                        <img src="/images/icons/icon_setting.png" alt="Tuỳ chỉnh" class="mb-1" style="height:60px;">
                        <span class="fw-light">Tuỳ chỉnh</span>
                    </a>
                </li>
                </ul>
            </section>
            <section class="web-body">
                <?php include(APPPATH . 'Views/Person.php'); ?>
            </section>
        </section>
    </div>
    <script>
        // JS chuyển tab ribbon
        document.querySelectorAll('.office-ribbon-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.office-ribbon-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const tabName = tab.getAttribute('data-tab');
                document.querySelectorAll('.office-ribbon-group').forEach(g => {
                    g.style.display = g.getAttribute('data-group') === tabName ? 'block' : 'none';
                });
            });
        });
    </script>
</body>
</html>
