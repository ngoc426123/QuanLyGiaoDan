<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<div class="mb-4">
    <h2 class="mb-1">Quản lý Nhập/Xuất dữ liệu</h2>
    <p class="text-muted">Thực hiện nhập dữ liệu từ file Excel, CSV hoặc xuất dữ liệu ra các định dạng phổ biến để sao lưu hoặc chia sẻ.</p>
</div>
<div class="row g-4">
    <div class="col-md-6">
        <div class="border rounded p-4 bg-white h-100">
            <h5 class="mb-3"><i class="fas fa-file-import me-2"></i>Nhập dữ liệu</h5>
            <form>
                <div class="mb-3">
                    <label for="importFile" class="form-label">Chọn file dữ liệu (Excel, CSV)</label>
                    <input type="file" class="form-control" id="importFile" accept=".csv,.xls,.xlsx">
                </div>
                <button type="submit" class="btn btn-success"><i class="fas fa-upload me-1"></i>Nhập dữ liệu</button>
            </form>
        </div>
    </div>
    <div class="col-md-6">
        <div class="border rounded p-4 bg-white h-100">
            <h5 class="mb-3"><i class="fas fa-file-export me-2"></i>Xuất dữ liệu</h5>
            <form>
                <div class="mb-3">
                    <label for="exportType" class="form-label">Chọn loại dữ liệu cần xuất</label>
                    <select class="form-select" id="exportType">
                        <option value="person">Giáo dân</option>
                        <option value="family">Hộ gia đình</option>
                        <option value="zone">Giáo khu</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="exportFormat" class="form-label">Định dạng xuất</label>
                    <select class="form-select" id="exportFormat">
                        <option value="csv">CSV</option>
                        <option value="xlsx">Excel (.xlsx)</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary"><i class="fas fa-download me-1"></i>Xuất dữ liệu</button>
            </form>
        </div>
    </div>
</div>
<div class="mt-4">
    <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        <strong>Gợi ý giao diện:</strong> Trang này nên có 2 khối: <b>Nhập dữ liệu</b> (upload file, chọn loại dữ liệu) và <b>Xuất dữ liệu</b> (chọn loại, định dạng, nút tải về). Có thể bổ sung lịch sử nhập/xuất, trạng thái xử lý, hướng dẫn sử dụng, và các cảnh báo về dữ liệu.
    </div>
</div>
<?= $this->endSection() ?>
