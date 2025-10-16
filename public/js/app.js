// Global app script: init year-only datepickers site-wide
(function(){
  // Person modal logic: handle form submit, validation, and deceased toggle
  function initPersonForm(root){
    var container = root || document;
    var form = container.getElementById ? container.getElementById('personCreateForm') : document.getElementById('personCreateForm');
  if (!form) return;

    // zone -> families dynamic loader
    var zoneSelect = form.querySelector('select[name="zone_id"]');
    var familySelect = form.querySelector('select[name="family_id"]');
    function populateFamilies(options){
      if (!familySelect) return;
      var current = familySelect.value;
      // Build options
      var frag = document.createDocumentFragment();
      var first = document.createElement('option');
      first.value = '';
      first.textContent = '-- Chọn gia đình --';
      frag.appendChild(first);
      (options || []).forEach(function(it){
        var opt = document.createElement('option');
        opt.value = String(it.id || '');
        opt.textContent = it.name || ('#' + it.id);
        frag.appendChild(opt);
      });
      // Replace children
      while (familySelect.firstChild) familySelect.removeChild(familySelect.firstChild);
      familySelect.appendChild(frag);
      // Try to keep selection if still present
      if (current) {
        var found = Array.prototype.some.call(familySelect.options, function(o){ return o.value === current; });
        if (found) familySelect.value = current; else familySelect.value = '';
      }
    }
    function loadFamilies(zoneId){
      if (!familySelect) return Promise.resolve();
      familySelect.disabled = true;
      var url = '/person/families' + (zoneId ? ('?zone_id=' + encodeURIComponent(zoneId)) : '');
      return fetch(url, { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
        .then(function(res){ return res.json(); })
        .then(function(json){ populateFamilies(json.families || []); })
        .catch(function(){ /* ignore */ })
        .finally(function(){ familySelect.disabled = false; });
    }
    if (zoneSelect && familySelect && !zoneSelect.dataset.boundFamilies){
      zoneSelect.addEventListener('change', function(){
        var zid = this.value ? parseInt(this.value, 10) : 0;
        loadFamilies(isNaN(zid) ? 0 : zid);
      });
      zoneSelect.dataset.boundFamilies = '1';
      // Optional: initial sync when modal shown (keeps server-rendered list if no zone)
      // loadFamilies(parseInt(zoneSelect.value || '0', 10) || 0);
    }

    // Toggle relationship input based on family selection
    var relationshipWrap = (container.getElementById ? container.getElementById('relationshipWrap') : document.getElementById('relationshipWrap'));
    var relationshipInput = form.querySelector('input[name="relationship"]');
    function toggleRelationship(){
      if (!familySelect || !relationshipWrap) return;
      var hasFamily = !!(familySelect.value && familySelect.value.trim() !== '');
      if (hasFamily){
        relationshipWrap.classList.remove('d-none');
      } else {
        relationshipWrap.classList.add('d-none');
        if (relationshipInput) relationshipInput.value = '';
      }
    }
    if (familySelect && !familySelect.dataset.boundRelToggle){
      familySelect.addEventListener('change', toggleRelationship);
      familySelect.dataset.boundRelToggle = '1';
      // initial state
      toggleRelationship();
    }

    // submit handler (bind once per form)
    if (!form.dataset.boundSubmit) {
      form.addEventListener('submit', function(e){
        e.preventDefault();
        e.stopPropagation();

        if (form.checkValidity()){
          // deceased year >= birth year
          var birthYearEl = form.querySelector('input[name="birth_year"]');
          var deceasedYearEl = form.querySelector('input[name="deceased_year"]');
          function extractYear(val){
            if (!val) return NaN;
            var s = (val || '').trim();
            // Accept YYYY or dd/mm/yyyy or dd-mm-yyyy
            var m = s.match(/^\d{4}$/);
            if (m) return parseInt(s,10);
            var parts = s.split(/[\/\-]/);
            if (parts.length === 3){
              // dd/mm/yyyy (default)
              var y = parts[2];
              var yi = parseInt(y,10);
              if (!isNaN(yi)) return yi;
            }
            return NaN;
          }
          if (deceasedYearEl && deceasedYearEl.value){
            var by = extractYear(birthYearEl && birthYearEl.value || '');
            var dy = extractYear(deceasedYearEl.value || '');
            if (!isNaN(by) && !isNaN(dy) && dy < by){
              deceasedYearEl.classList.add('is-invalid');
              return; // stop submit
            } else {
              deceasedYearEl.classList.remove('is-invalid');
            }
          }

          // Submit via AJAX to server
          var action = form.getAttribute('action') || '/person/create';
          var fd = new FormData(form);
          fetch(action, {
            method: 'POST',
            body: fd,
            headers: {
              'Accept': 'application/json'
            },
            credentials: 'same-origin'
          }).then(function(res){
            if (!res.ok) return res.json().then(function(err){ throw err; });
            return res.json();
          }).then(function(json){
            // Close modal
            var modalEl = document.getElementById('modalCreatePerson');
            if (modalEl && window.bootstrap){
              var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
              modal.hide();
            }
            // Reset form
            form.reset();
            form.classList.remove('was-validated');
            var deceasedWrap = document.getElementById('deceasedYearWrap');
            if (deceasedWrap) deceasedWrap.classList.add('d-none');

            // Append new row to table if available
            try {
              var row = json.row || {};
              var tbody = document.querySelector('.person-table tbody');
              if (tbody){
                // remove empty row if exists
                var empty = tbody.querySelector('tr td[colspan]');
                if (empty && tbody.children.length === 1) tbody.removeChild(empty.parentElement);
                var g = (row.gender || '').toString().toLowerCase();
                // Accept either textual label or numeric encoding. New convention: '0' => male, '1' => female
                var icon = (g === '1' || g === 'nữ' || g === 'nu' || g === 'female' || g === 'f') ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
                // Determine family/zone display with fallback to selected options
                var famText = row.family || '';
                var zoneText = row.zones || '';
                try {
                  if (!famText) {
                    var famSel = form.querySelector('select[name="family_id"]');
                    if (famSel && famSel.value) {
                      var opt = famSel.options[famSel.selectedIndex];
                      famText = (opt && opt.textContent) ? opt.textContent.trim() : '';
                    }
                  }
                  if (!zoneText) {
                    var zoneSel = form.querySelector('select[name="zone_id"]');
                    if (zoneSel && zoneSel.value) {
                      var optz = zoneSel.options[zoneSel.selectedIndex];
                      zoneText = (optz && optz.textContent) ? optz.textContent.trim() : '';
                    }
                  }
                } catch(_) {}
                  var tr = document.createElement('tr');
                  if (row.id) { try { tr.setAttribute('data-row-id', String(row.id)); } catch(_) {} }
                  var base = (window.BASE_URL || '/');
                  tr.innerHTML = `
                    <td class="text-center"><input type="checkbox" class="form-check-input"></td>
                    <td>
                      <div class="person-info">
                        <div class="person-avatar">
                          <img class="person-avatar-img" src="${base}${icon}" alt="avatar">
                        </div>
                        <div class="person-details">
                          <div class="person-name">${row.name || '-'}</div>
                          <div class="person-meta text-muted small">
                            <span class="me-2"><i class="fa-solid fa-venus-mars me-1"></i>${row.gender || '-'}</span>
                            <span><i class="fa-regular fa-calendar me-1"></i>${row.birth || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="text-sm">
                        <div><i class="fa-regular fa-id-card me-1 text-secondary"></i>Tuổi: <strong>${row.age || '-'}</strong></div>
                        <div class="text-muted">Mã: #${row.id || '-'}</div>
                      </div>
                    </td>
                    <td><div class="text-sm text-muted">Gia đình: <span class="text-dark">${famText || '—'}</span><br>Giáo khu: <span class="text-dark">${zoneText || '—'}</span></div></td>
                    <td>${row.baptismDate ? (`<span class="baptism-date"><i class="fa-solid fa-water me-1 text-primary"></i>${row.baptismDate}</span>`) : '<span class="text-muted">—</span>'}</td>
                    <td>${row.communionDate ? (`<span class="communion-date"><i class="fa-solid fa-bread-slice me-1 text-info"></i>${row.communionDate}</span>`) : '<span class="text-muted">—</span>'}</td>
                    <td>${row.confirmationDate ? (`<span class="confirmation-date"><i class="fa-solid fa-dove me-1 text-purple"></i>${row.confirmationDate}</span>`) : '<span class="text-muted">—</span>'}</td>
                    <td>${row.marriageDate ? (`<span class="marriage-date"><i class="fa-solid fa-ring me-1 text-danger"></i>${row.marriageDate}</span>`) : '<span class="text-muted">—</span>'}</td>
                    <td class="text-center">
                      <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Thao tác</button>
                        <ul class="dropdown-menu dropdown-menu-end">
                          <li><a class="dropdown-item action-view-person" href="#" data-person-id="${row.id}"><i class="fa-regular fa-eye me-2"></i>Xem</a></li>
                          <li><a class="dropdown-item action-edit-person" href="#" data-person-id="${row.id}"><i class="fa-regular fa-pen-to-square me-2"></i>Sửa</a></li>
                          <li><hr class="dropdown-divider"></li>
                          <li><a class="dropdown-item text-danger action-delete-person" href="#" data-person-id="${row.id}" data-person-name="${row.name || ''}"><i class="fa-regular fa-trash-can me-2"></i>Xoá</a></li>
                        </ul>
                      </div>
                    </td>`;
                tbody.prepend(tr);
              }
            } catch(_) {}

            // success alert
            var alertPlaceholder = document.createElement('div');
            alertPlaceholder.className = 'alert alert-success alert-dismissible fade show m-3';
            alertPlaceholder.setAttribute('role', 'alert');
            alertPlaceholder.innerHTML = '<i class="fas fa-check-circle me-2"></i>' + (json.message || 'Đã lưu thông tin.') +
              '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
            var mount = document.querySelector('.web-body') || document.body;
            mount.prepend(alertPlaceholder);

            // Auto-dismiss success alert after 5 seconds (keep close button for manual dismiss)
            try {
              setTimeout(function(){
                if (!alertPlaceholder || !alertPlaceholder.parentNode) return;
                if (window.bootstrap && bootstrap.Alert) {
                  var bsAlert = bootstrap.Alert.getOrCreateInstance(alertPlaceholder);
                  bsAlert.close();
                } else {
                  // Fallback: remove with fade-out
                  alertPlaceholder.classList.remove('show');
                  setTimeout(function(){
                    if (alertPlaceholder && alertPlaceholder.parentNode) {
                      alertPlaceholder.parentNode.removeChild(alertPlaceholder);
                    }
                  }, 300);
                }
              }, 5000);
            } catch(_) {}
          }).catch(function(err){
            var msg = (err && err.errors) ? Object.values(err.errors).join('<br>') : 'Không thể lưu dữ liệu.';
            var alertPlaceholder = document.createElement('div');
            alertPlaceholder.className = 'alert alert-danger alert-dismissible fade show m-3';
            alertPlaceholder.setAttribute('role', 'alert');
            alertPlaceholder.innerHTML = '<i class="fas fa-triangle-exclamation me-2"></i>' + msg +
              '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
            var mount = document.querySelector('.web-body') || document.body;
            mount.prepend(alertPlaceholder);
          });
        } else {
          form.classList.add('was-validated');
        }
      });
      form.dataset.boundSubmit = '1';
    }

  // deceased toggle (scope lookup to the provided container to avoid collisions)
  var deceasedSwitch = (container && container.querySelector) ? container.querySelector('#isDeceasedSwitch') : document.getElementById('isDeceasedSwitch');
  var deceasedWrap = (container && container.querySelector) ? container.querySelector('#deceasedYearWrap') : document.getElementById('deceasedYearWrap');
    if (deceasedSwitch && deceasedWrap && !deceasedSwitch.dataset.boundToggle){
      deceasedSwitch.addEventListener('change', function(){
        if (this.checked){
          deceasedWrap.classList.remove('d-none');
        } else {
          deceasedWrap.classList.add('d-none');
          var input = deceasedWrap.querySelector('input[name="deceased_year"]');
          if (input) input.value = '';
        }
      });
      deceasedSwitch.dataset.boundToggle = '1';
    }
  }

  // Overview charts init using data attributes
  function initOverviewCharts(){
    if (typeof Chart === 'undefined') return;
    var genderCanvas = document.getElementById('genderPie');
    var zoneCanvas = document.getElementById('zoneBar');
    var dataNode = document.getElementById('charts-data');
    if (!genderCanvas || !zoneCanvas || !dataNode) return;

    var male = parseInt(dataNode.getAttribute('data-gender-male') || '0', 10);
    var female = parseInt(dataNode.getAttribute('data-gender-female') || '0', 10);
    var zoneLabels = [];
    var zoneValues = [];
    try {
      zoneLabels = JSON.parse(dataNode.getAttribute('data-zone-labels') || '[]');
      zoneValues = JSON.parse(dataNode.getAttribute('data-zone-values') || '[]');
    } catch(_) {}

    new Chart(genderCanvas.getContext('2d'), {
      type: 'pie',
      data: {
        labels: ['Nam', 'Nữ'],
        datasets: [{ data: [male, female], backgroundColor: ['#36A2EB', '#FF6384'] }]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    });

    new Chart(zoneCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: zoneLabels,
        datasets: [{ label: 'Giáo dân', data: zoneValues, backgroundColor: '#36A2EB' }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }
  function initYearPickers(root){
    var container = root || document;
    var currentYear = new Date().getFullYear();
    var minYear = currentYear - 110;
    var inputs = container.querySelectorAll('input.yearpicker');
    inputs.forEach(function(el){
      if (el.dataset.yearpickerInited === '1') return;
      if (typeof Datepicker === 'undefined') return;
      var initialYear = currentYear - 10;
      if (initialYear < minYear) initialYear = minYear;
      if (initialYear > currentYear) initialYear = currentYear;

      // Configure full date picking (day-month-year)
      var dp = new Datepicker(el, {
        buttonClass: 'btn btn-sm btn-outline-secondary',
        autohide: true,
        format: 'dd/mm/yyyy',
        pickLevel: 0, // day level
        minDate: new Date(minYear, 0, 1),
        maxDate: new Date(currentYear, 11, 31),
        defaultViewDate: new Date(initialYear, 0, 1)
      });
      el.dataset.yearpickerInited = '1';
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    // --- Zone Family Search & Add ---
    var familySearchInput = document.getElementById('zoneFamilySearchInput');
    var familySearchResults = document.getElementById('zoneFamilySearchResults');
    var addFamilyBtn = document.getElementById('zoneAddFamilyBtn');
    var selectedFamily = null;
    function getCurrentFamilyIds() {
      var ids = [];
      var rows = document.querySelectorAll('#zoneFamiliesTable tbody tr');
      rows.forEach(function(tr){
        var fid = tr.querySelector('button.action-family-view');
        if (fid && fid.dataset.fid) ids.push(parseInt(fid.dataset.fid, 10));
      });
      return ids;
    }
    if (familySearchInput && familySearchResults && addFamilyBtn) {
      familySearchInput.addEventListener('input', function(){
        var q = this.value.trim();
        familySearchResults.innerHTML = '';
        addFamilyBtn.disabled = true;
        selectedFamily = null;
        if (q.length < 2) return;
        fetch('/family/search?q=' + encodeURIComponent(q), { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
          .then(function(res){ return res.json(); })
          .then(function(json){
            familySearchResults.innerHTML = '';
            var families = getCurrentFamilyIds();
            var results = (json.results || []).filter(function(f){ return families.indexOf(f.id) === -1; });
            if (!results.length) {
              familySearchResults.innerHTML = '<div class="list-group-item text-muted">Không tìm thấy hoặc đã là gia đình trong khu.</div>';
              return;
            }
            results.forEach(function(f){
              var item = document.createElement('div');
              item.className = 'list-group-item list-group-item-action d-flex align-items-center py-2 px-2';
              item.style.cursor = 'pointer';
              item.dataset.familyId = f.id;
              item.innerHTML = `<span class="fw-semibold">${f.name}</span> <span class="text-muted ms-2">${f.address || ''}</span>`;
              item.addEventListener('click', function(){
                selectedFamily = f;
                addFamilyBtn.disabled = false;
                Array.from(familySearchResults.children).forEach(function(c){ c.classList.remove('active'); });
                item.classList.add('active');
                item.scrollIntoView({block:'nearest',behavior:'smooth'});
              });
              familySearchResults.appendChild(item);
            });
          });
      });
      addFamilyBtn.addEventListener('click', function(){
        if (!selectedFamily || !currentZoneId) return;
        addFamilyBtn.disabled = true;
        fetch('/zone/' + currentZoneId + '/add-family', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ family_id: selectedFamily.id })
        })
        .then(function(res){ return res.json(); })
        .then(function(json){
          if (json.ok && json.family) {
            // Sau khi thêm gia đình, reload lại danh sách gia đình
            fetch('/zone/' + currentZoneId, { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
              .then(function(res){ return res.json(); })
              .then(function(zoneJson){
                if (zoneJson.ok && zoneJson.details && Array.isArray(zoneJson.details.families)) {
                  var tbody = document.querySelector('#zoneFamiliesTable tbody');
                  if (tbody) {
                    tbody.innerHTML = '';
                    zoneJson.details.families.forEach(function(f){
                      var tr = document.createElement('tr');
                      tr.innerHTML = `
                        <td class="fw-semibold"><i class="fas fa-home text-info me-1"></i>${f.name}</td>
                        <td>${f.head}</td>
                        <td>${f.members}</td>
                        <td>${f.phone}</td>
                        <td>${f.address}</td>
                        <td class="text-end"><button class="btn btn-sm btn-outline-secondary action-family-view" data-fid="${f.id}" title="Xem chi tiết"><i class="fas fa-eye"></i></button></td>
                      `;
                      tbody.appendChild(tr);
                    });
                  }
                }
                // Reset chọn
                addFamilyBtn.disabled = true;
                selectedFamily = null;
                if (familySearchResults) familySearchResults.innerHTML = '';
                familySearchInput.value = '';
                // Update overview and left-list badges from returned zoneJson if available
                try {
                  var famCount = (zoneJson && zoneJson.details && zoneJson.details.overview && (zoneJson.details.overview.families_count != null)) ? parseInt(zoneJson.details.overview.families_count, 10) : null;
                  if (famCount != null && !isNaN(famCount)){
                    var ovEl = document.getElementById('ovFamiliesCount'); if (ovEl) ovEl.textContent = famCount;
                    var li = document.querySelector('#zoneList .list-group-item.active'); if (li){ var badge = li.querySelector('span[title="Số gia đình"]'); if (badge) badge.innerHTML = '<i class="fas fa-home me-1"></i>' + famCount; }
                  } else {
                    // Fallback: increment current displayed values
                    try { var ovEl2 = document.getElementById('ovFamiliesCount'); if (ovEl2){ var cur = parseInt(ovEl2.textContent||'0',10)||0; ovEl2.textContent = cur + 1; } } catch(_){}
                    try { var li2 = document.querySelector('#zoneList .list-group-item.active'); if (li2){ var badge2 = li2.querySelector('span[title="Số gia đình"]'); if (badge2){ var t = parseInt((badge2.textContent||'0').replace(/\D+/g,'')||'0',10)||0; badge2.innerHTML = '<i class="fas fa-home me-1"></i>' + (t + 1); } } } catch(_){}
                  }
                } catch(_){}
                // Success alert
                var alertPlaceholder = document.createElement('div');
                alertPlaceholder.className = 'alert alert-success alert-dismissible fade show m-3';
                alertPlaceholder.setAttribute('role', 'alert');
                alertPlaceholder.innerHTML = '<i class="fas fa-check-circle me-2"></i>Đã thêm gia đình vào khu.' +
                  '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                var mount = document.querySelector('.web-body') || document.body;
                mount.prepend(alertPlaceholder);
                setTimeout(function(){ if (window.bootstrap){ var bs = bootstrap.Alert.getOrCreateInstance(alertPlaceholder); bs.close(); } }, 4000);
              });
          } else {
            alert(json.message || 'Không thể thêm gia đình.');
          }
        })
        .catch(function(){ alert('Lỗi khi thêm gia đình.'); });
      });
    }
    // Đảm bảo các modal không bị kẹt trong stacking context: chuyển lên body
    (function(){
      ['modalEditPerson', 'modalConfirmDeletePerson', 'modalPersonDetail', 'modalCreatePerson'].forEach(function(id){
        var el = document.getElementById(id);
        if (el && el.parentNode && el.parentNode !== document.body){
          try { document.body.appendChild(el); } catch(_) {}
        }
      });
    })();

    initYearPickers(document);
    initPersonForm(document);
    initOverviewCharts();

    // --- Zone Member Search & Add ---
    var searchInput = document.getElementById('zoneMemberSearchInput');
    var searchResults = document.getElementById('zoneMemberSearchResults');
    var addBtn = document.getElementById('zoneAddMemberBtn');
    var currentZoneId = null;
    // Lấy zone hiện tại từ tab (dựa vào data hoặc URL)
    var zoneDetailTabs = document.getElementById('zoneDetailTabs');
    if (zoneDetailTabs && zoneDetailTabs.dataset.zoneId) {
      currentZoneId = parseInt(zoneDetailTabs.dataset.zoneId, 10);
    } else {
      // fallback: lấy từ active tab hoặc URL
      var active = document.querySelector('#zoneList .list-group-item.active a.action-zone-select');
      if (active) currentZoneId = parseInt(active.getAttribute('data-zone-id')||'0', 10);
    }

    // Lấy danh sách thành viên đã có trong khu
    function getCurrentMemberIds() {
      var ids = [];
      var rows = document.querySelectorAll('#zoneMembersTable tbody tr');
      rows.forEach(function(tr){
        var btn = tr.querySelector('.action-view-person');
        if (btn && btn.dataset.personId) ids.push(parseInt(btn.dataset.personId, 10));
      });
      return ids;
    }

    var selectedPerson = null;
    if (searchInput && searchResults && addBtn) {
      searchInput.addEventListener('input', function(){
        var q = this.value.trim();
        // Luôn xóa kết quả cũ trước khi search
        searchResults.innerHTML = '';
        addBtn.disabled = true;
        selectedPerson = null;
        if (q.length < 2) return;
        fetch('/person/search?q=' + encodeURIComponent(q), { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
          .then(function(res){ return res.json(); })
          .then(function(json){
            // Xóa kết quả cũ trước khi render mới
            searchResults.innerHTML = '';
            var members = getCurrentMemberIds();
            var results = (json.results || []).filter(function(p){ return members.indexOf(p.id) === -1; });
            if (!results.length) {
              searchResults.innerHTML = '<div class="list-group-item text-muted">Không tìm thấy hoặc đã là thành viên.</div>';
              return;
            }
            results.forEach(function(p){
              var g = (p.gender || '').toString().toLowerCase();
              var icon = (g === '1' || g === 'nữ' || g === 'nu' || g === 'female' || g === 'f') ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
              var item = document.createElement('div');
              item.className = 'list-group-item list-group-item-action d-flex align-items-center py-2 px-2';
              item.style.cursor = 'pointer';
              item.dataset.personId = p.id;
              item.innerHTML = `
                <img src="${icon}" alt="avatar" class="rounded-circle me-2" style="width:32px;height:32px;object-fit:cover;">
                <div class="flex-grow-1">
                  <span class="fw-semibold">${p.name}</span>
                  ${p.birth_year ? `<span class="text-muted ms-2">(${p.birth_year})</span>` : ''}
                </div>
              `;
              item.addEventListener('click', function(){
                selectedPerson = p;
                addBtn.disabled = false;
                Array.from(searchResults.children).forEach(function(c){ c.classList.remove('active'); });
                item.classList.add('active');
                // Focus vào item vừa chọn
                item.scrollIntoView({block:'nearest',behavior:'smooth'});
              });
              searchResults.appendChild(item);
            });
          });
      });

      addBtn.addEventListener('click', function(){
        if (!selectedPerson || !currentZoneId) return;
        addBtn.disabled = true;
        fetch('/zone/' + currentZoneId + '/add-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ person_id: selectedPerson.id })
        })
        .then(function(res){ return res.json(); })
        .then(function(json){
          if (json.ok && json.member) {
            // Sau khi thêm thành viên, gọi lại API lấy danh sách thành viên mới nhất
            fetch('/zone/' + currentZoneId, { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
              .then(function(res){ return res.json(); })
              .then(function(zoneJson){
                if (zoneJson.ok && zoneJson.details && Array.isArray(zoneJson.details.members)) {
                  var tbody = document.querySelector('#zoneMembersTable tbody');
                  if (tbody) {
                    tbody.innerHTML = '';
                    zoneJson.details.members.forEach(function(m){
                      var g = (m.gender || '').toString().toLowerCase();
                      var icon = (g === '1' || g === 'nữ' || g === 'nu' || g === 'female' || g === 'f') ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
                      var tr = document.createElement('tr');
                      tr.innerHTML = `
                        <td>
                          <div class="person-info">
                            <div class="person-avatar">
                              <img class="person-avatar-img" src="${icon}" alt="avatar">
                            </div>
                            <div class="person-details">
                              <div class="person-name">${m.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>${m.gender || ''}</td>
                        <td>${m.phone || ''}</td>
                        <td>${m.family || ''}</td>
                        <td class="text-end">
                          <a href="#" class="btn btn-sm btn-outline-secondary action-view-person" data-person-id="${m.id}" title="Xem chi tiết"><i class="fa-regular fa-eye"></i></a>
                        </td>
                      `;
                      tbody.appendChild(tr);
                    });
                  }
                }
                // Reset chọn
                addBtn.disabled = true;
                selectedPerson = null;
                var searchResultsEl = document.getElementById('zoneMemberSearchResults');
                if (searchResultsEl) searchResultsEl.innerHTML = '';
                document.getElementById('zoneMemberSearchInput').value = '';
                // Update overview and left-list members count from zoneJson when available
                try {
                  var memCount = (zoneJson && zoneJson.details && zoneJson.details.overview && (zoneJson.details.overview.members_count != null)) ? parseInt(zoneJson.details.overview.members_count, 10) : null;
                  if (memCount != null && !isNaN(memCount)){
                    var ovMem = document.getElementById('ovMembersCount'); if (ovMem) ovMem.textContent = memCount;
                    var li3 = document.querySelector('#zoneList .list-group-item.active'); if (li3){ var badge3 = li3.querySelector('span[title="Số thành viên"]'); if (badge3) badge3.innerHTML = '<i class="fas fa-users me-1"></i>' + memCount; }
                  } else {
                    try { var ovMem2 = document.getElementById('ovMembersCount'); if (ovMem2){ var curm = parseInt(ovMem2.textContent||'0',10)||0; ovMem2.textContent = curm + 1; } } catch(_){}
                    try { var li4 = document.querySelector('#zoneList .list-group-item.active'); if (li4){ var badge4 = li4.querySelector('span[title="Số thành viên"]'); if (badge4){ var tm = parseInt((badge4.textContent||'0').replace(/\D+/g,'')||'0',10)||0; badge4.innerHTML = '<i class="fas fa-users me-1"></i>' + (tm + 1); } } } catch(_){}
                  }
                } catch(_){}
                // Success alert
                var alertPlaceholder = document.createElement('div');
                alertPlaceholder.className = 'alert alert-success alert-dismissible fade show m-3';
                alertPlaceholder.setAttribute('role', 'alert');
                alertPlaceholder.innerHTML = '<i class="fas fa-check-circle me-2"></i>Đã thêm giáo dân vào khu.' +
                  '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                var mount = document.querySelector('.web-body') || document.body;
                mount.prepend(alertPlaceholder);
                setTimeout(function(){ if (window.bootstrap){ var bs = bootstrap.Alert.getOrCreateInstance(alertPlaceholder); bs.close(); } }, 4000);
              });
          } else {
            alert(json.message || 'Không thể thêm thành viên.');
          }
        })
        .catch(function(){ alert('Lỗi khi thêm thành viên.'); });
      });
    }

    // Action: View Person
    document.body.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a.action-view-person');
      if (!a) return;
      e.preventDefault();
      var pid = a.getAttribute('data-person-id');
      if (!pid) return;
      var body = document.getElementById('personDetailBody');
      if (body) body.innerHTML = 'Đang tải...';
      fetch('/person/' + encodeURIComponent(pid), { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
        .then(function(res){ return res.json(); })
        .then(function(json){
          if (!json || !json.ok) throw new Error('Load failed');
          var p = json.person || {};
          var fams = json.families || [];
          var zones = json.zones || [];
          var fullName = (p.full_name || [p.holy_name, p.last_name, p.first_name].filter(Boolean).join(' ')) || ('#' + (p.PID || ''));
          // Dynamic title
          var titleEl = document.querySelector('#modalPersonDetail .modal-title');
          if (titleEl) {
            titleEl.innerHTML = '<i class="fa-regular fa-user me-2"></i>' + fullName;
          }
          // Avatar/icon by gender
          var gstr = ((p.gender_label || p.gender || '') + '').toLowerCase();
          var icon = (gstr === '1' || gstr === 'nữ' || gstr === 'nu' || gstr === 'female' || gstr === 'f') ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
          var base = (window.BASE_URL || '/');

          // Build professional layout using template literals
          var deceasedBlock = p.date_Dead_fmt ? `
            <div class="col-md-6">
              <div class="card h-100 border-0 shadow-sm">
                <div class="card-body">
                  <div class="text-muted small mb-1"><i class="fa-regular fa-circle-xmark me-1 text-secondary"></i>Qua đời</div>
                  <div class="fs-6"><span class="badge bg-secondary"><i class="fa-regular fa-calendar me-1"></i>${p.date_Dead_fmt}</span></div>
                </div>
              </div>
            </div>` : '';

          var familyList = fams.length ? `
            <ul class="list-group list-group-flush">
              ${fams.map(function(f){
                var rel = f.relationship ? `<span class="badge bg-light text-dark ms-2">${f.relationship}</span>` : '';
                var addr = f.family_address ? `<div class="small text-muted"><i class="fa-regular fa-map me-1"></i>${f.family_address}</div>` : '';
                return `<li class="list-group-item d-flex justify-content-between align-items-start">
                  <div class="ms-2 me-auto">
                    <div class="fw-semibold">${(f.family_name || '—')}${rel ? ' ' + rel : ''}</div>${addr}
                  </div>
                </li>`;
              }).join('')}
            </ul>` : '<div class="text-muted">—</div>';

          var zoneList = zones.length ? `
            <ul class="list-group list-group-flush">
              ${zones.map(function(z){
                var holy = z.zone_holy_name ? `<span class=\"badge bg-light text-dark ms-2\">${z.zone_holy_name}</span>` : '';
                return `<li class="list-group-item"><span class="fw-semibold">${(z.zone_name || '—')}</span> ${holy}</li>`;
              }).join('')}
            </ul>` : '<div class="text-muted">—</div>';

            var isFemale = (gstr === '1' || gstr === 'nữ' || gstr === 'nu' || gstr === 'female' || gstr === 'f');
          var genderBadgeClass = isFemale ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary';
          var genderLabelText = p.gender_label || p.gender || '-';

          var html = `
            <div class="row g-3">
              <div class="col-12">
                <div class="d-flex align-items-center gap-3">
                  <img src="${base}${icon}" alt="avatar" style="width:56px;height:56px;object-fit:contain">
                  <div>
                    <div class="fs-5 mb-1">${fullName}</div>
                    <div class="small text-muted">
                      <span class="badge ${genderBadgeClass} me-2"><i class="fa-solid fa-venus-mars me-1"></i>${genderLabelText}</span>
                      <span class="badge bg-info-subtle text-info"><i class="fa-regular fa-id-card me-1"></i>Tuổi: ${(p.age != null ? p.age : '-')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card h-100 border-0 shadow-sm">
                  <div class="card-body">
                    <div class="text-muted small mb-1"><i class="fa-regular fa-user me-1 text-secondary"></i>Thông tin cơ bản</div>
                    <div class="mb-2"><i class="fa-regular fa-calendar me-2 text-secondary"></i><strong>Ngày sinh:</strong> ${(p.date_of_birth_fmt || '-')}</div>
                    <div><i class="fa-solid fa-phone me-2 text-secondary"></i><strong>Điện thoại:</strong> ${(p.phone || '-')}</div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card h-100 border-0 shadow-sm">
                  <div class="card-body">
                    <div class="text-muted small mb-1"><i class="fa-solid fa-church me-1 text-secondary"></i>Các bí tích</div>
                    <div class="row g-2">
                      <div class="col-12 col-sm-6"><i class="fa-solid fa-water me-2 text-primary"></i><strong>Rửa tội:</strong> ${(p.date_RT_fmt || '-')}</div>
                      <div class="col-12 col-sm-6"><i class="fa-solid fa-bread-slice me-2 text-info"></i><strong>Rước lễ:</strong> ${(p.date_RL_fmt || '-')}</div>
                      <div class="col-12 col-sm-6"><i class="fa-solid fa-dove me-2 text-purple"></i><strong>Thêm sức:</strong> ${(p.date_TS_fmt || '-')}</div>
                      <div class="col-12 col-sm-6"><i class="fa-solid fa-ring me-2 text-danger"></i><strong>Hôn phối:</strong> ${(p.date_HP_fmt || '-')}</div>
                    </div>
                  </div>
                </div>
              </div>
              ${deceasedBlock}
              <div class="col-md-6">
                <div class="card h-100 border-0 shadow-sm">
                  <div class="card-body">
                    <div class="text-muted small mb-1"><i class="fa-solid fa-house me-1 text-secondary"></i>Gia đình</div>
                    ${familyList}
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card h-100 border-0 shadow-sm">
                  <div class="card-body">
                    <div class="text-muted small mb-1"><i class="fa-solid fa-church me-1 text-secondary"></i>Giáo khu</div>
                    ${zoneList}
                  </div>
                </div>
              </div>
              <div class="col-12">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <div class="text-muted small mb-1"><i class="fa-regular fa-note-sticky me-1 text-secondary"></i>Ghi chú</div>
                    <div>${(p.note || '<span class="text-muted">—</span>')}</div>
                  </div>
                </div>
              </div>
            </div>`;
          if (body) body.innerHTML = html;
          var modalEl = document.getElementById('modalPersonDetail');
          if (modalEl && window.bootstrap){ bootstrap.Modal.getOrCreateInstance(modalEl).show(); }
        }).catch(function(){
          if (body) body.innerHTML = '<span class="text-danger">Không tải được dữ liệu.</span>';
        });
    });

    // Action: Edit Person
    document.body.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a.action-edit-person');
      if (!a) return;
      e.preventDefault();
      var pid = a.getAttribute('data-person-id');
      if (!pid) return;
      var modalEl = document.getElementById('modalEditPerson');
      var form = modalEl ? modalEl.querySelector('#personEditForm') : null;
      if (!modalEl || !form) return;
      // reset form state
      form.reset();
      form.classList.remove('was-validated');
      var deceasedWrap = modalEl.querySelector('#editDeceasedYearWrap');
      if (deceasedWrap) deceasedWrap.classList.add('d-none');
      var relWrap = modalEl.querySelector('#editRelationshipWrap');
      if (relWrap) relWrap.classList.add('d-none');

      fetch('/person/' + encodeURIComponent(pid), { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
        .then(function(res){ return res.json(); })
        .then(function(json){
          if (!json || !json.ok) throw new Error('Load failed');
          var p = json.person || {};
          var fams = json.families || [];
          var zones = json.zones || [];

          // Fill fields (ensure full_name does NOT include holy_name)
          // Prefer composing from last_name + first_name; if falling back to full_name, strip holy_name prefix if present.
          function escapeRegExp(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
          var lastFirst = [p.last_name, p.first_name].filter(Boolean).join(' ').trim();
          var full = (lastFirst || (p.full_name || '').trim());
          if (full && p.holy_name) {
            var holy = String(p.holy_name).trim();
            if (holy) {
              var re = new RegExp('^' + escapeRegExp(holy) + '(\s+|\s*\-|\s*\,)?', 'i');
              full = full.replace(re, '').trim();
            }
          }
          form.setAttribute('data-person-id', String(p.PID || pid));
          var holy = form.querySelector('[name="holy_name"]'); if (holy) holy.value = p.holy_name || '';
          var fn = form.querySelector('[name="full_name"]'); if (fn) fn.value = full || '';
          var gsel = form.querySelector('[name="gender"]');
          if (gsel) {
            // prefer raw numeric gender if present (1/0), otherwise map label to numeric
            var genderVal = '';
            if (typeof p.gender !== 'undefined' && p.gender !== null && p.gender !== '') {
              // prefer numeric coding if provided
              genderVal = String(p.gender);
            } else if (typeof p.gender_label === 'string' && p.gender_label !== '') {
              var gl = p.gender_label.trim().toLowerCase();
              // Map textual label to numeric: male -> '0', female -> '1'
              if (gl === 'nữ' || gl === 'nu' || gl.indexOf('nữ') === 0 || gl.indexOf('nu') === 0) {
                genderVal = '1';
              } else {
                genderVal = '0';
              }
            } else {
              genderVal = '0';
            }
            try { gsel.value = genderVal; } catch (err) { /* ignore if invalid */ }
          }
          var b = form.querySelector('[name="birth_year"]'); if (b) b.value = p.date_of_birth_fmt || '';
          var phone = form.querySelector('[name="phone"]'); if (phone) phone.value = p.phone || '';
          var notes = form.querySelector('[name="notes"]'); if (notes) notes.value = p.note || '';
          var bap = form.querySelector('[name="baptism_year"]'); if (bap) bap.value = p.date_RT_fmt || '';
          var com = form.querySelector('[name="communion_year"]'); if (com) com.value = p.date_RL_fmt || '';
          var con = form.querySelector('[name="confirmation_year"]'); if (con) con.value = p.date_TS_fmt || '';
          var mar = form.querySelector('[name="marriage_year"]'); if (mar) mar.value = p.date_HP_fmt || '';
          var dec = form.querySelector('[name="deceased_year"]'); if (dec) dec.value = p.date_Dead_fmt || '';
          var decSwitch = form.querySelector('#editIsDeceasedSwitch');
          if (decSwitch) {
            decSwitch.checked = !!p.date_Dead_fmt;
            if (deceasedWrap) deceasedWrap.classList.toggle('d-none', !decSwitch.checked);
          }
          var zoneSel = form.querySelector('[name="zone_id"]'); if (zoneSel) zoneSel.value = zones[0] && zones[0].ZID ? String(zones[0].ZID) : '';
          var famSel = form.querySelector('[name="family_id"]'); if (famSel) famSel.value = fams[0] && fams[0].FID ? String(fams[0].FID) : '';
          var relInput = form.querySelector('[name="relationship"]'); if (relInput) relInput.value = fams[0] && fams[0].relationship ? fams[0].relationship : '';
          if (relWrap) relWrap.classList.toggle('d-none', !(famSel && famSel.value));
          // Zone relationship prefill and visibility
          var zoneRelWrap = modalEl.querySelector('#editZoneRelationshipWrap');
          var zoneRelInput = form.querySelector('input[name="zone_relationship"]');
          if (zoneRelInput) zoneRelInput.value = zones[0] && zones[0].zone_relationship ? zones[0].zone_relationship : '';
          if (zoneRelWrap) zoneRelWrap.classList.toggle('d-none', !(zoneSel && zoneSel.value));

          // Show modal
          if (window.bootstrap && bootstrap.Modal) {
            var inst = bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: true, keyboard: true });
            inst.show();
          } else if (modalEl && modalEl.classList){
            modalEl.classList.add('show');
            modalEl.style.display = 'block';
            modalEl.removeAttribute('aria-hidden');
          }
        })
        .catch(function(){
          // fallback error alert
          var alertPlaceholder = document.createElement('div');
          alertPlaceholder.className = 'alert alert-danger alert-dismissible fade show m-3';
          alertPlaceholder.setAttribute('role', 'alert');
          alertPlaceholder.innerHTML = '<i class="fas fa-triangle-exclamation me-2"></i>Không thể tải dữ liệu.' +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
          var mount = document.querySelector('.web-body') || document.body;
          mount.prepend(alertPlaceholder);
        });
    });

    // Action: Delete Person
    document.body.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a.action-delete-person');
      if (!a) return;
      e.preventDefault();
      var pid = a.getAttribute('data-person-id');
      var name = a.getAttribute('data-person-name') || '';
      var nameEl = document.getElementById('deletePersonName');
      if (nameEl) nameEl.textContent = name;
      var btn = document.getElementById('btnConfirmDeletePerson');
      if (btn) btn.setAttribute('data-person-id', pid || '');
      var modalEl = document.getElementById('modalConfirmDeletePerson');
      if (modalEl && window.bootstrap && bootstrap.Modal){
        bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: true, keyboard: true }).show();
      } else if (modalEl && modalEl.classList){
        modalEl.classList.add('show');
        modalEl.style.display = 'block';
        modalEl.removeAttribute('aria-hidden');
      }
    });

    var btnDel = document.getElementById('btnConfirmDeletePerson');
    if (btnDel && !btnDel.dataset.boundDel){
      btnDel.addEventListener('click', function(){
        var pid = this.getAttribute('data-person-id');
        if (!pid) return;
        this.disabled = true;
        var self = this;
        fetch('/person/' + encodeURIComponent(pid) + '/delete', { method: 'POST', headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
          .then(function(res){ return res.json(); })
          .then(function(json){
            if (!json || !json.ok) throw new Error('Delete failed');
            // remove row from table
            var row = document.querySelector('.person-table tbody tr');
            // Prefer removing row matching id in "Mã: #ID" cell
            var rows = document.querySelectorAll('.person-table tbody tr');
            rows.forEach(function(tr){
              var code = tr.querySelector('td:nth-child(3) .text-muted');
              if (code && code.textContent && code.textContent.indexOf('#'+pid) !== -1){ tr.parentNode.removeChild(tr); }
            });
            var modalEl = document.getElementById('modalConfirmDeletePerson');
            if (modalEl && window.bootstrap){ bootstrap.Modal.getOrCreateInstance(modalEl).hide(); }
            // show success alert
            var alertPlaceholder = document.createElement('div');
            alertPlaceholder.className = 'alert alert-success alert-dismissible fade show m-3';
            alertPlaceholder.setAttribute('role', 'alert');
            alertPlaceholder.innerHTML = '<i class="fas fa-check-circle me-2"></i>Đã xoá giáo dân.' +
              '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
            var mount = document.querySelector('.web-body') || document.body;
            mount.prepend(alertPlaceholder);
            setTimeout(function(){ if (window.bootstrap){ var bs = bootstrap.Alert.getOrCreateInstance(alertPlaceholder); bs.close(); } }, 5000);
          }).catch(function(){
            // show error alert
            var alertPlaceholder = document.createElement('div');
            alertPlaceholder.className = 'alert alert-danger alert-dismissible fade show m-3';
            alertPlaceholder.setAttribute('role', 'alert');
            alertPlaceholder.innerHTML = '<i class="fas fa-triangle-exclamation me-2"></i>Không thể xoá.' +
              '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
            var mount = document.querySelector('.web-body') || document.body;
            mount.prepend(alertPlaceholder);
          }).finally(function(){ self.disabled = false; });
      });
      btnDel.dataset.boundDel = '1';
    }
  });

  // Toggle relationship field visibility in Edit modal
  document.addEventListener('change', function(e){
    if (e.target && e.target.matches('#modalEditPerson select[name="family_id"]')){
      var wrap = document.getElementById('editRelationshipWrap');
      if (wrap) wrap.classList.toggle('d-none', !(e.target.value && e.target.value.trim() !== ''));
    }
  });

  // Toggle deceased input in Edit modal
  (function(){
    var sw = document.getElementById('editIsDeceasedSwitch');
    var wrap = document.getElementById('editDeceasedYearWrap');
    if (sw && wrap && !sw.dataset.boundToggle){
      sw.addEventListener('change', function(){
        if (this.checked){ wrap.classList.remove('d-none'); }
        else { wrap.classList.add('d-none'); var i = wrap.querySelector('input[name="deceased_year"]'); if (i) i.value=''; }
      });
      sw.dataset.boundToggle = '1';
    }
  })();

  // Edit form submit handler
  (function(){
    var form = document.getElementById('personEditForm');
    if (!form || form.dataset.boundSubmit) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      e.stopPropagation();
      if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

      // validate deceased >= birth
      function extractYear(val){
        if (!val) return NaN;
        var s = (val || '').trim();
        var m = s.match(/^\d{4}$/);
        if (m) return parseInt(s,10);
        var parts = s.split(/[\/\-]/);
        if (parts.length === 3){ var yi = parseInt(parts[2],10); if (!isNaN(yi)) return yi; }
        return NaN;
      }
      var byEl = form.querySelector('input[name="birth_year"]');
      var dyEl = form.querySelector('input[name="deceased_year"]');
      if (byEl && dyEl && dyEl.value){
        var by = extractYear(byEl.value);
        var dy = extractYear(dyEl.value);
        if (!isNaN(by) && !isNaN(dy) && dy < by){ dyEl.classList.add('is-invalid'); return; } else { dyEl.classList.remove('is-invalid'); }
      }

      var pid = form.getAttribute('data-person-id');
      if (!pid) return;
      var submitBtn = form.querySelector('button[type="submit"]');
      var original = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn){ submitBtn.disabled = true; submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang lưu...'; }
      var fd = new FormData(form);
      fetch('/person/' + encodeURIComponent(pid) + '/update', { method: 'POST', body: fd, headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
        .then(function(res){ return res.json(); })
        .then(function(json){
          if (!json || !json.ok) throw new Error((json && json.errors && (json.errors.server || Object.values(json.errors)[0])) || 'Lưu thất bại');
          // Update row in table
          var pidStr = String(json.row && json.row.id ? json.row.id : pid);
          var tr = document.querySelector('.person-table tbody tr[data-row-id="' + pidStr + '"]');
          if (!tr){
            // Fallback: scan by code cell content "Mã: #ID"
            var rows = document.querySelectorAll('.person-table tbody tr');
            rows.forEach(function(r){
              var code = r.querySelector('td:nth-child(3) .text-muted');
              if (code && code.textContent && code.textContent.indexOf('#'+pidStr) !== -1){ tr = r; }
            });
          }
          if (tr){
            try { tr.setAttribute('data-row-id', pidStr); } catch(_) {}
            var base = (window.BASE_URL || '/');
            var g = (json.row.gender || '').toString().toLowerCase();
            // female when numeric '1' or textual female labels
            var icon = (g === '1' || g === 'nữ' || g === 'nu' || g === 'female' || g === 'f') ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
            var nameEl = tr.querySelector('.person-name'); if (nameEl) nameEl.textContent = json.row.name || nameEl.textContent;
            var avatar = tr.querySelector('.person-avatar-img'); if (avatar) avatar.setAttribute('src', base + icon);
            var meta = tr.querySelector('.person-meta'); if (meta) meta.innerHTML = '<span class="me-2"><i class="fa-solid fa-venus-mars me-1"></i>' + (json.row.gender || '-') + '</span><span><i class="fa-regular fa-calendar me-1"></i>' + (json.row.birth || '-') + '</span>';
            var linkTd = tr.querySelector('td:nth-child(4) .text-sm.text-muted');
            if (linkTd) linkTd.innerHTML = 'Gia đình: <span class="text-dark">' + (json.row.family || '—') + '</span><br>Giáo khu: <span class="text-dark">' + (json.row.zones || '—') + '</span>';
            var tdBap = tr.querySelector('td:nth-child(5)'); if (tdBap) tdBap.innerHTML = json.row.baptismDate ? ('<span class="baptism-date"><i class="fa-solid fa-water me-1 text-primary"></i><span class="text-primary">' + json.row.baptismDate + '</span></span>') : '<span class="text-muted opacity-50" title="Chưa có dữ liệu"><i class="fa-regular fa-circle fa-xs"></i></span>';
            var tdCom = tr.querySelector('td:nth-child(6)'); if (tdCom) tdCom.innerHTML = json.row.communionDate ? ('<span class="communion-date"><i class="fa-solid fa-bread-slice me-1 text-info"></i><span class="text-info">' + json.row.communionDate + '</span></span>') : '<span class="text-muted opacity-50" title="Chưa có dữ liệu"><i class="fa-regular fa-circle fa-xs"></i></span>';
            var tdCon = tr.querySelector('td:nth-child(7)'); if (tdCon) tdCon.innerHTML = json.row.confirmationDate ? ('<span class="confirmation-date"><i class="fa-solid fa-dove me-1 text-purple"></i><span class="text-purple">' + json.row.confirmationDate + '</span></span>') : '<span class="text-muted opacity-50" title="Chưa có dữ liệu"><i class="fa-regular fa-circle fa-xs"></i></span>';
            var tdMar = tr.querySelector('td:nth-child(8)'); if (tdMar) tdMar.innerHTML = json.row.marriageDate ? ('<span class="marriage-date"><i class="fa-solid fa-ring me-1 text-danger"></i><span class="text-danger">' + json.row.marriageDate + '</span></span>') : '<span class="text-muted opacity-50" title="Chưa có dữ liệu"><i class="fa-regular fa-circle fa-xs"></i></span>';
          }

          // Hide modal and show success alert
          var modalEl = document.getElementById('modalEditPerson');
          if (modalEl && window.bootstrap){ bootstrap.Modal.getOrCreateInstance(modalEl).hide(); }
          var alertPlaceholder = document.createElement('div');
          alertPlaceholder.className = 'alert alert-success alert-dismissible fade show m-3';
          alertPlaceholder.setAttribute('role', 'alert');
          alertPlaceholder.innerHTML = '<i class="fas fa-check-circle me-2"></i>Đã cập nhật thông tin giáo dân.' +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
          var mount = document.querySelector('.web-body') || document.body;
          mount.prepend(alertPlaceholder);
          setTimeout(function(){ if (window.bootstrap){ var bs = bootstrap.Alert.getOrCreateInstance(alertPlaceholder); bs.close(); } }, 5000);
        })
        .catch(function(err){
          var msg = (err && err.message) ? err.message : 'Không thể lưu thay đổi.';
          var alertPlaceholder = document.createElement('div');
          alertPlaceholder.className = 'alert alert-danger alert-dismissible fade show m-3';
          alertPlaceholder.setAttribute('role', 'alert');
          alertPlaceholder.innerHTML = '<i class="fas fa-triangle-exclamation me-2"></i>' + msg +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
          var mount = document.querySelector('.web-body') || document.body;
          mount.prepend(alertPlaceholder);
        })
        .finally(function(){ if (submitBtn){ submitBtn.disabled = false; submitBtn.innerHTML = original; } });
    });
    form.dataset.boundSubmit = '1';
  })();

  // Initialize pickers for elements inside a shown modal
  document.addEventListener('shown.bs.modal', function(e){
    initYearPickers(e.target);
    initPersonForm(e.target);
  });
})();
