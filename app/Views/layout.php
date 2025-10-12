<?= $this->include('partials/header') ?>
    <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top" style="z-index: 1070;">
        <div class="container-fluid">
            <a class="navbar-brand d-flex align-items-center" href="<?= site_url('/') ?>">
                <img src="<?= base_url('images/icons/icon_church.png') ?>" alt="Logo" height="28" class="me-2">
                <span>QL Giáo Dân</span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#topNavbar" aria-controls="topNavbar" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="topNavbar">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item"><a class="nav-link <?= ($activeTab ?? '') === 'overview' ? 'active' : '' ?>" href="<?= site_url('overview') ?>">Tổng quan</a></li>
                    <li class="nav-item"><a class="nav-link <?= ($activeTab ?? '') === 'person' ? 'active' : '' ?>" href="<?= site_url('person') ?>">Giáo dân</a></li>
                    <li class="nav-item"><a class="nav-link <?= ($activeTab ?? '') === 'family' ? 'active' : '' ?>" href="<?= site_url('family') ?>">Gia đình</a></li>
                    <li class="nav-item"><a class="nav-link <?= ($activeTab ?? '') === 'zone' ? 'active' : '' ?>" href="<?= site_url('zone') ?>">Giáo khu</a></li>
                    <li class="nav-item"><a class="nav-link <?= ($activeTab ?? '') === 'import-export' ? 'active' : '' ?>" href="<?= site_url('import-export') ?>">Nhập/Xuất</a></li>
                </ul>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-secondary" id="btnThemeToggle" type="button" title="Chuyển nền sáng/tối">
                        <i class="fa-regular fa-moon"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>
    <div class="container-fluid">
        <section class="web-section bg-white rounded shadow-sm border border-1 border-light" style="margin-bottom:2rem;">
            <div class="section-header py-0">
                <div class="window-title d-flex flex-column align-items-center px-3 py-2">
                    <h1 class="fw-bold section-title mb-1 text-center">Quản lý Giáo Xứ - <?= esc(church_name('Giáo xứ')) ?></h1>
                </div>
            </div>
            <section class="web-menu-section d-none d-lg-block">
                <ul class="nav nav-pills justify-content-center bg-white menu-line web-menu mb-0">
                <li class="nav-item">
                    <a href="<?= site_url('overview') ?>" class="nav-link <?= ($activeTab === 'overview') ? 'active' : '' ?> d-flex flex-column align-items-center" style="color:#222; font-weight:300; <?= ($activeTab === 'overview') ? 'background:linear-gradient(180deg, #fff 0%, #e0f2ff 100%);' : '' ?>">
                        <img src="<?= base_url('images/icons/icon_church.png') ?>" alt="Tổng quan" class="mb-1" style="height:60px;">
                        <span class="fw-light">Tổng quan</span>
                    </a>
                </li>
                <li class="nav-item">
                    <?php $activeTab = $activeTab ?? 'person'; ?>
                    <a href="<?= site_url('person') ?>" class="nav-link <?= ($activeTab === 'person') ? 'active' : '' ?> d-flex flex-column align-items-center" style="color:#222; font-weight:300; <?= ($activeTab === 'person') ? 'background:linear-gradient(180deg, #fff 0%, #e0f2ff 100%);' : '' ?>">
                        <img src="<?= base_url('images/icons/icon_person.png') ?>" alt="Giáo dân" class="mb-1" style="height:60px;">
                        <span class="fw-light">Giáo dân</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="<?= site_url('family') ?>" class="nav-link <?= ($activeTab === 'family') ? 'active' : '' ?> d-flex flex-column align-items-center" style="color:#222; font-weight:300; <?= ($activeTab === 'family') ? 'background:linear-gradient(180deg, #fff 0%, #e0f2ff 100%);' : '' ?>">
                        <img src="<?= base_url('images/icons/icon_family.png') ?>" alt="Gia đình" class="mb-1" style="height:60px;">
                        <span class="fw-light">Gia đình</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="<?= site_url('zone') ?>" class="nav-link <?= ($activeTab === 'zone') ? 'active' : '' ?> d-flex flex-column align-items-center" style="color:#222; font-weight:300; <?= ($activeTab === 'zone') ? 'background:linear-gradient(180deg, #fff 0%, #e0f2ff 100%);' : '' ?>">
                        <img src="<?= base_url('images/icons/icon_church_zone.png') ?>" alt="Giáo khu" class="mb-1" style="height:60px;">
                        <span class="fw-light">Giáo khu</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="<?= site_url('import-export') ?>" class="nav-link <?= ($activeTab === 'import-export') ? 'active' : '' ?> d-flex flex-column align-items-center" style="color:#222; font-weight:300; <?= ($activeTab === 'import-export') ? 'background:linear-gradient(180deg, #fff 0%, #e0f2ff 100%);' : '' ?>">
                        <img src="<?= base_url('images/icons/icon_export.png') ?>" alt="Nhập/Xuất" class="mb-1" style="height:60px;">
                        <span class="fw-light">Nhập/Xuất</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link d-flex flex-column align-items-center" style="color:#222; font-weight:300;">
                        <img src="<?= base_url('images/icons/icon_setting.png') ?>" alt="Tuỳ chỉnh" class="mb-1" style="height:60px;">
                        <span class="fw-light">Tuỳ chỉnh</span>
                    </a>
                </li>
                </ul>
            </section>
            <section class="web-body">
                <?= $this->renderSection('content') ?>
            </section>
        </section>
    </div>
<?= $this->include('partials/footer') ?>
