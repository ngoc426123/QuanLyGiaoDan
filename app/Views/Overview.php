<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<div class="overview-header mb-4">
    <h2 class="mb-1">Tổng quan hệ thống quản lý giáo dân</h2>
    <p class="text-muted">Thông tin tổng hợp về số lượng giáo dân, hộ gia đình, giáo khu, và các ghi chú chung.</p>
</div>
<div class="row g-4 mb-4 d-flex">
    <div class="col">
        <div class="dashboard-card bg-gradient-person">
            <div class="dashboard-card-row">
                <div class="card-icon-box"><span class="card-icon"><i class="fas fa-users"></i></span></div>
                <div class="card-info-box">
                    <div class="card-title">Tổng giáo dân</div>
                    <div class="card-value"><?= (int)($total_people ?? 0) ?></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col">
        <div class="dashboard-card bg-gradient-male">
            <div class="dashboard-card-row">
                <div class="card-icon-box"><span class="card-icon"><i class="fas fa-mars"></i></span></div>
                <div class="card-info-box">
                    <div class="card-title">Nam</div>
                    <div class="card-value"><?= (int)($male ?? 0) ?></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col">
        <div class="dashboard-card bg-gradient-female">
            <div class="dashboard-card-row">
                <div class="card-icon-box"><span class="card-icon"><i class="fas fa-venus"></i></span></div>
                <div class="card-info-box">
                    <div class="card-title">Nữ</div>
                    <div class="card-value"><?= (int)($female ?? 0) ?></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col">
        <div class="dashboard-card bg-gradient-family">
            <div class="dashboard-card-row">
                <div class="card-icon-box"><span class="card-icon"><i class="fas fa-home"></i></span></div>
                <div class="card-info-box">
                    <div class="card-title">Hộ gia đình</div>
                    <div class="card-value"><?= (int)($families ?? 0) ?></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col">
        <div class="dashboard-card bg-gradient-zone">
            <div class="dashboard-card-row">
                <div class="card-icon-box"><span class="card-icon"><i class="fas fa-church"></i></span></div>
                <div class="card-info-box">
                    <div class="card-title">Giáo khu</div>
                    <div class="card-value">5</div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-4 mb-4">
    <div class="col-md-6">
    <div class="border rounded p-2 bg-white w-100" style="margin:auto;">
            <h5 class="mb-2 text-center">Tỷ lệ Nam/Nữ</h5>
            <div class="d-flex justify-content-center">
                <canvas id="genderPie" width="180" height="350" style="display:block;max-height:350px;"></canvas>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="border rounded p-2 bg-white w-100" style="min-width:220px;">
            <h5 class="mb-2 text-center">Giáo dân theo giáo khu</h5>
            <div class="d-flex justify-content-center">
                <canvas id="zoneBar" height="120"></canvas>
            </div>
        </div>
    </div>
</div>

<div class="row g-4 mb-4">
    <div class="col-md-6">
        <div class="border rounded p-3 bg-white">
            <h5 class="mb-2">Top giáo khu</h5>
            <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Giáo khu 1
                    <span class="badge bg-primary rounded-pill">320 giáo dân</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Giáo khu 2
                    <span class="badge bg-primary rounded-pill">250 giáo dân</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Giáo khu 3
                    <span class="badge bg-primary rounded-pill">210 giáo dân</span>
                </li>
            </ul>
        </div>
    </div>
    <div class="col-md-6">
        <div class="border rounded p-3 bg-white">
            <h5 class="mb-2">Top hộ gia đình</h5>
            <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Gia đình Nguyễn Văn A
                    <span class="badge bg-success rounded-pill">12 thành viên</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Gia đình Trần Thị B
                    <span class="badge bg-success rounded-pill">10 thành viên</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Gia đình Phạm Văn C
                    <span class="badge bg-success rounded-pill">9 thành viên</span>
                </li>
            </ul>
        </div>
    </div>
</div>

<div class="overview-notes mb-4">
    <h5 class="mb-2">Ghi chú tổng quan</h5>
    <div class="border rounded p-3 bg-white text-muted">
        <?= esc($notes ?? '') ?>
    </div>
</div>

<div id="charts-data"
     data-gender-male="<?= (int)($male ?? 0) ?>"
     data-gender-female="<?= (int)($female ?? 0) ?>"
     data-zone-labels='["Giáo khu 1","Giáo khu 2","Giáo khu 3","Giáo khu 4","Giáo khu 5"]'
     data-zone-values='[320,250,210,180,240]'></div>
<?= $this->endSection() ?>