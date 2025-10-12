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
                var icon = (g === 'nữ' || g === 'nu' || g === 'female' || g === 'f') ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
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
                          <li><a class="dropdown-item" href="#"><i class="fa-regular fa-eye me-2"></i>Xem</a></li>
                          <li><a class="dropdown-item" href="#"><i class="fa-regular fa-pen-to-square me-2"></i>Sửa</a></li>
                          <li><hr class="dropdown-divider"></li>
                          <li><a class="dropdown-item text-danger" href="#"><i class="fa-regular fa-trash-can me-2"></i>Xoá</a></li>
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

    // deceased toggle
    var deceasedSwitch = container.getElementById ? container.getElementById('isDeceasedSwitch') : document.getElementById('isDeceasedSwitch');
    var deceasedWrap = container.getElementById ? container.getElementById('deceasedYearWrap') : document.getElementById('deceasedYearWrap');
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
    initYearPickers(document);
    initPersonForm(document);
    initOverviewCharts();

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
          var icon = (gstr === 'nữ' || gstr === 'nu' || gstr === 'female' || gstr === 'f') ? 'images/icons/icon_female.png' : 'images/icons/icon_male.png';
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

          var isFemale = (gstr === 'nữ' || gstr === 'nu' || gstr === 'female' || gstr === 'f');
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
      if (modalEl && window.bootstrap){ bootstrap.Modal.getOrCreateInstance(modalEl).show(); }
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

  // Initialize pickers for elements inside a shown modal
  document.addEventListener('shown.bs.modal', function(e){
    initYearPickers(e.target);
    initPersonForm(e.target);
  });
})();
