<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<?php helper('lists'); ?>
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
<form method="get" action="<?= current_url() ?>" class="person-filter-bar bg-light rounded p-3 mb-4" id="personFilterForm">
    <div class="row g-2 align-items-center">
        <div class="col-md-6">
            <div class="input-group">
                <span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span>
                <input type="text" name="q" value="<?= esc($filters['q'] ?? '') ?>" class="form-control" placeholder="Tìm kiếm theo tên hoặc theo địa chỉ..." aria-label="Tìm kiếm">
            </div>
        </div>
        <div class="col-md-2">
            <select class="form-select" name="zone">
                <option value="">Tất cả giáo khu</option>
                <?php foreach (($zones ?? []) as $z): ?>
                    <option value="<?= (int)$z['ZID'] ?>" <?= (isset($filters['zone']) && (int)$filters['zone'] === (int)$z['ZID']) ? 'selected' : '' ?>><?= esc($z['name'] ?: ('#'.$z['ZID'])) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-md-2">
            <select class="form-select" name="family">
                <option value="">Tất cả gia đình</option>
                <?php foreach (($families ?? []) as $f): ?>
                    <option value="<?= (int)$f['FID'] ?>" <?= (isset($filters['family']) && (int)$filters['family'] === (int)$f['FID']) ? 'selected' : '' ?>><?= esc($f['name'] ?: ('#'.$f['FID'])) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-md-2">
            <select class="form-select" name="sort">
                <option value="">Sắp xếp theo</option>
                <option value="created_desc" <?= (($filters['sort'] ?? '')==='' || ($filters['sort'] ?? '')==='created_desc') ? 'selected' : '' ?>>Mới nhất</option>
                <option value="name" <?= (($filters['sort'] ?? '')==='name') ? 'selected' : '' ?>>Tên A - Z</option>
                <option value="name_desc" <?= (($filters['sort'] ?? '')==='name_desc') ? 'selected' : '' ?>>Tên Z - A</option>
                <option value="age" <?= (($filters['sort'] ?? '')==='age') ? 'selected' : '' ?>>Tuổi</option>
            </select>
        </div>
        <div class="col-md-12 col-lg-auto ms-auto">
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-filter me-1"></i>Lọc</button>
            <a href="<?= site_url('person') ?>" class="btn btn-outline-secondary">Xoá lọc</a>
        </div>
    </div>
</form>

<!-- Enhanced Table -->
<div class="person-table-container">
    <div class="table-responsive">
        <table class="table person-table mb-0">
            <thead>
                <tr>
                    <th class="text-center w-60"><input type="checkbox" class="form-check-input"></th>
                    <th>Giáo dân</th>
                    <th>Thông tin cá nhân</th>
                    <th>Gia đình & Giáo khu</th>
                    <th>Ngày rửa tội</th>
                    <th>Ngày rước lễ</th>
                    <th>Thêm sức</th>
                    <th>Hôn phối</th>
                    <th class="text-center w-120">Thao tác</th>
                </tr>
            </thead>
            <tbody>
                <?php if (!empty($peopleRows ?? [])): ?>
                    <?php foreach (($peopleRows ?? []) as $idx => $p): ?>
                        <tr data-row-id="<?= (int)($p['id'] ?? 0) ?>">
                            <td class="text-center"><input type="checkbox" class="form-check-input"></td>
                            <td>
                                <div class="person-info">
                                    <div class="person-avatar">
                                        <?php 
                                            $g = strtolower(trim((string)($p['gender'] ?? '')));
                                            // New convention: '0' => Nam, '1' => Nữ. Accept textual labels as fallback.
                                            $icon = ($g === '1' || $g === 'nữ' || $g === 'nu' || $g === 'female' || $g === 'f') 
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
                                        <li><a class="dropdown-item action-view-person" href="#" data-person-id="<?= (int)($p['id'] ?? 0) ?>"><i class="fa-regular fa-eye me-2"></i>Xem</a></li>
                                        <li><a class="dropdown-item action-edit-person" href="#" data-person-id="<?= (int)($p['id'] ?? 0) ?>"><i class="fa-regular fa-pen-to-square me-2"></i>Sửa</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item text-danger action-delete-person" href="#" data-person-id="<?= (int)($p['id'] ?? 0) ?>" data-person-name="<?= esc($p['name'] ?? '') ?>"><i class="fa-regular fa-trash-can me-2"></i>Xoá</a></li>
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
                        <!-- Row 1: Basic Info (left) + Links (right) -->
                        <div class="col-md-6">
                            <div class="modal-section-title">Thông tin cơ bản</div>
                            <div class="row g-3">
                                <div class="col-12">
                                    <div class="form-floating">
                                        <input type="text" name="holy_name" id="holyNameInput" class="form-control" placeholder="Tên thánh" list="holyNameOptions">
                                        <label for="holyNameInput">Tên thánh</label>
                                    </div>
                                </div>
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
                                            <option value="0">Nam</option>
                                            <option value="1">Nữ</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-regular fa-calendar"></i></span>
                                        <input type="text" name="birth_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Ngày sinh">
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-phone"></i></span>
                                        <input type="tel" name="phone" class="form-control" placeholder="Số điện thoại (VD: 0901234567)" aria-label="Số điện thoại">
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- Column: Liên kết (Row 1 right) -->
                        <div class="col-md-6">
                            <div class="modal-section-title">Liên kết</div>
                            <div class="row g-3">
                                <div class="col-12">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-church"></i></span>
                                        <select class="form-select" name="zone_id" aria-label="Giáo khu">
                                            <option value="">-- Chọn giáo khu --</option>
                                            <?php foreach (($zones ?? []) as $z): ?>
                                                <option value="<?= (int)$z['ZID'] ?>"><?= esc($z['name'] ?: ('#' . (int)$z['ZID'])) ?></option>
                                            <?php endforeach; ?>
                                        </select>
                                    </div>
                                </div>
                                <!-- Zone Relationship (visible only when zone selected) -->
                                <div class="col-12 d-none" id="zoneRelationshipWrap">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-user-tie"></i></span>
                                        <input type="text" class="form-control" name="zone_relationship" list="zoneRelationshipOptions" placeholder="Chức vụ trong giáo khu (VD: Trưởng khu, Phó khu, Thư ký, ...)">
                                    </div>
                                    <?php $zoneRoles = get_suggestion_list('zone_roles', ['Trưởng khu','Phó khu','Thư ký','Thủ quỹ','Ủy viên','Thành viên']); ?>
                                    <datalist id="zoneRelationshipOptions">
                                        <?php foreach ($zoneRoles as $zr): ?>
                                            <option value="<?= esc($zr) ?>"></option>
                                        <?php endforeach; ?>
                                    </datalist>
                                    <div class="form-text">Có thể để trống hoặc chọn từ gợi ý.</div>
                                </div>
                                <div class="col-12">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-house"></i></span>
                                        <select class="form-select" name="family_id" aria-label="Gia đình">
                                            <option value="">-- Chọn gia đình --</option>
                                            <?php foreach (($families ?? []) as $f): ?>
                                                <option value="<?= (int)$f['FID'] ?>"><?= esc($f['name'] ?: ('#' . (int)$f['FID'])) ?></option>
                                            <?php endforeach; ?>
                                        </select>
                                    </div>
                                </div>
                                <!-- Relationship (visible only when family selected) -->
                                <div class="col-12 d-none" id="relationshipWrap">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-people-roof"></i></span>
                                        <input type="text" class="form-control" name="relationship" list="relationshipOptions" placeholder="Quan hệ trong gia đình (VD: Chủ hộ, Vợ/chồng, Con, Cha, Mẹ, ...)">
                                    </div>
                                    <?php $relationships = get_suggestion_list('relationships', ['Chủ hộ','Vợ/chồng','Vợ','Chồng','Cha','Mẹ','Con','Ông','Bà','Anh','Chị','Em']); ?>
                                    <datalist id="relationshipOptions">
                                        <?php foreach ($relationships as $rel): ?>
                                            <option value="<?= esc($rel) ?>"></option>
                                        <?php endforeach; ?>
                                    </datalist>
                                    <div class="form-text">Bạn có thể chọn từ gợi ý hoặc tự nhập.</div>
                                </div>
                                <div class="col-12">
                                    <div class="form-floating">
                                        <textarea name="notes" id="notesInput" rows="6" class="form-control h-110" placeholder="Ghi chú thêm (nếu có)" aria-label="Ghi chú"></textarea>
                                        <label for="notesInput">Ghi chú</label>
                                    </div>
                                </div>
                                
                            </div>
                        </div>

                        <!-- Row 2: Các bí tích (full width) -->
                        <div class="col-12">
                            <div class="form-divider"></div>
                            <div class="modal-section-title">Các bí tích</div>
                            <div class="row g-3">
                                <div class="col-12 col-sm-6 col-lg-3">
                                    <label class="form-label mb-1">Rửa tội</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-water"></i></span>
                                        <input type="text" name="baptism_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Rửa tội (ngày/tháng/năm)">
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6 col-lg-3">
                                    <label class="form-label mb-1">Rước lễ</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-bread-slice"></i></span>
                                        <input type="text" name="communion_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Rước lễ (ngày/tháng/năm)">
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6 col-lg-3">
                                    <label class="form-label mb-1">Thêm sức</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-dove"></i></span>
                                        <input type="text" name="confirmation_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Thêm sức (ngày/tháng/năm)">
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6 col-lg-3">
                                    <label class="form-label mb-1">Hôn phối</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-ring"></i></span>
                                        <input type="text" name="marriage_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Hôn phối (ngày/tháng/năm)">
                                    </div>
                                </div>
                                <div class="form-divider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="row mt-3 align-items-center">
                        <div class="col-md-8">
                            <small class="text-muted"><span class="text-danger">*</span> Thông tin bắt buộc</small>
                            <div class="text-muted small mt-1">Thông tin sẽ được lưu và có thể chỉnh sửa sau.</div>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="deceased-block d-inline-flex flex-column align-items-end">
                                <div class="form-check form-switch d-inline-flex align-items-center gap-2 mb-2">
                                    <input class="form-check-input" type="checkbox" id="isDeceasedSwitch" name="is_deceased">
                                    <label class="form-check-label mb-0 small text-muted" for="isDeceasedSwitch">Đã qua đời</label>
                                </div>
                                <div class="d-none" id="deceasedYearWrap" style="min-width:160px;">
                                    <input type="text" name="deceased_year" class="form-control form-control-sm yearpicker text-start" placeholder="dd/mm/yyyy" autocomplete="off">
                                    <div class="invalid-feedback text-start">Năm mất phải lớn hơn hoặc bằng năm sinh.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="submit" class="btn btn-success"><i class="fas fa-save me-1"></i>Lưu giáo dân</button>
                </div>
            </form>
        </div>
    </div>
        </div>
<?php helper('lists'); $holyNames = get_suggestion_list('holy_names', ['Giuse','Maria','Phêrô']); ?>
<datalist id="holyNameOptions">
    <?php foreach ($holyNames as $hn): ?>
        <option value="<?= esc($hn) ?>"></option>
    <?php endforeach; ?>
</datalist>
<!-- Modal: Person Detail -->
<div class="modal fade" id="modalPersonDetail" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-regular fa-user me-2"></i>Thông tin giáo dân</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="personDetailBody" class="text-muted">Đang tải...</div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Đóng</button>
            </div>
        </div>
    </div>
    <!-- Modal: Confirm Delete -->
<div class="modal fade" id="modalConfirmDeletePerson" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title text-danger"><i class="fa-regular fa-trash-can me-2"></i>Xoá giáo dân</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Bạn có chắc muốn xoá giáo dân: <strong id="deletePersonName">—</strong>?</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
                <button type="button" class="btn btn-danger" id="btnConfirmDeletePerson" data-person-id="">Xoá</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal: Edit Person (mirrors Create) -->
<div class="modal fade" id="modalEditPerson" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-regular fa-pen-to-square me-2"></i>Chỉnh sửa giáo dân</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="personEditForm" method="post" action="#" novalidate>
                <?= csrf_field() ?>
                <div class="modal-body">
                    <div class="row g-4">
                        <div class="col-md-6">
                            <div class="modal-section-title">Thông tin cơ bản</div>
                            <div class="row g-3">
                                <div class="col-12">
                                    <div class="form-floating">
                                                    <input type="text" name="holy_name" id="editHolyNameInput" class="form-control" placeholder="Tên thánh" list="holyNameOptions">
                                        <label for="editHolyNameInput">Tên thánh</label>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="form-floating">
                                        <input type="text" name="full_name" id="editFullNameInput" class="form-control" placeholder="Họ và tên" required>
                                        <label for="editFullNameInput">Họ và tên <span class="text-danger">*</span></label>
                                        <div class="invalid-feedback">Vui lòng nhập họ và tên.</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fas fa-venus-mars"></i></span>
                                        <select class="form-select" name="gender" aria-label="Giới tính">
                                            <option value="0">Nam</option>
                                            <option value="1">Nữ</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-regular fa-calendar"></i></span>
                                        <input type="text" name="birth_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Ngày sinh">
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-phone"></i></span>
                                        <input type="tel" name="phone" class="form-control" placeholder="Số điện thoại (VD: 0901234567)" aria-label="Số điện thoại">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="modal-section-title">Liên kết</div>
                            <div class="row g-3">
                                <div class="col-12">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-church"></i></span>
                                        <select class="form-select" name="zone_id" aria-label="Giáo khu">
                                            <option value="">-- Chọn giáo khu --</option>
                                            <?php foreach (($zones ?? []) as $z): ?>
                                                <option value="<?= (int)$z['ZID'] ?>"><?= esc($z['name'] ?: ('#' . (int)$z['ZID'])) ?></option>
                                            <?php endforeach; ?>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-12 d-none" id="editZoneRelationshipWrap">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-user-tie"></i></span>
                                        <input type="text" class="form-control" name="zone_relationship" list="zoneRelationshipOptions" placeholder="Chức vụ trong giáo khu (VD: Trưởng khu, Phó khu, Thư ký, ...)">
                                    </div>
                                    <div class="form-text">Có thể để trống hoặc chọn từ gợi ý.</div>
                                </div>
                                <div class="col-12">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-house"></i></span>
                                        <select class="form-select" name="family_id" aria-label="Gia đình">
                                            <option value="">-- Chọn gia đình --</option>
                                            <?php foreach (($families ?? []) as $f): ?>
                                                <option value="<?= (int)$f['FID'] ?>"><?= esc($f['name'] ?: ('#' . (int)$f['FID'])) ?></option>
                                            <?php endforeach; ?>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-12 d-none" id="editRelationshipWrap">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-people-roof"></i></span>
                                        <input type="text" class="form-control" name="relationship" list="relationshipOptions" placeholder="Quan hệ trong gia đình (VD: Chủ hộ, Vợ/chồng, Con, Cha, Mẹ, ...)">
                                    </div>
                                    <div class="form-text">Bạn có thể chọn từ gợi ý hoặc tự nhập.</div>
                                </div>
                                <div class="col-12">
                                    <div class="form-floating">
                                        <textarea name="notes" rows="6" class="form-control h-110" placeholder="Ghi chú thêm (nếu có)" aria-label="Ghi chú"></textarea>
                                        <label>Ghi chú</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="form-divider"></div>
                            <div class="modal-section-title">Các bí tích</div>
                            <div class="row g-3">
                                <div class="col-12 col-sm-6 col-lg-3">
                                    <label class="form-label mb-1">Rửa tội</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-water"></i></span>
                                        <input type="text" name="baptism_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Rửa tội (ngày/tháng/năm)">
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6 col-lg-3">
                                    <label class="form-label mb-1">Rước lễ</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-bread-slice"></i></span>
                                        <input type="text" name="communion_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Rước lễ (ngày/tháng/năm)">
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6 col-lg-3">
                                    <label class="form-label mb-1">Thêm sức</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-dove"></i></span>
                                        <input type="text" name="confirmation_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Thêm sức (ngày/tháng/năm)">
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6 col-lg-3">
                                    <label class="form-label mb-1">Hôn phối</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-ring"></i></span>
                                        <input type="text" name="marriage_year" class="form-control yearpicker" placeholder="dd/mm/yyyy" autocomplete="off" aria-label="Hôn phối (ngày/tháng/năm)">
                                    </div>
                                </div>
                                <div class="form-divider"></div>
                                <div class="col-12 text-end deceased-block">
                                    <div class="form-check form-switch d-inline-flex align-items-center gap-2">
                                        <input class="form-check-input" type="checkbox" id="editIsDeceasedSwitch" name="is_deceased">
                                        <label class="form-check-label mb-0 small text-muted" for="editIsDeceasedSwitch">Đã qua đời</label>
                                    </div>
                                    <div class="mt-2 d-none maxw-200 ms-auto" id="editDeceasedYearWrap">
                                        <input type="text" name="deceased_year" class="form-control form-control-sm yearpicker text-end" placeholder="dd/mm/yyyy" autocomplete="off">
                                        <div class="invalid-feedback text-end">Năm mất phải lớn hơn hoặc bằng năm sinh.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <small class="text-muted d-block mt-3"><span class="text-danger">*</span> Thông tin bắt buộc</small>
                    <div class="text-muted small mt-1">Thông tin sẽ được lưu và có thể chỉnh sửa sau.</div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="submit" class="btn btn-success"><i class="fas fa-save me-1"></i>Lưu thay đổi</button>
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

    // Toggle zone relationship input visibility (Create + Edit)
    (function(){
        function setupToggle(formId, selectName, wrapId, inputName){
            var form = document.getElementById(formId);
            if (!form) return;
            var sel = form.querySelector('select[name="' + selectName + '"]');
            var wrap = document.getElementById(wrapId);
            var input = form.querySelector('input[name="' + inputName + '"]');
            if (!sel || !wrap || !input) return;
            function apply(){
                if (sel.value && String(sel.value).trim() !== ''){
                    wrap.classList.remove('d-none');
                } else {
                    wrap.classList.add('d-none');
                    input.value = '';
                }
            }
            sel.addEventListener('change', apply);
            // initial state
            apply();
        }
        // Create
        setupToggle('personCreateForm', 'zone_id', 'zoneRelationshipWrap', 'zone_relationship');
        // Edit
        setupToggle('personEditForm', 'zone_id', 'editZoneRelationshipWrap', 'zone_relationship');
    })();
</script>
<?= $this->endSection() ?>
