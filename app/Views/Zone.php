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
                        <div class="ms-auto d-flex align-items-center gap-2">
                            <span class="badge bg-light text-secondary border" title="Số gia đình"><i class="fas fa-home me-1"></i><?= esc($zone['families_count']) ?></span>
                            <span class="badge bg-light text-secondary border" title="Số thành viên"><i class="fas fa-users me-1"></i><?= esc($zone['members_count']) ?></span>
                        </div>
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
                    <button class="nav-link" id="tab-members" data-bs-toggle="tab" data-bs-target="#pane-members" type="button" role="tab">Thành viên</button>
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
                                    <td class="text-end"><button class="btn btn-sm btn-outline-secondary action-family-view" data-fid="<?= (int)($f['id'] ?? 0) ?>" title="Xem chi tiết"><i class="fas fa-eye"></i></button></td>
                                </tr>
                                <?php endforeach; ?>
                                <?php if (empty($details['families'])): ?>
                                <tr><td colspan="6" class="text-center text-muted">Chưa có gia đình nào.</td></tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Members -->
                <div class="tab-pane fade" id="pane-members" role="tabpanel">
                    <div class="person-table-container">
                        <div class="table-responsive">
                            <table class="table person-table mb-0" id="zoneMembersTable">
                                <thead>
                                    <tr>
                                        <th>Giáo dân</th>
                                        <th>Giới tính</th>
                                        <th>Điện thoại</th>
                                        <th>Gia đình</th>
                                        <th class="text-end"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if (!empty($details['members'])): ?>
                                        <?php foreach (($details['members'] ?? []) as $m): ?>
                                            <tr>
                                                <td>
                                                    <div class="person-info">
                                                        <div class="person-avatar">
                                                            <?php 
                                                                $g = strtolower(trim((string)($m['gender'] ?? '')));
                                                                $icon = ($g === 'nữ' || $g === 'nu' || $g === 'female' || $g === 'f') 
                                                                    ? 'images/icons/icon_female.png' 
                                                                    : 'images/icons/icon_male.png';
                                                            ?>
                                                            <img class="person-avatar-img" src="<?= base_url($icon) ?>" alt="avatar">
                                                        </div>
                                                        <div class="person-details">
                                                            <div class="person-name"><?= esc($m['name'] ?? '') ?></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><?= esc($m['gender'] ?? '') ?></td>
                                                <td><?= esc($m['phone'] ?? '') ?></td>
                                                <td><?= esc($m['family'] ?? '') ?></td>
                                                <td class="text-end">
                                                    <a href="#" class="btn btn-sm btn-outline-secondary action-view-person" data-person-id="<?= (int)($m['id'] ?? 0) ?>" title="Xem chi tiết"><i class="fa-regular fa-eye"></i></a>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    <?php else: ?>
                                        <tr><td colspan="5" class="text-center text-muted py-4">Chưa có thành viên.</td></tr>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                        <div class="person-pagination d-flex justify-content-between align-items-center p-3 bg-light" id="zoneMembersPagination">
                            <div class="pagination-info text-muted">
                                Hiển thị <strong id="zmDisplayFrom">0</strong>-<strong id="zmDisplayTo">0</strong> trong tổng số <strong id="zmTotal">0</strong> thành viên
                            </div>
                            <nav aria-label="Phân trang thành viên">
                                <ul class="pagination pagination-sm mb-0" id="zmPager">
                                    <li class="page-item disabled"><a class="page-link zone-members-prev" href="#" tabindex="-1">Trước</a></li>
                                    <li class="page-item active"><a class="page-link" href="#">1</a></li>
                                    <li class="page-item disabled"><a class="page-link zone-members-next" href="#">Sau</a></li>
                                </ul>
                            </nav>
                        </div>
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

<script>
(function(){
    var currentZoneId = <?= (int)($selected_id ?? 0) ?>;
    var zoneCache = null; // last loaded detail json for prefill
    var membersFull = []; // full list for pagination
    var membersPage = 1;
    var membersPerPage = 15;
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
                '<td class="text-end"><button class="btn btn-sm btn-outline-secondary action-family-view" data-fid="' + (f.id || '') + '" title="Xem chi tiết"><i class="fas fa-eye"></i></button></td>'+
            '</tr>';
        }).join('');
    }

    function renderMembers(rows){
        if (!rows || !rows.length){
            return '<tr><td colspan="5" class="text-center text-muted py-4">Chưa có thành viên.</td></tr>';
        }
        return rows.map(function(m){
            var g = (String(m.gender||'').toLowerCase());
            var isFemale = (g === 'nữ' || g === 'nu' || g === 'female' || g === 'f');
            var icon = isFemale ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
            return '<tr>'+
                '<td>'+
                    '<div class="person-info">'+
                        '<div class="person-avatar"><img class="person-avatar-img" src="' + (window.BASE_URL ? (window.BASE_URL + icon) : ('/' + icon)) + '" alt="avatar"></div>'+
                        '<div class="person-details"><div class="person-name">' + (m.name || '') + '</div></div>'+
                    '</div>'+
                '</td>'+
                '<td>' + (m.gender || '') + '</td>'+
                '<td>' + (m.phone || '') + '</td>'+
                '<td>' + (m.family || '') + '</td>'+
                '<td class="text-end"><a href="#" class="btn btn-sm btn-outline-secondary action-view-person" data-person-id="' + (m.id || '') + '" title="Xem chi tiết"><i class="fa-regular fa-eye"></i></a></td>'+
            '</tr>';
        }).join('');
    }

    function updateMembersPaginationUI(total, page){
        var totalEl = document.getElementById('zmTotal'); if (totalEl) totalEl.textContent = total;
        var from = total === 0 ? 0 : ((page - 1) * membersPerPage + 1);
        var to = Math.min(page * membersPerPage, total);
        var fromEl = document.getElementById('zmDisplayFrom'); if (fromEl) fromEl.textContent = from;
        var toEl = document.getElementById('zmDisplayTo'); if (toEl) toEl.textContent = to;
        var pager = document.getElementById('zmPager');
        if (pager){
            var totalPages = Math.max(1, Math.ceil(total / membersPerPage));
            var html = '';
            // prev
            html += '<li class="page-item'+(page<=1?' disabled':'')+'"><a class="page-link zone-members-prev" href="#">Trước</a></li>';
            // simple numbered pages (limit to first 5 for brevity)
            var maxPages = Math.min(5, totalPages);
            var start = Math.max(1, Math.min(page - 2, totalPages - maxPages + 1));
            var end = Math.min(totalPages, start + maxPages - 1);
            for (var i=start;i<=end;i++){
                html += '<li class="page-item'+(i===page?' active':'')+'"><a class="page-link zone-members-page" href="#" data-page="'+i+'">'+i+'</a></li>';
            }
            // next
            html += '<li class="page-item'+(page>=totalPages?' disabled':'')+'"><a class="page-link zone-members-next" href="#">Sau</a></li>';
            pager.innerHTML = html;
        }
    }

    function paginateMembers(fullList, page){
        var total = fullList ? fullList.length : 0;
        var startIdx = (page - 1) * membersPerPage;
        var slice = (total > 0) ? fullList.slice(startIdx, startIdx + membersPerPage) : [];
        var mtbody = document.querySelector('#zoneMembersTable tbody');
        if (mtbody){ mtbody.innerHTML = renderMembers(slice); }
        updateMembersPaginationUI(total, page);
    }

    // Pagination click handlers
    document.body.addEventListener('click', function(e){
        var prev = e.target.closest && e.target.closest('a.zone-members-prev');
        var next = e.target.closest && e.target.closest('a.zone-members-next');
        var pageLink = e.target.closest && e.target.closest('a.zone-members-page');
        if (!prev && !next && !pageLink) return;
        e.preventDefault();
        var total = membersFull ? membersFull.length : 0;
        var totalPages = Math.max(1, Math.ceil(total / membersPerPage));
        if (pageLink){
            var p = parseInt(pageLink.getAttribute('data-page')||'1', 10) || 1;
            membersPage = Math.min(Math.max(1, p), totalPages);
        } else if (prev){
            membersPage = Math.max(1, membersPage - 1);
        } else if (next){
            membersPage = Math.min(totalPages, membersPage + 1);
        }
        paginateMembers(membersFull, membersPage);
    }, { passive: false });

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
                                    '<span class="mx-2">|</span><i class="fas fa-phone me-1"></i>' + (json.zone.phone||''); }
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
            // Members table with pagination
            membersFull = json.details.members || [];
            membersPage = 1;
            paginateMembers(membersFull, membersPage);
            // Notes
            var notes = document.getElementById('zoneNotes'); if (notes){ notes.textContent = json.details.notes || 'Chưa có ghi chú.'; }
            // Update active in list
            var items = document.querySelectorAll('#zoneList .list-group-item');
            Array.prototype.forEach.call(items, function(li){ li.classList.remove('active','text-white'); var sub = li.querySelector('.small'); if (sub){ sub.classList.remove('text-white-50'); sub.classList.add('text-muted'); } });
                var li = a.closest('.list-group-item');
                if (li){
                    li.classList.add('active','text-white');
                    var sub = li.querySelector('.small');
                    if (sub){
                        sub.classList.remove('text-muted');
                        sub.classList.add('text-white-50');
                        // Sync leader name on left with detail response
                        sub.textContent = 'Trưởng khu: ' + (json.zone.leader || '');
                    }
                }
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

    // Initial sync on load: fetch details for the currently selected zone and update UI
    var didInitialSync = false;
    function initialSync(){
        if (didInitialSync) return; // run once
        if (!currentZoneId || Number(currentZoneId) <= 0) return;
        didInitialSync = true;
        fetch('/zone/' + encodeURIComponent(currentZoneId), { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
            .then(function(res){ return res.json(); })
            .then(function(json){
                if (!json || !json.ok) return;
                zoneCache = json;
                // Header
                var right = document.querySelector('.col-lg-9 .bg-white.border.rounded.p-3');
                if (right){
                    var headerTitle = right.querySelector('h4'); if (headerTitle) headerTitle.textContent = json.zone.name || '';
                    var small = right.querySelector('.text-muted.small');
                    if (small){ small.innerHTML = '<i class="fas fa-user me-1"></i>Trưởng khu: ' + (json.zone.leader||'') +
                        '<span class="mx-2">|</span><i class="fas fa-phone me-1"></i>' + (json.zone.phone||''); }
                }
                // Overview numbers
                var ov = json.details && json.details.overview ? json.details.overview : {};
                var elFam = document.getElementById('ovFamiliesCount'); if (elFam) elFam.textContent = (ov.families_count || 0);
                var elMem = document.getElementById('ovMembersCount'); if (elMem) elMem.textContent = (ov.members_count || 0);
                var elMale = document.getElementById('ovMale'); if (elMale) elMale.textContent = (ov.male || 0);
                var elFem = document.getElementById('ovFemale'); if (elFem) elFem.textContent = (ov.female || 0);
                // Families table
                var tbody = document.querySelector('#zoneFamiliesTable tbody');
                if (tbody){ tbody.innerHTML = renderFamilies((json.details && json.details.families) || []); }
                // Members table with pagination
                membersFull = (json.details && json.details.members) || [];
                membersPage = 1;
                paginateMembers(membersFull, membersPage);
                // Notes
                var notes = document.getElementById('zoneNotes'); if (notes){ notes.textContent = (json.details && json.details.notes) || 'Chưa có ghi chú.'; }
                // Update left leader subtitle for the selected item if exists and ensure active state
                var link = document.querySelector('#zoneList a.action-zone-select[data-zone-id="' + json.zone.id + '"]');
                if (link){
                    var lis = document.querySelectorAll('#zoneList .list-group-item');
                    Array.prototype.forEach.call(lis, function(li){ li.classList.remove('active','text-white'); var sub = li.querySelector('.small'); if (sub){ sub.classList.remove('text-white-50'); sub.classList.add('text-muted'); } });
                    var li = link.closest('.list-group-item');
                    if (li){
                        li.classList.add('active','text-white');
                        var sub = li.querySelector('.small');
                        if (sub){ sub.classList.remove('text-muted'); sub.classList.add('text-white-50'); sub.textContent = 'Trưởng khu: ' + (json.zone.leader || ''); }
                    }
                }
            })
            .catch(function(){ /* ignore */});
    }
    // Run on DOMContentLoaded and on window load, and immediately if already loaded
    document.addEventListener('DOMContentLoaded', initialSync, { once: true });
    window.addEventListener('load', initialSync, { once: true });
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initialSync, 0);
    }
})();
</script>

<!-- Modal: Person Detail (for viewing member details from Zone tab) -->
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
</div>

<!-- Modal: Family Detail -->
<div class="modal fade" id="modalFamilyDetail" tabindex="-1" aria-labelledby="modalFamilyDetailLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalFamilyDetailLabel"><i class="fas fa-home me-2"></i>Chi tiết gia đình</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <div class="mb-2"><span class="text-muted small">Tên gia đình</span><div class="fw-semibold" id="fdName">-</div></div>
                        <div class="mb-2"><span class="text-muted small">Địa chỉ</span><div id="fdAddress">-</div></div>
                        <div class="mb-2"><span class="text-muted small">Giáo khu</span><div id="fdZone">-</div></div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-2"><span class="text-muted small">Ghi chú</span><div id="fdNote" class="bg-light border rounded p-2">-</div></div>
                    </div>
                </div>
                <hr>
                <div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="fw-semibold">Thành viên</div>
                        <div class="text-muted small" id="fdMemberCount"></div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm align-middle" id="fdMembersTable">
                            <thead>
                                <tr>
                                    <th>Họ tên</th>
                                    <th>Quan hệ</th>
                                    <th>Điện thoại</th>
                                    <th>Giới tính</th>
                                    <th>Ngày sinh</th>
                                </tr>
                            </thead>
                            <tbody><tr><td colspan="5" class="text-muted text-center">Đang tải...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            </div>
        </div>
    </div>
    </div>

<script>
(function(){
    // Ensure modal on top of overlays
    var fm = document.getElementById('modalFamilyDetail');
    if (fm){ fm.addEventListener('show.bs.modal', function(){ try { document.body.appendChild(fm); } catch(e){} }); }

    function fmtDate(d){
        if (!d) return '';
        // Expect YYYY-MM-DD, show DD/MM/YYYY if possible
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)){
            var p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0];
        }
        return d;
    }

    document.body.addEventListener('click', function(e){
        var btn = e.target.closest && e.target.closest('button.action-family-view');
        if (!btn) return;
        e.preventDefault();
        var fid = parseInt(btn.getAttribute('data-fid')||'0', 10);
        if (!fid) return;

        // Reset modal
        var nameEl = document.getElementById('fdName'); if (nameEl) nameEl.textContent = '-';
        var addrEl = document.getElementById('fdAddress'); if (addrEl) addrEl.textContent = '-';
        var zoneEl = document.getElementById('fdZone'); if (zoneEl) zoneEl.textContent = '-';
        var noteEl = document.getElementById('fdNote'); if (noteEl) noteEl.textContent = '-';
        var tbody = document.querySelector('#fdMembersTable tbody'); if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">Đang tải...</td></tr>';
        var countEl = document.getElementById('fdMemberCount'); if (countEl) countEl.textContent = '';

        // Open modal immediately
        if (fm){ try { new bootstrap.Modal(fm).show(); } catch(e){} }

        // Fetch detail and members in parallel
        Promise.all([
            fetch('/family/' + encodeURIComponent(fid), { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' }).then(function(r){ return r.json(); }),
            fetch('/family/' + encodeURIComponent(fid) + '/members', { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' }).then(function(r){ return r.json(); })
        ])
        .then(function(res){
            var det = res[0] || {}; var mem = res[1] || {};
            if (det && det.ok && det.row){
                if (nameEl) nameEl.textContent = det.row.name || '-';
                if (addrEl) addrEl.textContent = det.row.address || '-';
                if (zoneEl) zoneEl.textContent = det.row.parish_zone || '-';
                if (noteEl) noteEl.textContent = det.row.note || '-';
            }
            if (mem && mem.ok){
                var list = mem.members || [];
                if (tbody){
                    if (!list.length){ tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">Chưa có thành viên.</td></tr>'; }
                    else {
                        tbody.innerHTML = list.map(function(m){
                            var g = m.gender === '1' || m.gender === 1 ? 'Nam' : (m.gender === '0' || m.gender === 0 ? 'Nữ' : '');
                            return '<tr>'+
                                '<td>' + (m.name || '') + '</td>'+
                                '<td>' + (m.relationship || '') + '</td>'+
                                '<td>' + (m.phone || '') + '</td>'+
                                '<td>' + g + '</td>'+
                                '<td>' + fmtDate(m.birth || '') + '</td>'+
                            '</tr>';
                        }).join('');
                    }
                }
                if (countEl) countEl.textContent = list.length ? (list.length + ' người') : '';
            }
        })
        .catch(function(){
            if (tbody){ tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Không tải được dữ liệu.</td></tr>'; }
        });
    }, { passive: false });
})();
</script>

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
                        <div class="ms-auto d-flex align-items-center gap-2">\
                            <span class="badge bg-light text-secondary border" title="Số gia đình"><i class="fas fa-home me-1"></i>' + (row.families_count || 0) + '</span>\
                            <span class="badge bg-light text-secondary border" title="Số thành viên"><i class="fas fa-users me-1"></i>' + (row.members_count || 0) + '</span>\
                        </div>\
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
                                // Update header small (leader/phone/address)
                                var headerSmall = document.querySelector('.col-lg-9 .bg-white.border.rounded.p-3 .text-muted.small');
                                if (headerSmall){ headerSmall.innerHTML = '<i class="fas fa-user me-1"></i>Trưởng khu: ' + (res.json.row.leader||'') +
                                    '<span class="mx-2">|</span><i class="fas fa-phone me-1"></i>' + (res.json.row.phone||'');
                                }
                // Update notes panel
                var notes = document.getElementById('zoneNotes'); if (notes){ notes.textContent = note || 'Chưa có ghi chú.'; }
                // Update left list item label
                var a = document.querySelector('#zoneList a.action-zone-select[data-zone-id="' + zid + '"]');
                if (a){
                    var li = a.closest('.list-group-item');
                                        if (li){
                                                var title = li.querySelector('.fw-semibold'); if (title) title.textContent = name;
                                                var sub = li.querySelector('.small'); if (sub){ sub.textContent = 'Trưởng khu: ' + (res.json.row.leader || ''); }
                                        }
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