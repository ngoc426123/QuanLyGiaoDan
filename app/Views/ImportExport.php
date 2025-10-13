<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<div class="mb-4">
    <h2 class="mb-1">Quản lý Nhập/Xuất dữ liệu</h2>
    <p class="text-muted">Thực hiện nhập dữ liệu từ file Excel, CSV hoặc xuất dữ liệu ra các định dạng phổ biến để sao lưu hoặc chia sẻ.</p>
</div>
<div class="row g-4">
    <div class="col-md-6">
        <div class="border rounded p-4 bg-white h-100">
            <h5 class="mb-3"><i class="fas fa-file-export me-2"></i>Xuất dữ liệu</h5>
            <form id="formExport" method="get">
                <div class="mb-3">
                    <label for="exportType" class="form-label">Chọn loại dữ liệu cần xuất</label>
                    <select class="form-select" id="exportType">
                        <option value="person">Giáo dân</option>
                        <option value="family">Hộ gia đình</option>
                        <option value="zone">Giáo khu</option>
                        <option value="all">Tất cả (Persons, Families, Zones)</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="exportFormat" class="form-label">Định dạng xuất</label>
                    <select class="form-select" id="exportFormat">
                        <option value="csv">CSV</option>
                        <option value="xlsx">Excel (.xlsx)</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" id="btnExport"><i class="fas fa-download me-1"></i>Xuất dữ liệu</button>
            </form>
        </div>
    </div>
    <div class="col-md-6">
        <div class="border rounded p-4 bg-white h-100">
            <h5 class="mb-3"><i class="fas fa-file-import me-2"></i>Nhập dữ liệu</h5>
            <form id="formImport" method="post" enctype="multipart/form-data">
                <div class="mb-3">
                    <label for="importFile" class="form-label">Chọn file dữ liệu (Excel, CSV)</label>
                    <input type="file" class="form-control" id="importFile" accept=".csv,.xls,.xlsx">
                </div>
                <button type="submit" class="btn btn-success" id="btnImport"><i class="fas fa-upload me-1"></i>Nhập dữ liệu</button>
            </form>
        </div>
    </div>
</div>
<script>
document.addEventListener('DOMContentLoaded', function(){
    const formImport = document.getElementById('formImport');
    const importFile = document.getElementById('importFile');
    formImport.addEventListener('submit', async function(e){
        e.preventDefault();
        const file = importFile.files[0];
        if (!file) { alert('Vui lòng chọn file.'); return; }
        const target = prompt('Nhập loại dữ liệu để import (person, family, zone):', 'person') || 'person';
        const fd = new FormData();
        fd.append('file', file);
        fd.append('target', target);
        const btn = document.getElementById('btnImport');
        btn.disabled = true;
        try {
            const res = await fetch('/import-export/import', { method: 'POST', body: fd });
            const json = await res.json();
            if (json.ok) {
                alert('Upload thành công. ' + (json.imported>=0 ? ('Dòng: ' + json.imported) : 'File chấp nhận.'));
                window.location.reload();
            } else {
                alert('Lỗi: ' + (json.message || JSON.stringify(json)));
            }
        } catch (err) { alert('Network error: ' + err.message); }
        btn.disabled = false;
    });

    const formExport = document.getElementById('formExport');
    // default to all/xlsx
    document.getElementById('exportType').value = 'all';
    document.getElementById('exportFormat').value = 'xlsx';
    formExport.addEventListener('submit', function(e){
        e.preventDefault();
        const target = document.getElementById('exportType').value;
        const format = document.getElementById('exportFormat').value;
        const url = '/import-export/export?target=' + encodeURIComponent(target) + '&format=' + encodeURIComponent(format);
        // open in new tab to trigger download
        window.open(url, '_blank');
    });
});
</script>
<div class="mt-4">
    <div class="border rounded p-3 bg-white">
        <h5 class="mb-3"><i class="fas fa-clock-rotate-left me-2"></i>Lịch sử nhập/xuất gần đây</h5>
        <div class="table-responsive">
            <table class="table table-sm align-middle">
                <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Loại</th>
                        <th>Dữ liệu</th>
                        <th>Định dạng</th>
                        <th>Trạng thái</th>
                        <th>Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (!empty($history ?? [])): ?>
                        <?php foreach ($history as $h): ?>
                            <tr>
                                <td class="text-muted small"><?= esc($h['time']) ?></td>
                                <td>
                                    <?php if ($h['type'] === 'import'): ?>
                                        <span class="badge bg-success-subtle text-success"><i class="fas fa-upload me-1"></i>Nhập</span>
                                    <?php else: ?>
                                        <span class="badge bg-primary-subtle text-primary"><i class="fas fa-download me-1"></i>Xuất</span>
                                    <?php endif; ?>
                                </td>
                                <td><?= esc($h['target']) ?></td>
                                <td><?= esc(strtoupper($h['format'])) ?></td>
                                <td>
                                    <?php if (($h['status'] ?? '') === 'success'): ?>
                                        <span class="badge bg-success"><i class="fa-solid fa-check me-1"></i>Thành công</span>
                                    <?php elseif (($h['status'] ?? '') === 'processing'): ?>
                                        <span class="badge bg-warning text-dark"><i class="fa-solid fa-rotate me-1"></i>Đang xử lý</span>
                                    <?php else: ?>
                                        <span class="badge bg-danger"><i class="fa-solid fa-xmark me-1"></i>Thất bại</span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-muted small"><?= esc($h['note'] ?? '') ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr><td colspan="6" class="text-center text-muted">Chưa có lịch sử.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
    <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        <strong>Gợi ý giao diện:</strong> Trang này nên có 2 khối: <b>Nhập dữ liệu</b> (upload file, chọn loại dữ liệu) và <b>Xuất dữ liệu</b> (chọn loại, định dạng, nút tải về). Có thể bổ sung lịch sử nhập/xuất, trạng thái xử lý, hướng dẫn sử dụng, và các cảnh báo về dữ liệu.
    </div>
</div>
<?= $this->endSection() ?>
