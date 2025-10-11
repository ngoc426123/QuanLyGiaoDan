<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<style>
/* Elevate row when its dropdown/dropup is open to avoid clipping */
.person-table tr.row-elevated { position: relative; z-index: 1100; }
</style>
<!-- Person Management Header -->
<div class="person-header d-flex justify-content-between align-items-center mb-4">
    <div>
        <h2 class="mb-1">Quản lý Giáo dân</h2>
    <p class="text-muted mb-0">Tổng cộng: <strong><?= esc($total_people ?? 0) ?></strong> giáo dân</p>
    </div>
    <div>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalCreatePerson">
            <i class="fas fa-plus me-2"></i>Thêm giáo dân mới
        </button>
    </div>
</div>

<!-- Filter and Search Bar -->
<div class="person-filter-bar bg-light rounded p-3 mb-4">
    <div class="row g-2 align-items-center">
        <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Tìm kiếm theo tên, SĐT...">
        </div>
        <div class="col-md-2">
            <select class="form-select">
                <option value="">Tất cả giáo khu</option>
                <option value="1">Giáo khu 1</option>
                <option value="2">Giáo khu 2</option>
                <option value="3">Giáo khu 3</option>
            </select>
        </div>
        <div class="col-md-2">
            <select class="form-select">
                <option value="">Tất cả gia đình</option>
                <option value="1">Gia đình 1</option>
                <option value="2">Gia đình 2</option>
                <option value="3">Gia đình 3</option>
            </select>
        </div>
        <div class="col-md-2">
            <select class="form-select">
                <option value="">Sắp xếp theo</option>
                <option value="name">Tên A-Z</option>
                <option value="age">Tuổi</option>
                <option value="baptism">Ngày rửa tội</option>
            </select>
        </div>
    </div>
</div>

<!-- Enhanced Table -->
<div class="person-table-container">
    <div class="table-responsive">
        <table class="table person-table mb-0">
            <thead>
                <tr>
                    <th class="text-center" style="width: 60px;"><input type="checkbox" class="form-check-input"></th>
                    <th>Giáo dân</th>
                    <th>Thông tin cá nhân</th>
                    <th>Gia đình & Giáo khu</th>
                    <th>Ngày rửa tội</th>
                    <th>Ngày rước lễ</th>
                    <th>Thêm sức</th>
                    <th>Hôn phối</th>
                    <th class="text-center" style="width: 120px;">Thao tác</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($peopleRows ?? [])): ?>
                    <?php foreach (($peopleRows ?? []) as $idx => $p): ?>
                        <tr>
                            <td class="text-center"><input type="checkbox" class="form-check-input"></td>
                            <td>
                                <div class="person-info">
                                    <div class="person-avatar">
                                        <?php 
                                            $g = strtolower(trim((string)($p['gender'] ?? '')));
                                            $icon = ($g === 'nữ' || $g === 'nu' || $g === 'female' || $g === 'f') 
                                                ? 'images/icons/icon_female.png' 
                                                : 'images/icons/icon_male.png';
                                        ?>
                                        <img class="person-avatar-img" src="<?= base_url($icon) ?>" alt="avatar">
                                    </div>
                                    <div class="person-details">
                                        <div class="person-name"><?= esc($p['name']) ?></div>
                                        <div class="person-meta text-muted small">
                                            <span class="me-2"><i class="fa-solid fa-venus-mars me-1"></i><?= esc($p['gender'] ?? '-') ?></span>
                                            <span><i class="fa-regular fa-calendar me-1"></i><?= esc($p['birth'] ?? '-') ?></span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="text-sm">
                                    <div><i class="fa-regular fa-id-card me-1 text-secondary"></i>Tuổi: <strong><?= (int)($p['age'] ?? 0) ?></strong></div>
                                    <div class="text-muted">Mã: #<?= (int)($p['id'] ?? 0) ?></div>
                                </div>
                            </td>
                            <td>
                                <div class="text-sm text-muted">
                                    Gia đình: <span class="text-dark"><?= esc($p['family'] ?? '—') ?></span><br>
                                    Giáo khu: <span class="text-dark"><?= esc($p['zones'] ?? '—') ?></span>
                                </div>
                            </td>
                            <td>
                                <?php if (!empty($p['baptismDate'])): ?>
                                    <span class="baptism-date"><i class="fa-solid fa-water me-1 text-primary"></i><span class="text-primary"><?= esc($p['baptismDate']) ?></span></span>
                                <?php else: ?>
                                    <span class="text-muted opacity-50" title="Chưa có dữ liệu"><i class="fa-regular fa-circle fa-xs"></i></span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if (!empty($p['communionDate'])): ?>
                                    <span class="communion-date"><i class="fa-solid fa-bread-slice me-1 text-info"></i><span class="text-info"><?= esc($p['communionDate']) ?></span></span>
                                <?php else: ?>
                                    <span class="text-muted opacity-50" title="Chưa có dữ liệu"><i class="fa-regular fa-circle fa-xs"></i></span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if (!empty($p['confirmationDate'])): ?>
                                    <span class="confirmation-date"><i class="fa-solid fa-dove me-1 text-purple"></i><span class="text-purple"><?= esc($p['confirmationDate']) ?></span></span>
                                <?php else: ?>
                                    <span class="text-muted opacity-50" title="Chưa có dữ liệu"><i class="fa-regular fa-circle fa-xs"></i></span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if (!empty($p['marriageDate'])): ?>
                                    <span class="marriage-date"><i class="fa-solid fa-ring me-1 text-danger"></i><span class="text-danger"><?= esc($p['marriageDate']) ?></span></span>
                                <?php else: ?>
                                    <span class="text-muted opacity-50" title="Chưa có dữ liệu"><i class="fa-regular fa-circle fa-xs"></i></span>
                                <?php endif; ?>
                            </td>
                            <td class="text-center">
                                <?php $isDropup = ($idx >= (count($peopleRows ?? []) - 2)); ?>
                                <div class="<?= $isDropup ? 'dropup' : 'dropdown' ?>">
                                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Thao tác
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item" href="#"><i class="fa-regular fa-eye me-2"></i>Xem</a></li>
                                        <li><a class="dropdown-item" href="#"><i class="fa-regular fa-pen-to-square me-2"></i>Sửa</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item text-danger" href="#"><i class="fa-regular fa-trash-can me-2"></i>Xoá</a></li>
                                    </ul>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="9" class="text-center text-muted py-5">Không có dữ liệu hiển thị.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    
    <!-- Enhanced Pagination -->
    <div class="person-pagination d-flex justify-content-between align-items-center p-3 bg-light">
        <div class="pagination-info text-muted">
            Hiển thị <strong><?= (int)($display_from ?? 0) ?>-<?= (int)($display_to ?? 0) ?></strong> trong tổng số <strong><?= (int)($total_people ?? 0) ?></strong> giáo dân
        </div>
        <?= isset($pager) ? $pager->links('people', 'bootstrap_full') : '' ?>
    </div>
</div>
<?php /* Keep modal inside the same content section */ ?>
<!-- Modal: Create Person -->
<div class="modal fade" id="modalCreatePerson" tabindex="-1" aria-labelledby="modalCreatePersonLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalCreatePersonLabel"><i class="fas fa-user-plus me-2"></i>Thêm giáo dân mới</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="personCreateForm" method="post" action="<?= site_url('person/create') ?>" novalidate>
                <?= csrf_field() ?>
                <div class="modal-body">
                    <div class="row g-4">
                        <!-- Column: Basic Info & Linking -->
                        <div class="col-md-6">
                            <div class="modal-section-title">Thông tin cơ bản</div>
                            <div class="row g-3">
                                <div class="col-12">
                                    <div class="form-floating">
                                        <input type="text" name="full_name" id="fullNameInput" class="form-control" placeholder="Họ và tên" required>
                                        <label for="fullNameInput">Họ và tên <span class="text-danger">*</span></label>
                                        <div class="invalid-feedback">Vui lòng nhập họ và tên.</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fas fa-venus-mars"></i></span>
                                        <select class="form-select" name="gender" aria-label="Giới tính">
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-regular fa-calendar"></i></span>
                                        <input type="text" name="birth_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4" aria-label="Năm sinh">
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-phone"></i></span>
                                        <input type="tel" name="phone" class="form-control" placeholder="Số điện thoại (VD: 0901234567)" aria-label="Số điện thoại">
                                    </div>
                                </div>
                            </div>

                            <div class="form-divider"></div>
                            <div class="modal-section-title">Liên kết</div>
                            <div class="row g-3">
                                <div class="col-12">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-church"></i></span>
                                        <select class="form-select" name="zone_id" aria-label="Giáo khu">
                                            <option value="">-- Chọn giáo khu --</option>
                                            <option value="1">Giáo khu 1</option>
                                            <option value="2">Giáo khu 2</option>
                                            <option value="3">Giáo khu 3</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-floating">
                                        <textarea name="notes" id="notesInput" rows="6" class="form-control" placeholder="Ghi chú thêm (nếu có)" aria-label="Ghi chú" style="height: 110px"></textarea>
                                        <label for="notesInput">Ghi chú</label>
                                    </div>
                                </div>
                                <div class="col-12 d-flex justify-content-between align-items-end">
                                    <div class="form-text text-muted">Thông tin sẽ được lưu và có thể chỉnh sửa sau.</div>
                                </div>
                            </div>
                        </div>

                        <!-- Column: Sacraments -->
                        <div class="col-md-6">
                            <div class="modal-section-title">Các bí tích</div>
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label mb-1">Rửa tội (năm)</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-water"></i></span>
                                        <input type="text" name="baptism_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4" aria-label="Rửa tội (năm)">
                                    </div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label mb-1">Rước lễ (năm)</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-bread-slice"></i></span>
                                        <input type="text" name="communion_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4" aria-label="Rước lễ (năm)">
                                    </div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label mb-1">Thêm sức (năm)</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-dove"></i></span>
                                        <input type="text" name="confirmation_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4" aria-label="Thêm sức (năm)">
                                    </div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label mb-1">Hôn phối (năm)</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-ring"></i></span>
                                        <input type="text" name="marriage_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4" aria-label="Hôn phối (năm)">
                                    </div>
                                </div>
                                <div class="form-divider"></div>
                                <!-- Deceased controls moved below marriage -->
                                <div class="col-12 text-end deceased-block">
                                    <div class="form-check form-switch d-inline-flex align-items-center gap-2">
                                        <input class="form-check-input" type="checkbox" id="isDeceasedSwitch" name="is_deceased">
                                        <label class="form-check-label mb-0 small text-muted" for="isDeceasedSwitch">Đã qua đời</label>
                                    </div>
                                    <div class="mt-2 d-none" id="deceasedYearWrap" style="max-width: 200px; margin-left: auto;">
                                        <input type="text" name="deceased_year" class="form-control form-control-sm yearpicker text-end" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4">
                                        <div class="invalid-feedback text-end">Năm mất phải lớn hơn hoặc bằng năm sinh.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <small class="text-muted d-block mt-3"><span class="text-danger">*</span> Thông tin bắt buộc</small>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="submit" class="btn btn-success"><i class="fas fa-save me-1"></i>Lưu giáo dân</button>
                </div>
            </form>
        </div>
    </div>
        </div>
<script>
    // Elevate table row z-index when any dropdown/dropup in that row is opened
    (function() {
        const container = document.querySelector('.person-table-container');
        if (!container) return;
        const targets = container.querySelectorAll('.dropdown, .dropup');
        targets.forEach(function(el) {
            el.addEventListener('show.bs.dropdown', function() {
                const tr = el.closest('tr');
                if (tr) tr.classList.add('row-elevated');
            });
            el.addEventListener('hide.bs.dropdown', function() {
                const tr = el.closest('tr');
                if (tr) tr.classList.remove('row-elevated');
            });
            el.addEventListener('hidden.bs.dropdown', function() {
                const tr = el.closest('tr');
                if (tr) tr.classList.remove('row-elevated');
            });
        });
    })();
</script>
<?= $this->endSection() ?>
