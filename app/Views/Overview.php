<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<div class="card border-0 shadow-sm mb-4">
    <div class="card-body">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
                <h2 class="mb-1"><?= esc($church_name ?? church_name('Giáo xứ')) ?></h2>
                <?php if (!empty($church_addr ?? '')): ?>
                    <div class="text-muted maxw-720"><?= esc($church_addr) ?></div>
                <?php endif; ?>
            </div>
            <div class="text-muted small">
                Định dạng ngày: <?= esc(date_format_option()) ?>
            </div>
        </div>
    </div>
    </div>
<div class="row g-4 mb-4 d-flex">
    <div class="col">
        <div class="dashboard-card bg-gradient-person shadow-sm">
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
        <div class="dashboard-card bg-gradient-male shadow-sm">
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
        <div class="dashboard-card bg-gradient-female shadow-sm">
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
        <div class="dashboard-card bg-gradient-family shadow-sm">
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
        <div class="dashboard-card bg-gradient-zone shadow-sm">
            <div class="dashboard-card-row">
                <div class="card-icon-box"><span class="card-icon"><i class="fas fa-church"></i></span></div>
                <div class="card-info-box">
                    <div class="card-title">Giáo khu</div>
                    <div class="card-value"><?= (int)($zones ?? 0) ?></div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row g-4 mb-4">
    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 text-center pt-3 pb-0"><h5 class="mb-2">Tỷ lệ Nam/Nữ</h5></div>
            <div class="card-body d-flex align-items-center justify-content-center">
                <canvas id="genderPie" width="180" height="350" class="d-block maxh-350"></canvas>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 text-center pt-3 pb-0"><h5 class="mb-2">Giáo dân theo giáo khu</h5></div>
            <div class="card-body d-flex align-items-center justify-content-center">
                <canvas id="zoneBar" height="120"></canvas>
            </div>
        </div>
    </div>
</div>

<div class="row g-4 mb-4">
    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 pt-3 pb-0"><h5 class="mb-2">Top giáo khu</h5></div>
            <div class="card-body">
            <?php if (!empty($zone_labels ?? []) && !empty($zone_values ?? [])): ?>
                <ul class="list-group list-group-flush">
                    <?php foreach (($zone_labels ?? []) as $i => $label): $val = $zone_values[$i] ?? 0; ?>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <?= esc($label) ?>
                            <span class="badge bg-primary rounded-pill"><?= (int) $val ?> giáo dân</span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <div class="text-muted">Chưa có dữ liệu.</div>
            <?php endif; ?>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 pt-3 pb-0"><h5 class="mb-2">Top hộ gia đình</h5></div>
            <div class="card-body">
            <?php if (!empty($top_families ?? [])): ?>
                <ul class="list-group list-group-flush">
                    <?php foreach (($top_families ?? []) as $row): ?>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <?= esc($row['family_name'] ?: 'Gia đình') ?>
                            <span class="badge bg-success rounded-pill"><?= (int)($row['members'] ?? 0) ?> thành viên</span>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <div class="text-muted">Chưa có dữ liệu.</div>
            <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<div class="card border-0 shadow-sm mb-4">
    <div class="card-header bg-white border-0 pt-3 pb-0"><h5 class="mb-2">Ghi chú tổng quan</h5></div>
    <div class="card-body text-muted">
        <?= esc($notes ?? '') ?>
    </div>
    </div>

<?php
    $zl = json_encode($zone_labels ?? []);
    $zv = json_encode($zone_values ?? []);
?>
<div id="charts-data"
    data-gender-male="<?= (int)($male ?? 0) ?>"
    data-gender-female="<?= (int)($female ?? 0) ?>"
    data-zone-labels='<?= $zl ?>'
    data-zone-values='<?= $zv ?>'></div>
<?= $this->endSection() ?>