<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<div class="family-header d-flex justify-content-between align-items-center mb-4">
    <div>
        <h2 class="mb-1">Quản lý Gia đình</h2>
        <p class="text-muted mb-0">Tổng cộng: <strong><?= $total_families ?></strong> gia đình</p>
    </div>
    <div>
        <button class="btn btn-primary">
            <i class="fas fa-plus me-2"></i>Thêm gia đình mới
        </button>
    </div>
</div>

<!-- Search and Filter Bar -->
<div class="family-filter-bar bg-light rounded p-3 mb-4">
    <form>
        <div class="row g-2 align-items-center">
            <div class="col-lg-4">
                <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                    <input type="text" class="form-control" placeholder="Tìm: tên gia đình, chủ hộ, địa chỉ...">
                </div>
            </div>
            <div class="col-lg-2 col-6">
                <select class="form-select">
                    <option value="">Tất cả giáo khu</option>
                    <option value="1">Giáo khu 1</option>
                    <option value="2">Giáo khu 2</option>
                    <option value="3">Giáo khu 3</option>
                </select>
            </div>
            <div class="col-lg-2 col-6">
                <select class="form-select">
                    <option value="">Số thành viên</option>
                    <option value="lte-2">≤ 2</option>
                    <option value="lte-4">≤ 4</option>
                    <option value="lte-6">≤ 6</option>
                    <option value="gte-7">≥ 7</option>
                </select>
            </div>
            <div class="col-lg-2 col-6">
                <input type="text" class="form-control" placeholder="Chủ hộ (VD: Nguyễn)">
            </div>
            <div class="col-lg-2 col-6">
                <input type="text" class="form-control" placeholder="SĐT (VD: 09)">
            </div>
            <div class="col-lg-2 col-6">
                <select class="form-select">
                    <option value="">Sắp xếp theo</option>
                    <option value="name">Tên gia đình</option>
                    <option value="members">Số thành viên</option>
                    <option value="zone">Giáo khu</option>
                </select>
            </div>
        </div>
    </form>
</div>

<!-- Family Cards Grid -->
<div class="family-grid">
    <div class="row g-4">
        <?php foreach ($families as $family): ?>
        <div class="col-xl-4 col-lg-6 col-md-6">
            <div class="family-card">
                <div class="family-card-header">
                    <div class="family-icon">
                        <img src="<?= base_url('images/icons/icon_home.png') ?>" alt="Gia đình" class="family-home-icon">
                    </div>
                    <div class="family-info">
                        <h5 class="family-name"><?= esc($family['name']) ?></h5>
                        <span class="family-zone badge"><?= esc($family['parish_zone']) ?></span>
                    </div>
                    <div class="family-actions">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#"><i class="fas fa-eye me-2"></i>Xem chi tiết</a></li>
                                <li><a class="dropdown-item" href="#"><i class="fas fa-users me-2"></i>Thành viên</a></li>
                                <li><a class="dropdown-item" href="#"><i class="fas fa-edit me-2"></i>Chỉnh sửa</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#"><i class="fas fa-trash me-2"></i>Xóa</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="family-card-body">
                    <div class="family-details">
                        <div class="detail-item">
                            <i class="fas fa-user text-primary"></i>
                            <span class="detail-label">Chủ hộ:</span>
                            <span class="detail-value"><?= esc($family['head_of_family']) ?></span>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-users text-success"></i>
                            <span class="detail-label">Thành viên:</span>
                            <span class="detail-value"><?= $family['members_count'] ?> người</span>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-phone text-info"></i>
                            <span class="detail-label">Điện thoại:</span>
                            <span class="detail-value"><?= esc($family['phone']) ?></span>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt text-warning"></i>
                            <span class="detail-label">Địa chỉ:</span>
                            <span class="detail-value"><?= esc($family['address']) ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>

<!-- Pagination -->
<div class="family-pagination d-flex justify-content-center mt-5">
    <nav>
        <ul class="pagination">
            <li class="page-item disabled">
                <a class="page-link" href="#" tabindex="-1">Trước</a>
            </li>
            <li class="page-item active">
                <a class="page-link" href="#">1</a>
            </li>
            <li class="page-item">
                <a class="page-link" href="#">2</a>
            </li>
            <li class="page-item">
                <a class="page-link" href="#">3</a>
            </li>
            <li class="page-item">
                <a class="page-link" href="#">Sau</a>
            </li>
        </ul>
    </nav>
</div>

<?= $this->endSection() ?>