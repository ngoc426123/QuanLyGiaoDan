<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<div class="d-flex flex-column mb-3">
    <h2 class="mb-1">Quản lý Giáo khu</h2>
    <div class="text-muted">Tổng cộng: <strong><?= esc($total_zones ?? 0) ?></strong> giáo khu</div>
</div>

<div class="row g-3">
    <!-- Left: Zone list -->
    <div class="col-lg-3">
    <div style="max-height: 70vh; overflow:auto;">
            <div class="mb-2 text-end">
                <button class="btn btn-primary btn-sm" type="button">
                    <i class="fas fa-plus me-1"></i>Thêm giáo khu mới
                </button>
            </div>
            <ul class="list-group" id="zoneList">
                <?php foreach (($zones ?? []) as $zone): $active = ($selected_id ?? 0) === ($zone['id'] ?? -1); ?>
                    <li class="list-group-item d-flex align-items-center <?= $active ? 'active text-white' : '' ?> position-relative">
                        <div class="me-2">
                            <div class="fw-semibold"><?= esc($zone['name']) ?></div>
                            <div class="small <?= $active ? 'text-white-50' : 'text-muted' ?>">Trưởng khu: <?= esc($zone['leader']) ?></div>
                        </div>
                        <span class="badge bg-secondary rounded-pill ms-auto"><?= esc($zone['families_count']) ?></span>
                        <a href="<?= site_url('zone?id=' . (int)$zone['id']) ?>" class="stretched-link" aria-label="Xem <?= esc($zone['name']) ?>"></a>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </div>

    <!-- Right: Detail -->
    <div class="col-lg-9">
        <div class="bg-white border rounded p-3">
            <?php if (!empty($selected_zone)): ?>
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h4 class="mb-1"><?= esc($selected_zone['name']) ?></h4>
                    <div class="text-muted small">
                        <i class="fas fa-user me-1"></i>Trưởng khu: <?= esc($selected_zone['leader']) ?>
                        <span class="mx-2">|</span>
                        <i class="fas fa-phone me-1"></i><?= esc($selected_zone['phone']) ?>
                        <span class="mx-2">|</span>
                        <i class="fas fa-location-dot me-1"></i><?= esc($selected_zone['address']) ?>
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-2"><i class="fas fa-edit me-1"></i>Chỉnh sửa</button>
                    <button class="btn btn-sm btn-primary"><i class="fas fa-plus me-1"></i>Thêm gia đình</button>
                </div>
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs" id="zoneTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="tab-overview" data-bs-toggle="tab" data-bs-target="#pane-overview" type="button" role="tab">Tổng quan</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="tab-families" data-bs-toggle="tab" data-bs-target="#pane-families" type="button" role="tab">Gia đình</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="tab-notes" data-bs-toggle="tab" data-bs-target="#pane-notes" type="button" role="tab">Ghi chú</button>
                </li>
            </ul>

            <div class="tab-content pt-3">
                <!-- Overview -->
                <div class="tab-pane fade show active" id="pane-overview" role="tabpanel">
                    <?php $ov = $details['overview'] ?? []; ?>
                    <div class="row g-3">
                        <div class="col-md-3 col-6">
                            <div class="p-3 border rounded text-center">
                                <div class="text-muted small">Gia đình</div>
                                <div class="fs-4 fw-bold"><?= (int)($ov['families_count'] ?? 0) ?></div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="p-3 border rounded text-center">
                                <div class="text-muted small">Giáo dân</div>
                                <div class="fs-4 fw-bold"><?= (int)($ov['members_count'] ?? 0) ?></div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="p-3 border rounded text-center">
                                <div class="text-muted small">Nam</div>
                                <div class="fs-5 fw-bold text-primary"><?= (int)($ov['male'] ?? 0) ?></div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="p-3 border rounded text-center">
                                <div class="text-muted small">Nữ</div>
                                <div class="fs-5 fw-bold text-pink"><?= (int)($ov['female'] ?? 0) ?></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Families -->
                <div class="tab-pane fade" id="pane-families" role="tabpanel">
                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead>
                                <tr>
                                    <th>Gia đình</th>
                                    <th>Chủ hộ</th>
                                    <th>Thành viên</th>
                                    <th>Điện thoại</th>
                                    <th>Địa chỉ</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach (($details['families'] ?? []) as $f): ?>
                                <tr>
                                    <td class="fw-semibold"><i class="fas fa-home text-info me-1"></i><?= esc($f['name']) ?></td>
                                    <td><?= esc($f['head']) ?></td>
                                    <td><?= (int)($f['members'] ?? 0) ?></td>
                                    <td><?= esc($f['phone']) ?></td>
                                    <td><?= esc($f['address']) ?></td>
                                    <td class="text-end"><button class="btn btn-sm btn-outline-secondary"><i class="fas fa-eye"></i></button></td>
                                </tr>
                                <?php endforeach; ?>
                                <?php if (empty($details['families'])): ?>
                                <tr><td colspan="6" class="text-center text-muted">Chưa có gia đình nào.</td></tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Notes -->
                <div class="tab-pane fade" id="pane-notes" role="tabpanel">
                    <div class="mb-2 text-muted small">Ghi chú</div>
                    <div class="border rounded p-3 bg-light"><?= esc($details['notes'] ?? 'Chưa có ghi chú.') ?></div>
                </div>
            </div>
            <?php else: ?>
            <div class="text-center text-muted py-5">Chưa chọn giáo khu.</div>
            <?php endif; ?>
        </div>
    </div>
 </div>

<?= $this->endSection() ?>