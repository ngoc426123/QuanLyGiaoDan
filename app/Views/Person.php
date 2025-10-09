<!-- Person Management Header -->
<div class="person-header d-flex justify-content-between align-items-center mb-4">
    <div>
        <h2 class="mb-1">Quản lý Giáo dân</h2>
        <p class="text-muted mb-0">Tổng cộng: <strong>20</strong> giáo dân</p>
    </div>
    <div>
        <button class="btn btn-primary">
            <i class="fas fa-plus me-2"></i>Thêm giáo dân mới
        </button>
    </div>
</div>

<!-- Filter and Search Bar -->
<div class="person-filter-bar bg-light rounded p-3 mb-4">
    <div class="row g-3">
        <div class="col-md-4">
            <div class="input-group">
                <span class="input-group-text"><i class="fas fa-search"></i></span>
                <input type="text" class="form-control" placeholder="Tìm kiếm theo tên, email, điện thoại...">
            </div>
        </div>
        <div class="col-md-2">
            <select class="form-select">
                <option value="">Tất cả giới tính</option>
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
            </select>
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
                    <th class="text-center" style="width: 60px;">
                        <input type="checkbox" class="form-check-input">
                    </th>
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
                <?php 
                $people = [
                    ['name' => 'Nguyễn Văn An', 'gender' => 'Nam', 'birth' => '01/01/1990', 'age' => 34],
                    ['name' => 'Trần Thị Bình', 'gender' => 'Nữ', 'birth' => '15/03/1985', 'age' => 39],
                    ['name' => 'Lê Minh Cường', 'gender' => 'Nam', 'birth' => '22/08/1992', 'age' => 32],
                    ['name' => 'Phạm Thị Dung', 'gender' => 'Nữ', 'birth' => '10/12/1988', 'age' => 36],
                    ['name' => 'Hoàng Văn Em', 'gender' => 'Nam', 'birth' => '05/07/1995', 'age' => 29],
                ];
                
                for ($i = 0; $i < 15; $i++): 
                    $person = $people[$i % count($people)];
                    $personId = $i + 1;
                ?>
                <tr>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input">
                    </td>
                    <td>
                        <div class="person-info">
                            <div class="person-avatar">
                                <img src="/images/icons/icon_<?= $person['gender'] === 'Nam' ? 'male' : 'female' ?>.png" alt="<?= $person['gender'] ?>" class="person-avatar-img">
                            </div>
                            <div class="person-details">
                                <div class="person-name"><?= $person['name'] ?></div>
                                <div class="person-meta">
                                    <span class="badge badge-<?= $person['gender'] === 'Nam' ? 'primary' : 'pink' ?>"><?= $person['gender'] ?></span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="text-sm">
                            <div><i class="fas fa-birthday-cake text-warning me-1"></i><?= $person['birth'] ?></div>
                            <div><i class="fas fa-user-clock text-info me-1"></i><?= $person['age'] ?> tuổi</div>
                            <div><i class="fas fa-phone text-success me-1"></i>090123456<?= $personId ?></div>
                        </div>
                    </td>
                    <td>
                        <div class="text-sm">
                            <div><i class="fas fa-home text-info me-1"></i>Gia đình <?= ($personId % 3) + 1 ?></div>
                            <div><i class="fas fa-church text-purple me-1"></i>Giáo khu <?= ($personId % 3) + 1 ?></div>
                        </div>
                    </td>
                    <td>
                        <div class="text-sm">
                            <div class="baptism-date">
                                <i class="fas fa-cross text-warning me-1"></i>
                                <?= date('d/m/Y', strtotime($person['birth'] . ' +30 days')) ?>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="text-sm">
                                <?php if ($person['age'] >= 8): ?>
                                <div class="communion-date">
                                    <i class="fas fa-bread-slice text-primary me-1"></i>
                                    <?= date('d/m/Y', strtotime($person['birth'] . ' +8 years')) ?>
                                </div>
                                <?php else: ?>
                                <div class="text-muted">
                                    <i class="fas fa-bread-slice me-1"></i>
                                    Chưa đủ tuổi
                                </div>
                                <?php endif; ?>
                        </div>
                    </td>
                    <td>
                        <div class="text-sm">
                                <?php if ($person['age'] >= 16): ?>
                                <div class="confirmation-date">
                                    <i class="fas fa-dove text-success me-1"></i>
                                    <?= date('d/m/Y', strtotime($person['birth'] . ' +16 years')) ?>
                                </div>
                                <?php else: ?>
                                <div class="text-muted">
                                    <i class="fas fa-dove me-1"></i>
                                    Chưa đủ tuổi
                                </div>
                                <?php endif; ?>
                        </div>
                    </td>
                    <td>
                        <div class="text-sm">
                                <?php if ($person['age'] >= 25 && $personId % 3 == 0): ?>
                                <div class="marriage-date">
                                    <i class="fas fa-ring text-danger me-1"></i>
                                    <?= date('d/m/Y', strtotime($person['birth'] . ' +25 years')) ?>
                                </div>
                                <?php else: ?>
                                <div class="text-muted">
                                    <i class="fas fa-ring me-1"></i>
                                    Chưa kết hôn
                                </div>
                                <?php endif; ?>
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#"><i class="fas fa-eye me-2"></i>Xem chi tiết</a></li>
                                <li><a class="dropdown-item" href="#"><i class="fas fa-edit me-2"></i>Chỉnh sửa</a></li>
                                <li><a class="dropdown-item" href="#"><i class="fas fa-print me-2"></i>In thông tin</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#"><i class="fas fa-trash me-2"></i>Xóa</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>
                <?php endfor; ?>
            </tbody>
        </table>
    </div>
    
    <!-- Enhanced Pagination -->
    <div class="person-pagination d-flex justify-content-between align-items-center p-3 bg-light">
        <div class="pagination-info text-muted">
            Hiển thị <strong>1-15</strong> trong tổng số <strong>20</strong> giáo dân
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
