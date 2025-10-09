<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>User Management System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" type="image/png" href="/favicon.ico">
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Bootstrap JS -->
    <script src="/js/bootstrap.bundle.min.js"></script>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body style="background-color: #f6f8fa;">
    <div class="container-fluid">
        <section class="web-section bg-white rounded shadow-sm border border-1 border-light" style="margin-bottom:2rem;">
            <div class="section-header py-0">
                <div class="window-title d-flex align-items-center px-3">
                        <h1 class="fw-bold section-title mb-0">QUẢN LÝ GIÁO DÂN</h1>
                </div>
            </div>
            <section class="web-menu-section">
                <ul class="nav nav-pills justify-content-center bg-white menu-line web-menu mb-0">
                <li class="nav-item">
                    <a href="/" class="nav-link <?= (strpos($_SERVER['REQUEST_URI'] ?? '/', '/family') === false) ? 'active' : '' ?> d-flex flex-column align-items-center" style="color:#222; font-weight:300; <?= (strpos($_SERVER['REQUEST_URI'] ?? '/', '/family') === false) ? 'background:linear-gradient(180deg, #fff 0%, #e0f2ff 100%);' : '' ?>">
                        <img src="/images/icons/icon_person.png" alt="Giáo dân" class="mb-1" style="height:60px;">
                        <span class="fw-light">Giáo dân</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="/family" class="nav-link <?= (strpos($_SERVER['REQUEST_URI'] ?? '/', '/family') !== false) ? 'active' : '' ?> d-flex flex-column align-items-center" style="color:#222; font-weight:300; <?= (strpos($_SERVER['REQUEST_URI'] ?? '/', '/family') !== false) ? 'background:linear-gradient(180deg, #fff 0%, #e0f2ff 100%);' : '' ?>">
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
                <?php 
                $current_path = $_SERVER['REQUEST_URI'] ?? '/';
                if (strpos($current_path, '/family') !== false) {
                    include(APPPATH . 'Views/Family.php');
                } else {
                    include(APPPATH . 'Views/Person.php');
                }
                ?>
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
