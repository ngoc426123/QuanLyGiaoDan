// Global app script: init year-only datepickers site-wide
(function(){
  // Person modal logic: handle form submit, validation, and deceased toggle
  function initPersonForm(root){
    var container = root || document;
    var form = container.getElementById ? container.getElementById('personCreateForm') : document.getElementById('personCreateForm');
    if (!form) return;

    // submit handler (bind once per form)
    if (!form.dataset.boundSubmit) {
      form.addEventListener('submit', function(e){
        e.preventDefault();
        e.stopPropagation();

        if (form.checkValidity()){
          // deceased year >= birth year
          var birthYearEl = form.querySelector('input[name="birth_year"]');
          var deceasedYearEl = form.querySelector('input[name="deceased_year"]');
          if (deceasedYearEl && deceasedYearEl.value){
            var by = parseInt((birthYearEl && birthYearEl.value || '').trim(), 10);
            var dy = parseInt(deceasedYearEl.value.trim(), 10);
            if (!isNaN(by) && !isNaN(dy) && dy < by){
              deceasedYearEl.classList.add('is-invalid');
              return; // stop submit
            } else {
              deceasedYearEl.classList.remove('is-invalid');
            }
          }

          // Mock save: close modal and reset form
          var modalEl = document.getElementById('modalCreatePerson');
          if (modalEl && window.bootstrap){
            var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.hide();
          }
          form.reset();
          form.classList.remove('was-validated');

          // success alert
          var alertPlaceholder = document.createElement('div');
          alertPlaceholder.className = 'alert alert-success alert-dismissible fade show m-3';
          alertPlaceholder.setAttribute('role', 'alert');
          alertPlaceholder.innerHTML = '<i class="fas fa-check-circle me-2"></i>Đã lưu thông tin (mô phỏng). Kết nối CSDL sẽ được bổ sung sau.' +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
          var mount = document.querySelector('.web-body') || document.body;
          mount.prepend(alertPlaceholder);
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
      // clamp to allowed range
      if (initialYear < minYear) initialYear = minYear;
      if (initialYear > currentYear) initialYear = currentYear;

      var dp = new Datepicker(el, {
        buttonClass: 'btn btn-sm btn-outline-secondary',
        autohide: true,
        format: 'yyyy',
        minView: 2,
        maxView: 2,
        pickLevel: 2,
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
  });

  // Initialize pickers for elements inside a shown modal
  document.addEventListener('shown.bs.modal', function(e){
    initYearPickers(e.target);
    initPersonForm(e.target);
  });
})();
