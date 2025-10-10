<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
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
                <tr>
                    <td colspan="9" class="text-center text-muted py-5">Không có dữ liệu hiển thị.</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <!-- Enhanced Pagination -->
    <div class="person-pagination d-flex justify-content-between align-items-center p-3 bg-light">
        <div class="pagination-info text-muted">
            Hiển thị <strong><?= (int)($display_from ?? 0) ?>-<?= (int)($display_to ?? 0) ?></strong> trong tổng số <strong><?= (int)($total_people ?? 0) ?></strong> giáo dân
        </div>
        <nav>
            <ul class="pagination mb-0">
                <li class="page-item disabled">
                    <a class="page-link" href="#" tabindex="-1">
                        <i class="fas fa-chevron-left"></i>
                    </a>
                </li>
                <li class="page-item active">
                    <a class="page-link" href="#">1</a>
                </li>
                <li class="page-item">
                    <a class="page-link" href="#">2</a>
                </li>
                <li class="page-item">
                    <a class="page-link" href="#">
                        <i class="fas fa-chevron-right"></i>
                    </a>
                </li>
            </ul>
        </nav>
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
            <form id="personCreateForm" novalidate>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-8">
                            <label class="form-label">Họ và tên <span class="text-danger">*</span></label>
                            <input type="text" name="full_name" class="form-control" placeholder="Nhập họ và tên" required>
                            <div class="invalid-feedback">Vui lòng nhập họ và tên.</div>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Giới tính</label>
                            <select class="form-select" name="gender">
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                            </select>
                        </div>

                                                <div class="col-md-6">
                                                    <label class="form-label">Ngày sinh (năm)</label>
                                                    <input type="text" name="birth_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4">
                                                    
                                                </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Số điện thoại</label>
                                        <input type="tel" name="phone" class="form-control" placeholder="VD: 0901234567">
                                    </div>

                                    

                                    <!-- Sacraments and other fields layout: two columns -->
                                    <div class="col-md-6">
                                        <div class="row g-3">
                                            <div class="col-12">
                                                <div class="row align-items-center">
                                                    <label class="col-5 col-form-label mb-0">Ngày rửa tội</label>
                                                    <div class="col-7">
                                                        <input type="text" name="baptism_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4">
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <div class="row align-items-center">
                                                    <label class="col-5 col-form-label mb-0">Ngày rước lễ</label>
                                                    <div class="col-7">
                                                        <input type="text" name="communion_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4">
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <div class="row align-items-center">
                                                    <label class="col-5 col-form-label mb-0">Ngày thêm sức</label>
                                                    <div class="col-7">
                                                        <input type="text" name="confirmation_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4">
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <div class="row align-items-center">
                                                    <label class="col-5 col-form-label mb-0">Ngày hôn phối</label>
                                                    <div class="col-7">
                                                        <input type="text" name="marriage_year" class="form-control yearpicker" placeholder="YYYY" autocomplete="off" inputmode="numeric" pattern="\\d{4}" maxlength="4">
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        </div>
                                    </div>

                                    <div class="col-md-6">
                                        <div class="row g-3">
                                            <div class="col-12">
                                                <select class="form-select" name="zone_id" aria-label="Giáo khu">
                                                    <option value="">-- Chọn giáo khu --</option>
                                                    <option value="1">Giáo khu 1</option>
                                                    <option value="2">Giáo khu 2</option>
                                                    <option value="3">Giáo khu 3</option>
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <textarea name="notes" rows="6" class="form-control" placeholder="Ghi chú thêm (nếu có)" aria-label="Ghi chú"></textarea>
                                            </div>
                                            <!-- Deceased controls: right-aligned under notes -->
                                            <div class="col-12 text-end">
                                                <div class="form-check form-switch d-inline-flex align-items-center gap-2 opacity-75">
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
<?= $this->endSection() ?>
