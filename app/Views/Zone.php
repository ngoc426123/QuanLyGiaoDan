<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<!-- Alerts container at top -->
<div id="zoneAlerts" class="mb-3"></div>
<div class="d-flex flex-column mb-3">
    <h2 class="mb-1">Quản lý Giáo khu</h2>
    <div class="text-muted">Tổng cộng: <strong><?= esc($total_zones ?? 0) ?></strong> giáo khu</div>
</div>

<div class="row g-3">
    <!-- Left: Zone list -->
    <div class="col-lg-3">
    <div class="scroll-area-70vh">
            <div class="mb-2 text-end">
                <button class="btn btn-primary btn-sm" type="button" data-bs-toggle="modal" data-bs-target="#modalCreateZone">
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
                        <a href="#" class="stretched-link action-zone-select" data-zone-id="<?= (int)$zone['id'] ?>" aria-label="Xem <?= esc($zone['name']) ?>"></a>
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
                    <button class="btn btn-sm btn-outline-primary me-2 action-zone-edit" type="button"><i class="fas fa-edit me-1"></i>Chỉnh sửa</button>
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

            <div class="tab-content pt-3" id="zoneDetailTabs">
                <!-- Overview -->
                <div class="tab-pane fade show active" id="pane-overview" role="tabpanel">
                    <?php $ov = $details['overview'] ?? []; ?>
                    <div class="row g-3" id="zoneOverview">
                        <div class="col-md-3 col-6">
                            <div class="p-3 border rounded text-center">
                                <div class="text-muted small">Gia đình</div>
                                <div class="fs-4 fw-bold" id="ovFamiliesCount"><?= (int)($ov['families_count'] ?? 0) ?></div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="p-3 border rounded text-center">
                                <div class="text-muted small">Giáo dân</div>
                                <div class="fs-4 fw-bold" id="ovMembersCount"><?= (int)($ov['members_count'] ?? 0) ?></div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="p-3 border rounded text-center">
                                <div class="text-muted small">Nam</div>
                                <div class="fs-5 fw-bold text-primary" id="ovMale"><?= (int)($ov['male'] ?? 0) ?></div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="p-3 border rounded text-center">
                                <div class="text-muted small">Nữ</div>
                                <div class="fs-5 fw-bold text-pink" id="ovFemale"><?= (int)($ov['female'] ?? 0) ?></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Families -->
                <div class="tab-pane fade" id="pane-families" role="tabpanel">
                    <div class="table-responsive" id="zoneFamiliesWrap">
                        <table class="table align-middle" id="zoneFamiliesTable">
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
                    <div class="border rounded p-3 bg-light" id="zoneNotes"><?= esc($details['notes'] ?? 'Chưa có ghi chú.') ?></div>
                </div>
            </div>
            <?php else: ?>
            <div class="text-center text-muted py-5">Chưa chọn giáo khu.</div>
            <?php endif; ?>
        </div>
    </div>
 </div>

<?= $this->endSection() ?>

<?= $this->section('content') ?>
<script>
(function(){
    var currentZoneId = <?= (int)($selected_id ?? 0) ?>;
    var zoneCache = null; // last loaded detail json for prefill
    function renderFamilies(rows){
        if (!rows || !rows.length){
            return '<tr><td colspan="6" class="text-center text-muted">Chưa có gia đình nào.</td></tr>';
        }
        return rows.map(function(f){
            return '<tr>'+
                '<td class="fw-semibold"><i class="fas fa-home text-info me-1"></i>' + (f.name || '') + '</td>'+
                '<td>' + (f.head || '') + '</td>'+
                '<td>' + (f.members || 0) + '</td>'+
                '<td>' + (f.phone || '') + '</td>'+
                '<td>' + (f.address || '') + '</td>'+
                '<td class="text-end"><button class="btn btn-sm btn-outline-secondary"><i class="fas fa-eye"></i></button></td>'+
            '</tr>';
        }).join('');
    }

        document.body.addEventListener('click', function(e){
        var a = e.target.closest && e.target.closest('a.action-zone-select');
        if (!a) return;
        e.preventDefault();
        var zid = a.getAttribute('data-zone-id');
        if (!zid) return;
        fetch('/zone/' + encodeURIComponent(zid), { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
          .then(function(res){ return res.json(); })
          .then(function(json){
            if (!json || !json.ok) return;
                        currentZoneId = json.zone && json.zone.id ? json.zone.id : parseInt(zid, 10);
                        zoneCache = json;
            // Header
            var right = document.querySelector('.col-lg-9 .bg-white.border.rounded.p-3');
            if (right){
                var headerTitle = right.querySelector('h4'); if (headerTitle) headerTitle.textContent = json.zone.name || '';
                var small = right.querySelector('.text-muted.small');
                if (small){ small.innerHTML = '<i class="fas fa-user me-1"></i>Trưởng khu: ' + (json.zone.leader||'') +
                  '<span class="mx-2">|</span><i class="fas fa-phone me-1"></i>' + (json.zone.phone||'') +
                  '<span class="mx-2">|</span><i class="fas fa-location-dot me-1"></i>' + (json.zone.address||''); }
            }
            // Overview numbers
            var ov = json.details.overview || {}; 
            var elFam = document.getElementById('ovFamiliesCount'); if (elFam) elFam.textContent = (ov.families_count || 0);
            var elMem = document.getElementById('ovMembersCount'); if (elMem) elMem.textContent = (ov.members_count || 0);
            var elMale = document.getElementById('ovMale'); if (elMale) elMale.textContent = (ov.male || 0);
            var elFem = document.getElementById('ovFemale'); if (elFem) elFem.textContent = (ov.female || 0);
            // Families table
            var tbody = document.querySelector('#zoneFamiliesTable tbody');
            if (tbody){ tbody.innerHTML = renderFamilies(json.details.families || []); }
            // Notes
            var notes = document.getElementById('zoneNotes'); if (notes){ notes.textContent = json.details.notes || 'Chưa có ghi chú.'; }
            // Update active in list
            var items = document.querySelectorAll('#zoneList .list-group-item');
            Array.prototype.forEach.call(items, function(li){ li.classList.remove('active','text-white'); var sub = li.querySelector('.small'); if (sub){ sub.classList.remove('text-white-50'); sub.classList.add('text-muted'); } });
            var li = a.closest('.list-group-item'); if (li){ li.classList.add('active','text-white'); var sub = li.querySelector('.small'); if (sub){ sub.classList.remove('text-muted'); sub.classList.add('text-white-50'); } }
          })
          .catch(function(){ /* ignore */});
    }, { passive: false });

    // Edit Zone: open modal with prefilled data
    document.body.addEventListener('click', function(e){
        var btn = e.target.closest && e.target.closest('button.action-zone-edit');
        if (!btn) return;
        e.preventDefault();
        var zid = currentZoneId || (function(){
            var active = document.querySelector('#zoneList .list-group-item.active a.action-zone-select');
            return active ? parseInt(active.getAttribute('data-zone-id')||'0', 10) : 0;
        })();
        if (!zid) return;
        function openWith(data){
            try {
                var mEl = document.getElementById('modalEditZone');
                if (!mEl) return;
                var nameEl = document.getElementById('editZoneNameInput');
                var holyEl = document.getElementById('editZoneHolyNameInput');
                var noteEl = document.getElementById('editZoneNoteInput');
                if (nameEl) nameEl.value = (data.zone && data.zone.name) ? data.zone.name : '';
                if (holyEl) holyEl.value = (data.zone && data.zone.holy_name) ? data.zone.holy_name : '';
                if (noteEl) noteEl.value = (data.details && data.details.notes) ? data.details.notes : '';
                var form = document.getElementById('formEditZone');
                if (form) form.setAttribute('data-zone-id', String(zid));
                document.body.appendChild(mEl); // ensure atop
                var modal = new bootstrap.Modal(mEl);
                modal.show();
            } catch(e) { /* ignore */ }
        }
        if (zoneCache && zoneCache.zone && zoneCache.zone.id === zid){
            openWith(zoneCache);
        } else {
            fetch('/zone/' + encodeURIComponent(zid), { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
              .then(function(res){ return res.json(); })
              .then(function(json){ if (json && json.ok){ zoneCache = json; openWith(json); } })
              .catch(function(){});
        }
    }, { passive: false });
})();
</script>
<?= $this->endSection() ?>

<?= $this->section('content') ?>

<!-- Modal: Create Zone -->
<?php helper('lists'); $holyNames = get_suggestion_list('holy_names', ['Giuse','Maria','Phêrô']); ?>
<div class="modal fade" id="modalCreateZone" tabindex="-1" aria-labelledby="modalCreateZoneLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalCreateZoneLabel"><i class="fas fa-layer-group me-2"></i>Thêm giáo khu mới</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="formCreateZone" class="needs-validation" novalidate>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="form-floating">
                                <input type="text" name="name" id="zoneNameInput" class="form-control" placeholder="Tên giáo khu" required maxlength="100">
                                <label for="zoneNameInput">Tên giáo khu <span class="text-danger">*</span></label>
                                <div class="invalid-feedback">Vui lòng nhập tên giáo khu.</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating">
                                <input type="text" name="holy_name" id="zoneHolyNameInput" class="form-control" placeholder="Tên thánh" list="zoneHolyNameOptions" maxlength="75">
                                <label for="zoneHolyNameInput">Tên thánh (tùy chọn)</label>
                            </div>
                        </div>

                        <div class="col-12">
                            <div class="form-floating">
                                <textarea class="form-control" placeholder="Ghi chú" name="note" id="zoneNoteInput" style="height: 90px"></textarea>
                                <label for="zoneNoteInput">Ghi chú</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>Lưu</button>
                </div>
            </form>
        </div>
    </div>
    <datalist id="zoneHolyNameOptions">
        <?php foreach (($holyNames ?? []) as $hn): ?>
            <option value="<?= esc($hn) ?>"></option>
        <?php endforeach; ?>
    </datalist>
</div>

<script>
(function(){
    var submitting = false;
    function showAlert(type, message){
        var wrap = document.getElementById('zoneAlerts'); if (!wrap) return;
        var div = document.createElement('div');
        div.className = 'alert alert-' + type + ' alert-dismissible fade show';
        div.setAttribute('role','alert');
        div.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
        wrap.appendChild(div);
        setTimeout(function(){ try { div.classList.remove('show'); div.remove(); } catch(e){} }, 5000);
    }

    var form = document.getElementById('formCreateZone');
    if (form){
            // Move modal under <body> on show to escape any stacking context
            var mEl = document.getElementById('modalCreateZone');
            if (mEl){
                mEl.addEventListener('show.bs.modal', function(){ try { document.body.appendChild(mEl); } catch(e){} });
            }

        form.addEventListener('submit', function(e){
            e.preventDefault();
            if (submitting) return;
            var nameEl = document.getElementById('zoneNameInput');
            var name = (nameEl && nameEl.value || '').trim();
            var holy = (document.getElementById('zoneHolyNameInput').value || '').trim();
            var note = (document.getElementById('zoneNoteInput').value || '').trim();
            if (!name){ form.classList.add('was-validated'); return; }
            submitting = true;
            fetch('/zone/create', {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
                body: new URLSearchParams({ name: name, holy_name: holy, note: note })
            })
            .then(function(res){ return res.json().then(function(json){ return { status: res.status, json: json }; }); })
            .then(function(res){
                if (!res || !res.json){ showAlert('danger','Có lỗi xảy ra.'); return; }
                if (res.status >= 400 || res.json.ok === false){
                    var msg = 'Thêm giáo khu thất bại.';
                    if (res.json.errors){
                        var errMsgs = Object.values(res.json.errors).filter(Boolean).join('<br>');
                        if (errMsgs) msg = errMsgs;
                    }
                    showAlert('danger', msg);
                    submitting = false; return;
                }
                // Success: close modal, prepend to left list, show alert
                try { var modalEl = document.getElementById('modalCreateZone'); if (modalEl){ var mi = bootstrap.Modal.getInstance(modalEl); if (mi) mi.hide(); } } catch(e){}
                form.reset(); form.classList.remove('was-validated');
                var row = res.json.row || {};
                var ul = document.getElementById('zoneList');
                if (ul){
                    var li = document.createElement('li');
                    li.className = 'list-group-item d-flex align-items-center position-relative';
                    li.innerHTML = '<div class="me-2">\
                            <div class="fw-semibold">' + (row.name || '') + '</div>\
                            <div class="small text-muted">Trưởng khu: ' + (row.leader || '') + '</div>\
                        </div>\
                        <span class="badge bg-secondary rounded-pill ms-auto">' + (row.families_count || 0) + '</span>\
                        <a href="#" class="stretched-link action-zone-select" data-zone-id="' + (row.id || '') + '" aria-label="Xem ' + (row.name || '') + '"></a>';
                    ul.prepend(li);
                }
                // Update right header if first item or if empty
                var header = document.querySelector('.col-lg-9 .bg-white.border.rounded.p-3 h4');
                if (header && !header.textContent){ header.textContent = row.name || ''; }
                showAlert('success', res.json.message || 'Đã thêm giáo khu mới.');
                submitting = false;
            })
            .catch(function(){ showAlert('danger','Có lỗi mạng.'); submitting = false; });
        });
    }
})();
</script>
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<!-- Modal: Edit Zone -->
<div class="modal fade" id="modalEditZone" tabindex="-1" aria-labelledby="modalEditZoneLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalEditZoneLabel"><i class="fas fa-pen-to-square me-2"></i>Chỉnh sửa giáo khu</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="formEditZone" class="needs-validation" novalidate>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="form-floating">
                                <input type="text" name="name" id="editZoneNameInput" class="form-control" placeholder="Tên giáo khu" required maxlength="100">
                                <label for="editZoneNameInput">Tên giáo khu <span class="text-danger">*</span></label>
                                <div class="invalid-feedback">Vui lòng nhập tên giáo khu.</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-floating">
                                <input type="text" name="holy_name" id="editZoneHolyNameInput" class="form-control" placeholder="Tên thánh" list="zoneHolyNameOptions" maxlength="75">
                                <label for="editZoneHolyNameInput">Tên thánh (tùy chọn)</label>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="form-floating">
                                <textarea class="form-control" placeholder="Ghi chú" name="note" id="editZoneNoteInput" style="height: 90px"></textarea>
                                <label for="editZoneNoteInput">Ghi chú</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Đóng</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save me-1"></i>Lưu thay đổi</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
(function(){
    var submittingEdit = false;
    function showAlert(type, message){
        var wrap = document.getElementById('zoneAlerts'); if (!wrap) return;
        var div = document.createElement('div');
        div.className = 'alert alert-' + type + ' alert-dismissible fade show';
        div.setAttribute('role','alert');
        div.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
        wrap.appendChild(div);
        setTimeout(function(){ try { div.classList.remove('show'); div.remove(); } catch(e){} }, 5000);
    }

    var form = document.getElementById('formEditZone');
    if (form){
        // Ensure modal appended to body on show
        var mEl = document.getElementById('modalEditZone');
        if (mEl){ mEl.addEventListener('show.bs.modal', function(){ try { document.body.appendChild(mEl); } catch(e){} }); }

        form.addEventListener('submit', function(e){
            e.preventDefault();
            if (submittingEdit) return;
            var zid = parseInt(form.getAttribute('data-zone-id')||'0', 10);
            if (!zid) return;
            var name = (document.getElementById('editZoneNameInput').value || '').trim();
            var holy = (document.getElementById('editZoneHolyNameInput').value || '').trim();
            var note = (document.getElementById('editZoneNoteInput').value || '').trim();
            if (!name){ form.classList.add('was-validated'); return; }
            submittingEdit = true;
            fetch('/zone/' + encodeURIComponent(zid) + '/update', {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
                body: new URLSearchParams({ name: name, holy_name: holy, note: note })
            })
            .then(function(res){ return res.json().then(function(json){ return { status: res.status, json: json }; }); })
            .then(function(res){
                if (!res || !res.json){ showAlert('danger','Có lỗi xảy ra.'); submittingEdit = false; return; }
                if (res.status >= 400 || res.json.ok === false){
                    var msg = 'Cập nhật giáo khu thất bại.';
                    if (res.json.errors){
                        var errMsgs = Object.values(res.json.errors).filter(Boolean).join('<br>');
                        if (errMsgs) msg = errMsgs;
                    }
                    showAlert('danger', msg);
                    submittingEdit = false; return;
                }
                // Success: close modal, update UI
                try { var modalEl = document.getElementById('modalEditZone'); if (modalEl){ var mi = bootstrap.Modal.getInstance(modalEl); if (mi) mi.hide(); } } catch(e){}
                form.classList.remove('was-validated');
                // Update header title
                var headerTitle = document.querySelector('.col-lg-9 .bg-white.border.rounded.p-3 h4'); if (headerTitle) headerTitle.textContent = name;
                // Update notes panel
                var notes = document.getElementById('zoneNotes'); if (notes){ notes.textContent = note || 'Chưa có ghi chú.'; }
                // Update left list item label
                var a = document.querySelector('#zoneList a.action-zone-select[data-zone-id="' + zid + '"]');
                if (a){
                    var li = a.closest('.list-group-item');
                    if (li){ var title = li.querySelector('.fw-semibold'); if (title) title.textContent = name; }
                }
                showAlert('success', res.json.message || 'Đã cập nhật giáo khu.');
                submittingEdit = false;
            })
            .catch(function(){ showAlert('danger','Có lỗi mạng.'); submittingEdit = false; });
        });
    }
})();
</script>
<?= $this->endSection() ?>