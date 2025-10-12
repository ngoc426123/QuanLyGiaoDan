<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<div class="family-header d-flex justify-content-between align-items-center mb-4">
    <div>
        <h2 class="mb-1">Quản lý Gia đình</h2>
        <p class="text-muted mb-0">Tổng cộng: <strong><?= (int)($total_families ?? 0) ?></strong> gia đình</p>
    </div>
    <div>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalCreateFamily">
            <i class="fas fa-plus me-2"></i>Thêm gia đình mới
        </button>
    </div>
</div>

<!-- Search and Filter Bar -->
<form method="get" action="<?= current_url() ?>" class="family-filter-bar bg-light rounded p-3 mb-4">
    <div class="row g-2 align-items-center">
        <div class="col-lg-5">
            <div class="input-group">
                <span class="input-group-text"><i class="fas fa-search"></i></span>
                <input type="text" name="q" value="<?= esc($filters['q'] ?? '') ?>" class="form-control" placeholder="Tìm: tên gia đình, địa chỉ...">
            </div>
        </div>
        <div class="col-lg-3 col-6">
            <select class="form-select" name="zone">
                <option value="">Tất cả giáo khu</option>
                <?php foreach (($zones ?? []) as $z): ?>
                    <option value="<?= (int)$z['ZID'] ?>" <?= ((int)($filters['zone'] ?? 0) === (int)$z['ZID']) ? 'selected' : '' ?>><?= esc($z['name'] ?: ('#'.$z['ZID'])) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-lg-2 col-6">
            <select class="form-select" name="sort">
                <option value="">Sắp xếp</option>
                <option value="name" <?= (($filters['sort'] ?? '')==='name') ? 'selected' : '' ?>>Tên A - Z</option>
                <option value="name_desc" <?= (($filters['sort'] ?? '')==='name_desc') ? 'selected' : '' ?>>Tên Z - A</option>
            </select>
        </div>
        <div class="col-lg-2 col-12 text-end">
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-filter me-1"></i>Lọc</button>
            <a href="<?= site_url('family') ?>" class="btn btn-outline-secondary">Xoá lọc</a>
        </div>
    </div>
    <div class="text-muted small mt-2">Gợi ý: hiển thị ~<?= (int)($per_page_suggestion ?? 12) ?> gia đình mỗi trang.</div>
</form>

<!-- Family Cards Grid -->
<div class="family-grid">
    <div class="row g-4">
        <?php if (!empty($families ?? [])): ?>
        <?php foreach ($families as $family): ?>
        <div class="col-xl-4 col-lg-6 col-md-6">
            <div class="family-card" data-family-id="<?= (int)($family['id'] ?? 0) ?>">
                <div class="family-card-header">
                    <div class="family-icon">
                        <img src="<?= base_url('images/icons/icon_home.png') ?>" alt="Gia đình" class="family-home-icon">
                    </div>
                    <div class="family-info">
                        <h5 class="family-name"><?= esc($family['name'] ?? '') ?></h5>
                        <?php if (!empty($family['parish_zone'])): ?>
                            <span class="family-zone badge"><?= esc($family['parish_zone']) ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="family-actions">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item action-view-family-members" href="#" data-family-id="<?= (int)($family['id'] ?? 0) ?>" data-family-name="<?= esc($family['name'] ?? '') ?>"><i class="fas fa-users me-2"></i>Thành viên</a></li>
                                <li><a class="dropdown-item action-edit-family" href="#" data-family-id="<?= (int)($family['id'] ?? 0) ?>" data-family-name="<?= esc($family['name'] ?? '') ?>"><i class="fas fa-edit me-2"></i>Chỉnh sửa</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger action-delete-family" href="#" data-family-id="<?= (int)($family['id'] ?? 0) ?>" data-family-name="<?= esc($family['name'] ?? '') ?>">
                                    <i class="fas fa-trash me-2"></i>Xoá gia đình
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="family-card-body">
                    <div class="family-details">
                        <div class="detail-item">
                            <i class="fas fa-user text-primary"></i>
                            <span class="detail-label">Chủ hộ:</span>
                            <span class="detail-value"><?= esc($family['head_of_family'] ?? '—') ?></span>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-users text-success"></i>
                            <span class="detail-label">Thành viên:</span>
                            <span class="detail-value family-members-count"><?= (int)($family['members_count'] ?? 0) ?> người</span>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-phone text-info"></i>
                            <span class="detail-label">Điện thoại:</span>
                            <span class="detail-value"><?= esc($family['phone'] ?? '—') ?></span>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt text-warning"></i>
                            <span class="detail-label">Địa chỉ:</span>
                            <span class="detail-value"><?= esc($family['address'] ?? '') ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
        <?php else: ?>
            <div class="col-12 text-center text-muted py-5">Không có dữ liệu hiển thị.</div>
        <?php endif; ?>
    </div>
</div>

<!-- Pagination -->
<div class="family-pagination d-flex justify-content-between align-items-center p-3 bg-light mt-4 rounded">
    <div class="pagination-info text-muted">
        Hiển thị <strong><?= (int)($display_from ?? 0) ?>-<?= (int)($display_to ?? 0) ?></strong> / <strong><?= (int)($total_families ?? 0) ?></strong> gia đình
    </div>
    <?= isset($pager) ? $pager->links('families', 'bootstrap_full') : '' ?>
    
</div>

<script>
// Submit create family via AJAX similar to Person (bind after DOM ready and when modal is shown)
(function(){
    function bindFamilyForm(){
        const form = document.getElementById('familyCreateForm');
        if (!form || form.dataset.boundSubmit === '1') return false;
        form.dataset.boundSubmit = '1';
        let submitting = false;
        form.addEventListener('submit', async function(e){
        e.preventDefault();
            if (submitting) return;
            submitting = true;
        form.classList.remove('was-validated');
        const name = form.querySelector('[name="name"]').value.trim();
        const address = form.querySelector('[name="address"]').value.trim();
        if (name === '' || address === '') {
            form.classList.add('was-validated');
            submitting = false;
            return;
        }
        const btn = form.querySelector('button[type="submit"]');
        const orig = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang lưu...';
        try {
            const resp = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }, credentials: 'same-origin' });
            const data = await resp.json();
            if (!resp.ok || !data.ok) {
                const msg = (data && data.errors) ? Object.values(data.errors).join('<br>') : 'Lưu thất bại.';
                const alertEl = document.createElement('div');
                alertEl.className = 'alert alert-danger alert-dismissible fade show m-3';
                alertEl.setAttribute('role', 'alert');
                alertEl.innerHTML = '<i class="fas fa-triangle-exclamation me-2"></i>' + msg +
                  '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                (document.querySelector('.web-body') || document.body).prepend(alertEl);
            } else {
                // Close modal
                const modalEl = document.getElementById('modalCreateFamily');
                if (modalEl && window.bootstrap) {
                    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modal.hide();
                }
                // Reset form
                form.reset();
                form.classList.remove('was-validated');

                // Prepend a new card to the grid (optional UX improvement)
                try {
                    const row = data.row || {};
                    const gridRow = document.querySelector('.family-grid .row');
                    if (gridRow) {
                        const col = document.createElement('div');
                        col.className = 'col-xl-4 col-lg-6 col-md-6';
                        col.innerHTML = `
                            <div class="family-card" data-family-id="${row.id || ''}">
                                <div class="family-card-header">
                                    <div class="family-icon">
                                        <img src="<?= base_url('images/icons/icon_home.png') ?>" alt="Gia đình" class="family-home-icon">
                                    </div>
                                    <div class="family-info">
                                        <h5 class="family-name">${row.name || ''}</h5>
                                        ${row.parish_zone ? (`<span class="family-zone badge">${row.parish_zone}</span>`) : ''}
                                    </div>
                                    <div class="family-actions">
                                        <div class="dropdown">
                                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                <i class="fas fa-ellipsis-v"></i>
                                            </button>
                                            <ul class="dropdown-menu">
                                                 <li><a class="dropdown-item action-view-family-members" href="#" data-family-id="${row.id || ''}" data-family-name="${(row.name || '').replace(/"/g,'&quot;')}"><i class="fas fa-users me-2"></i>Thành viên</a></li>
                                                <li><a class="dropdown-item action-edit-family" href="#" data-family-id="${row.id || ''}" data-family-name="${(row.name || '').replace(/"/g,'&quot;')}"><i class="fas fa-edit me-2"></i>Chỉnh sửa</a></li>
                                                <li><hr class="dropdown-divider"></li>
                                                <li><a class="dropdown-item text-danger action-delete-family" href="#" data-family-id="${row.id || ''}" data-family-name="${(row.name || '').replace(/"/g,'&quot;')}"><i class="fas fa-trash me-2"></i>Xoá gia đình</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div class="family-card-body">
                                    <div class="family-details">
                                        <div class="detail-item">
                                            <i class="fas fa-user text-primary"></i>
                                            <span class="detail-label">Chủ hộ:</span>
                                            <span class="detail-value">${row.head_of_family || '—'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="fas fa-users text-success"></i>
                                            <span class="detail-label">Thành viên:</span>
                                            <span class="detail-value family-members-count">${(row.members_count || 0)} người</span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="fas fa-phone text-info"></i>
                                            <span class="detail-label">Điện thoại:</span>
                                            <span class="detail-value">${row.phone || '—'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="fas fa-map-marker-alt text-warning"></i>
                                            <span class="detail-label">Địa chỉ:</span>
                                            <span class="detail-value">${row.address || ''}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        gridRow.prepend(col);
                    }
                } catch(_) {}

                // Success alert like Person
                const alertEl = document.createElement('div');
                alertEl.className = 'alert alert-success alert-dismissible fade show m-3';
                alertEl.setAttribute('role', 'alert');
                alertEl.innerHTML = '<i class="fas fa-check-circle me-2"></i>' + (data.message || 'Đã lưu gia đình.') +
                  '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                (document.querySelector('.web-body') || document.body).prepend(alertEl);

                // Auto-dismiss after 5s
                try {
                    setTimeout(function(){
                        if (!alertEl || !alertEl.parentNode) return;
                        if (window.bootstrap && bootstrap.Alert) {
                            const bsAlert = bootstrap.Alert.getOrCreateInstance(alertEl);
                            bsAlert.close();
                        } else {
                            alertEl.classList.remove('show');
                            setTimeout(function(){ if (alertEl && alertEl.parentNode) alertEl.parentNode.removeChild(alertEl); }, 300);
                        }
                    }, 5000);
                } catch(_) {}
            }
        } catch (err) {
            const msg = (err && err.errors) ? Object.values(err.errors).join('<br>') : 'Có lỗi xảy ra khi gửi yêu cầu.';
            const alertEl = document.createElement('div');
            alertEl.className = 'alert alert-danger alert-dismissible fade show m-3';
            alertEl.setAttribute('role', 'alert');
            alertEl.innerHTML = '<i class="fas fa-triangle-exclamation me-2"></i>' + msg +
              '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
            (document.querySelector('.web-body') || document.body).prepend(alertEl);
         } finally {
            btn.disabled = false; btn.innerHTML = orig;
             submitting = false;
        }
        });
        return true;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindFamilyForm, { once: true });
    } else {
        bindFamilyForm();
    }
    // Note: Avoid global capturing re-dispatch to prevent infinite submit loops
    // Also bind when the modal is shown for safety
    document.addEventListener('shown.bs.modal', function(ev){
        if (ev && ev.target && ev.target.id === 'modalCreateFamily') {
            bindFamilyForm();
        }
    });
})();
</script>

<?= $this->endSection() ?>

<?= $this->section('modals') ?>
<!-- Modal: Create Family (rendered outside .web-section to avoid clipping/overlay issues) -->
<div class="modal fade" id="modalCreateFamily" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-md modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fas fa-house-circle-check me-2"></i>Thêm gia đình mới</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="familyCreateForm" method="post" action="<?= site_url('family/create') ?>" novalidate>
                <?= csrf_field() ?>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-12">
                            <div class="form-floating">
                                <input type="text" class="form-control" name="name" id="familyNameInput" placeholder="Tên gia đình" required>
                                <label for="familyNameInput">Tên gia đình <span class="text-danger">*</span></label>
                                <div class="invalid-feedback">Vui lòng nhập tên gia đình.</div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="form-floating">
                                <input type="text" class="form-control" name="address" id="familyAddressInput" placeholder="Địa chỉ" required>
                                <label for="familyAddressInput">Địa chỉ <span class="text-danger">*</span></label>
                                <div class="invalid-feedback">Vui lòng nhập địa chỉ.</div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="input-group">
                                <span class="input-group-text"><i class="fa-solid fa-church"></i></span>
                                <select class="form-select" name="zone_id" aria-label="Giáo khu">
                                    <option value="">-- Chọn giáo khu --</option>
                                    <?php foreach (($zones ?? []) as $z): ?>
                                        <option value="<?= (int)$z['ZID'] ?>"><?= esc($z['name'] ?: ('#'.$z['ZID'])) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="form-floating">
                                <textarea class="form-control" placeholder="Ghi chú" id="familyNoteInput" name="note" style="height: 100px"></textarea>
                                <label for="familyNoteInput">Ghi chú</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="submit" class="btn btn-success"><i class="fas fa-save me-1"></i>Lưu</button>
                </div>
            </form>
        </div>
    </div>
</div>
<!-- Modal: Confirm Delete Family -->
<div class="modal fade" id="modalConfirmDeleteFamily" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title text-danger"><i class="fa-regular fa-trash-can me-2"></i>Xoá gia đình</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Bạn có chắc muốn xoá gia đình: <strong id="deleteFamilyName">—</strong>?</p>
                <div class="text-muted small">Hành động này không thể hoàn tác.</div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
                <button type="button" class="btn btn-danger" id="btnConfirmDeleteFamily" data-family-id="">Xoá</button>
            </div>
        </div>
    </div>
</div>
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<script>
// Delete family interactions
(function(){
    function mountHandlers(){
        // Open confirm modal from dropdown
        document.body.addEventListener('click', function(e){
            const a = e.target.closest && e.target.closest('a.action-delete-family');
            if (!a) return;
            e.preventDefault();
            const fid = a.getAttribute('data-family-id');
            const fname = a.getAttribute('data-family-name') || '';
            const nameEl = document.getElementById('deleteFamilyName');
            if (nameEl) nameEl.textContent = fname;
            const btn = document.getElementById('btnConfirmDeleteFamily');
            if (btn) btn.setAttribute('data-family-id', fid || '');
            const modalEl = document.getElementById('modalConfirmDeleteFamily');
            if (modalEl && window.bootstrap) { bootstrap.Modal.getOrCreateInstance(modalEl).show(); }
        }, { passive: false });

        // Confirm delete
        const btnDel = document.getElementById('btnConfirmDeleteFamily');
        if (btnDel && !btnDel.dataset.boundDel){
            btnDel.addEventListener('click', function(){
                const fid = this.getAttribute('data-family-id');
                if (!fid) return;
                const self = this;
                self.disabled = true;
                fetch('/family/' + encodeURIComponent(fid) + '/delete', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    credentials: 'same-origin'
                }).then(function(res){ return res.json().then(function(j){ return { ok: res.ok, json: j }; }); })
                .then(function(res){
                    if (!res.ok || !res.json || !res.json.ok){
                        const msg = (res.json && res.json.errors) ? (Object.values(res.json.errors)[0] || 'Xoá thất bại.') : 'Xoá thất bại.';
                        throw new Error(msg);
                    }
                    // Hide modal
                    const modalEl = document.getElementById('modalConfirmDeleteFamily');
                    if (modalEl && window.bootstrap){ bootstrap.Modal.getOrCreateInstance(modalEl).hide(); }
                    // Remove card from UI
                    const card = document.querySelector('.family-card[data-family-id="' + fid + '"]');
                    if (card){
                        const col = card.closest('.col-xl-4, .col-lg-6, .col-md-6') || card.parentElement;
                        if (col && col.parentNode){ col.parentNode.removeChild(col); }
                    }
                    // Show success alert
                    const alertEl = document.createElement('div');
                    alertEl.className = 'alert alert-success alert-dismissible fade show m-3';
                    alertEl.setAttribute('role', 'alert');
                    alertEl.innerHTML = '<i class="fas fa-check-circle me-2"></i>' + (res.json.message || 'Đã xoá gia đình.') +
                      '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                    (document.querySelector('.web-body') || document.body).prepend(alertEl);
                    setTimeout(function(){
                        try{
                            if (window.bootstrap && bootstrap.Alert){ bootstrap.Alert.getOrCreateInstance(alertEl).close(); }
                            else { alertEl.classList.remove('show'); setTimeout(function(){ alertEl.remove(); }, 300); }
                        } catch(_) {}
                    }, 5000);
                })
                .catch(function(err){
                    const alertEl = document.createElement('div');
                    alertEl.className = 'alert alert-danger alert-dismissible fade show m-3';
                    alertEl.setAttribute('role', 'alert');
                    alertEl.innerHTML = '<i class="fas fa-triangle-exclamation me-2"></i>' + (err && err.message || 'Xoá thất bại.') +
                      '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                    (document.querySelector('.web-body') || document.body).prepend(alertEl);
                })
                .finally(function(){ self.disabled = false; });
            });
            btnDel.dataset.boundDel = '1';
        }
    }

    if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', mountHandlers, { once: true });
    } else { mountHandlers(); }
})();
</script>
<?= $this->endSection() ?>

<?= $this->section('modals') ?>
<!-- Modal: Family Members -->
<div class="modal fade" id="modalFamilyMembers" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fas fa-users me-2"></i>Thành viên gia đình</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
                    <div class="modal-body">
                        <!-- Add member area -->
                        <div class="mb-3">
                            <?php helper('lists'); $relationships = get_suggestion_list('relationships', ['Chủ hộ','Vợ/chồng','Vợ','Chồng','Cha','Mẹ','Con','Ông','Bà','Anh','Chị','Em']); ?>
                            <div class="row g-2 align-items-center">
                                <div class="col-md-6">
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span>
                                        <input type="text" class="form-control" id="familyAddSearch" placeholder="Tìm giáo dân theo tên/điện thoại">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <input type="text" class="form-control" id="familyAddRelationship" placeholder="Quan hệ (VD: Con, Vợ/chồng…)" list="familyRelationshipOptions">
                                </div>
                                <div class="col-md-2 text-end">
                                    <button class="btn btn-primary w-100" id="btnFamilyAddMember" disabled><i class="fa-solid fa-user-plus me-1"></i>Thêm</button>
                                </div>
                            </div>
                            <div id="familyAddResults" class="list-group mt-2 d-none family-results-scroll"></div>
                            <datalist id="familyRelationshipOptions">
                                <?php foreach ($relationships as $rel): ?>
                                    <option value="<?= esc($rel) ?>"></option>
                                <?php endforeach; ?>
                            </datalist>
                        </div>
                        <div id="familyMembersBody" class="py-2 family-members-scroll">
                            <div class="text-muted">Đang tải...</div>
                        </div>
                    </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Đóng</button>
            </div>
        </div>
    </div>
    </div>
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<script>
// Family members: view and remove
(function(){
        function renderMembers(list, fid){
        var base = (window.BASE_URL || '/');
        if (!list || !list.length){
            return '<div class="text-muted">Không có thành viên.</div>';
        }
            var items = list.map(function(m){
            var g = (m.gender || '').toString().toLowerCase();
            var icon = (g === 'nữ' || g === 'nu' || g === 'female' || g === 'f') ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
            var rel = m.relationship ? ('<span class="badge bg-light text-dark ms-2">' + m.relationship + '</span>') : '';
            var phone = m.phone ? ('<span class="text-muted ms-3"><i class="fa-solid fa-phone me-1"></i>' + m.phone + '</span>') : '';
            var birth = m.birth ? ('<span class="text-muted ms-3"><i class="fa-regular fa-calendar me-1"></i>' + m.birth + '</span>') : '';
                        return '<div class="list-group-item d-flex align-items-center justify-content-between" data-person-id="' + m.pid + '">' +
                '<div class="d-flex align-items-center">' +
                    '<img src="' + base + icon + '" alt="avatar" style="width:32px;height:32px;object-fit:contain" class="me-2">' +
                    '<div>' +
                        '<div class="fw-semibold">' + (m.name || ('#' + m.pid)) + ' ' + rel + '</div>' +
                        '<div class="small">' + phone + birth + '</div>' +
                    '</div>' +
                '</div>' +
                '<div>' +
                                  '<button class="btn btn-sm btn-outline-secondary btn-remove-member action-remove-member" data-family-id="' + fid + '" data-person-id="' + m.pid + '"><i class="fa-solid fa-user-minus me-1"></i>Gỡ</button>' +
                '</div>' +
            '</div>';
            }).join('');
            return '<div class="list-group">' + items + '</div>';
    }

    function mountMembersHandlers(){
        // Open members modal
        document.body.addEventListener('click', function(e){
            var a = e.target.closest && e.target.closest('a.action-view-family-members');
            if (!a) return;
            e.preventDefault();
            var fid = a.getAttribute('data-family-id');
            var fname = a.getAttribute('data-family-name') || '';
            var titleEl = document.querySelector('#modalFamilyMembers .modal-title');
            if (titleEl){ titleEl.innerHTML = '<i class="fas fa-users me-2"></i>Thành viên: ' + fname; }
            var body = document.getElementById('familyMembersBody');
            if (body){ body.innerHTML = '<div class="text-muted">Đang tải...</div>'; }
            fetch('/family/' + encodeURIComponent(fid) + '/members', { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
                .then(function(res){ return res.json(); })
                .then(function(json){
                    if (!json || !json.ok) throw new Error('Load failed');
                    if (body){ body.innerHTML = renderMembers(json.members || [], fid); }
                    var modalEl = document.getElementById('modalFamilyMembers');
                    if (modalEl && window.bootstrap){ bootstrap.Modal.getOrCreateInstance(modalEl).show(); }
                })
                .catch(function(){ if (body){ body.innerHTML = '<div class="text-danger">Không tải được danh sách.</div>'; } });
        }, { passive: false });

        // Remove member action (event delegation)
        document.body.addEventListener('click', function(e){
            var btn = e.target.closest && e.target.closest('button.action-remove-member');
            if (!btn) return;
            e.preventDefault();
            var fid = btn.getAttribute('data-family-id');
            var pid = btn.getAttribute('data-person-id');
            if (!fid || !pid) return;
            btn.disabled = true;
            fetch('/family/' + encodeURIComponent(fid) + '/remove-member/' + encodeURIComponent(pid), {
                method: 'POST', headers: { 'Accept': 'application/json' }, credentials: 'same-origin'
            }).then(function(res){ return res.json().then(function(j){ return { ok: res.ok, json: j }; }); })
            .then(function(res){
                if (!res.ok || !res.json || !res.json.ok){ throw new Error((res.json && Object.values(res.json.errors || {})[0]) || 'Thất bại'); }
                // Remove the member row from the modal list
                var row = btn.closest('.list-group-item');
                if (row && row.parentNode){ row.parentNode.removeChild(row); }
                // Decrement members count on the card
                try {
                    var card = document.querySelector('.family-card[data-family-id="' + fid + '"]');
                    if (card){
                        var countEl = card.querySelector('.family-members-count');
                        if (countEl){
                            var txt = countEl.textContent || '0';
                            var m = (txt.match(/\d+/) || [0])[0];
                            var newVal = Math.max(0, (parseInt(m,10) || 0) - 1);
                            countEl.textContent = newVal + ' người';
                        }
                    }
                } catch(_) {}
                // Success toast/alert
                var alertEl = document.createElement('div');
                alertEl.className = 'alert alert-success alert-dismissible fade show m-3';
                alertEl.setAttribute('role', 'alert');
                alertEl.innerHTML = '<i class="fas fa-check-circle me-2"></i>' + (res.json.message || 'Đã gỡ thành viên khỏi gia đình.') +
                    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                (document.querySelector('.web-body') || document.body).prepend(alertEl);
                setTimeout(function(){ try { if (window.bootstrap){ bootstrap.Alert.getOrCreateInstance(alertEl).close(); } } catch(_){} }, 5000);
            })
            .catch(function(err){
                var alertEl = document.createElement('div');
                alertEl.className = 'alert alert-danger alert-dismissible fade show m-3';
                alertEl.setAttribute('role', 'alert');
                alertEl.innerHTML = '<i class="fas fa-triangle-exclamation me-2"></i>' + ((err && err.message) || 'Không thể gỡ thành viên.') +
                    '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                (document.querySelector('.web-body') || document.body).prepend(alertEl);
            })
            .finally(function(){ btn.disabled = false; });
        }, { passive: false });

                // Debounced search within add-member area
                var searchTimer = null;
                function doSearch(fid, q){
                    var box = document.getElementById('familyAddResults');
                    if (!box) return;
                    if (!q || q.trim() === '') { box.classList.add('d-none'); box.innerHTML=''; return; }
                    box.classList.remove('d-none'); box.innerHTML = '<div class="list-group-item text-muted">Đang tìm kiếm...</div>';
                    fetch('/family/' + encodeURIComponent(fid) + '/search-people?q=' + encodeURIComponent(q), { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
                        .then(function(res){ return res.json(); })
                        .then(function(json){
                                        if (!json || !json.ok){ box.innerHTML = '<div class="list-group-item text-danger">Lỗi tìm kiếm.</div>'; return; }
                            var results = json.results || [];
                            if (!results.length){ box.innerHTML = '<div class="list-group-item text-muted">Không tìm thấy.</div>'; return; }
                            box.innerHTML = results.map(function(p){
                                var g = (p.gender || '').toString().toLowerCase();
                                var icon = (g === 'nữ' || g === 'nu' || g === 'female' || g === 'f') ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
                                var base = (window.BASE_URL || '/');
                                            return '<a href="#" class="list-group-item list-group-item-action family-add-result" data-pid="' + p.pid + '">' +
                                    '<img src="' + base + icon + '" style="width:24px;height:24px;object-fit:contain" class="me-2"/>' +
                                                '<span class="fw-semibold">' + (p.name || ('#' + p.pid)) + '</span>' +
                                '</a>';
                            }).join('');
                        })
                        .catch(function(){ box.innerHTML = '<div class="list-group-item text-danger">Lỗi tìm kiếm.</div>'; });
                }

                // Track selected person for add
                var selectedPid = null;
                document.body.addEventListener('input', function(e){
                <!-- Modal: Edit Family -->
                <div class="modal fade" id="modalEditFamily" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-md modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title"><i class="fas fa-pen-to-square me-2"></i>Chỉnh sửa gia đình</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <form id="familyEditForm" method="post" action="#" novalidate>
                                <?= csrf_field() ?>
                                <input type="hidden" name="fid" id="editFamilyId" value="">
                                <div class="modal-body">
                                    <div class="row g-3">
                                        <div class="col-12">
                                            <div class="form-floating">
                                                <input type="text" class="form-control" name="name" id="editFamilyName" placeholder="Tên gia đình" required>
                                                <label for="editFamilyName">Tên gia đình <span class="text-danger">*</span></label>
                                                <div class="invalid-feedback">Vui lòng nhập tên gia đình.</div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="form-floating">
                                                <input type="text" class="form-control" name="address" id="editFamilyAddress" placeholder="Địa chỉ" required>
                                                <label for="editFamilyAddress">Địa chỉ <span class="text-danger">*</span></label>
                                                <div class="invalid-feedback">Vui lòng nhập địa chỉ.</div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="input-group">
                                                <span class="input-group-text"><i class="fa-solid fa-church"></i></span>
                                                <select class="form-select" name="zone_id" id="editFamilyZone">
                                                    <option value="">-- Chọn giáo khu --</option>
                                                    <?php foreach (($zones ?? []) as $z): ?>
                                                        <option value="<?= (int)$z['ZID'] ?>"><?= esc($z['name'] ?: ('#'.$z['ZID'])) ?></option>
                                                    <?php endforeach; ?>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="form-floating">
                                                <textarea class="form-control" placeholder="Ghi chú" id="editFamilyNote" name="note" style="height: 100px"></textarea>
                                                <label for="editFamilyNote">Ghi chú</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
                                    <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>Lưu thay đổi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                    if (!e.target || e.target.id !== 'familyAddSearch') return;
                    var fid = (document.querySelector('#modalFamilyMembers .modal-title').textContent || '').match(/: \s*(.*)$/);
                    var currentFid = document.querySelector('a.action-view-family-members[data-family-name="' + (fid ? fid[1] : '') + '"]');
                });
                // Use shown event to wire inputs for correct family
                document.addEventListener('shown.bs.modal', function(ev){
                    if (!ev || !ev.target || ev.target.id !== 'modalFamilyMembers') return;
                    var titleEl = ev.target.querySelector('.modal-title');
                    var nameInTitle = titleEl ? titleEl.textContent : '';
                    // Extract fid from a hidden store: easier approach - store on modal dataset when opening
                });

                // Enhance: when opening modal, store current fid into modal dataset
                document.body.addEventListener('click', function(e){
                    var a = e.target.closest && e.target.closest('a.action-view-family-members');
                    if (!a) return;
                    var modalEl = document.getElementById('modalFamilyMembers');
                    if (modalEl){ modalEl.dataset.familyId = a.getAttribute('data-family-id') || ''; }
                    // reset add UI
                    var search = document.getElementById('familyAddSearch'); if (search){ search.value=''; }
                    var rel = document.getElementById('familyAddRelationship'); if (rel){ rel.value=''; }
                    var box = document.getElementById('familyAddResults'); if (box){ box.classList.add('d-none'); box.innerHTML=''; }
                    var btnAdd = document.getElementById('btnFamilyAddMember'); if (btnAdd){ btnAdd.disabled = true; btnAdd.removeAttribute('data-pid'); }
                }, { passive: true });

                // Live search debounce
                document.body.addEventListener('input', function(e){
                    if (!e.target || e.target.id !== 'familyAddSearch') return;
                    var modalEl = document.getElementById('modalFamilyMembers');
                    var fid = modalEl ? modalEl.dataset.familyId : '';
                    var q = e.target.value;
                    selectedPid = null;
                    var btnAdd = document.getElementById('btnFamilyAddMember'); if (btnAdd){ btnAdd.disabled = true; btnAdd.removeAttribute('data-pid'); }
                    if (searchTimer) clearTimeout(searchTimer);
                    searchTimer = setTimeout(function(){ doSearch(fid, q); }, 300);
                });

                // Select from results
                document.body.addEventListener('click', function(e){
                    var a = e.target.closest && e.target.closest('a.family-add-result');
                    if (!a) return;
                    e.preventDefault();
                    selectedPid = a.getAttribute('data-pid');
                    var btnAdd = document.getElementById('btnFamilyAddMember');
                    if (btnAdd){ btnAdd.disabled = !selectedPid; if (selectedPid) btnAdd.setAttribute('data-pid', selectedPid); }
                    // highlight selection
                    var box = document.getElementById('familyAddResults');
                    if (box){ Array.prototype.forEach.call(box.querySelectorAll('.family-add-result'), function(el){ el.classList.remove('active'); }); a.classList.add('active'); }
                }, { passive: false });

                // Add member click
                document.body.addEventListener('click', function(e){
                    var btn = e.target.closest && e.target.closest('#btnFamilyAddMember');
                    if (!btn) return;
                    e.preventDefault();
                    var modalEl = document.getElementById('modalFamilyMembers');
                    var fid = modalEl ? modalEl.dataset.familyId : '';
                    var pid = btn.getAttribute('data-pid');
                    var relationship = (document.getElementById('familyAddRelationship') && document.getElementById('familyAddRelationship').value) || '';
                    if (!fid || !pid) return;
                    btn.disabled = true;
                    fetch('/family/' + encodeURIComponent(fid) + '/add-member', {
                        method: 'POST',
                        headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
                        credentials: 'same-origin',
                        body: 'pid=' + encodeURIComponent(pid) + '&relationship=' + encodeURIComponent(relationship)
                    }).then(function(res){ return res.json().then(function(j){ return { ok: res.ok, json: j }; }); })
                    .then(function(res){
                        if (!res.ok || !res.json || !res.json.ok){ throw new Error((res.json && Object.values(res.json.errors || {})[0]) || 'Không thể thêm'); }
                        // insert new member row at top of list
                                var body = document.getElementById('familyMembersBody');
                                if (body){
                                    var current = body.querySelector('.list-group');
                                    var html = renderMembers([res.json.member], fid);
                                    if (current){
                                        var temp = document.createElement('div');
                                        temp.innerHTML = html;
                                        var list = temp.querySelector('.list-group');
                                        if (list){
                                            var nodes = Array.prototype.slice.call(list.children);
                                            for (var i = nodes.length - 1; i >= 0; i--) {
                                                current.insertBefore(nodes[i], current.firstChild);
                                            }
                                        }
                                    } else {
                                        body.innerHTML = html;
                                    }
                                }
                        // clear search UI
                        var search = document.getElementById('familyAddSearch'); if (search){ search.value=''; }
                        var rel = document.getElementById('familyAddRelationship'); if (rel){ rel.value=''; }
                        var box = document.getElementById('familyAddResults'); if (box){ box.classList.add('d-none'); box.innerHTML=''; }
                        var btnAdd = document.getElementById('btnFamilyAddMember'); if (btnAdd){ btnAdd.disabled = true; btnAdd.removeAttribute('data-pid'); }

                        // Update visible members count on card
                        try {
                            var card = document.querySelector('.family-card[data-family-id="' + fid + '"]');
                            if (card){
                                var countEl = card.querySelector('.family-members-count');
                                if (countEl){
                                    var txt = countEl.textContent || '0';
                                    var m = (txt.match(/\d+/) || [0])[0];
                                    var newVal = (parseInt(m,10) || 0) + 1;
                                    countEl.textContent = newVal + ' người';
                                }
                            }
                        } catch(_) {}

                        // alert success
                        var alertEl = document.createElement('div');
                        alertEl.className = 'alert alert-success alert-dismissible fade show m-3';
                        alertEl.setAttribute('role', 'alert');
                        alertEl.innerHTML = '<i class="fas fa-check-circle me-2"></i>' + (res.json.message || 'Đã thêm thành viên.') +
                            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                        (document.querySelector('.web-body') || document.body).prepend(alertEl);
                        setTimeout(function(){ try { if (window.bootstrap){ bootstrap.Alert.getOrCreateInstance(alertEl).close(); } } catch(_){} }, 5000);
                    })
                    .catch(function(err){
                        var alertEl = document.createElement('div');
                        alertEl.className = 'alert alert-danger alert-dismissible fade show m-3';
                        alertEl.setAttribute('role', 'alert');
                        alertEl.innerHTML = '<i class="fas fa-triangle-exclamation me-2"></i>' + ((err && err.message) || 'Không thể thêm.') +
                            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                        (document.querySelector('.web-body') || document.body).prepend(alertEl);
                    })
                    .finally(function(){ btn.disabled = false; });
                }, { passive: false });
    }

    if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', mountMembersHandlers, { once: true });
    } else { mountMembersHandlers(); }
})();
</script>
<?= $this->endSection() ?>