<style>
  :root{
    --bg:#f6f8fa;
    --card-bg:#fff;
    --text:#1f2328;
    --muted:#667085;
    --primary:#0d6efd;
    --primary-hover:#0b5ed7;
    --border:#d0d7de;
    --danger-bg:#fef2f2;
    --danger-border:#fda4a4;
    --warning-bg:#fff7e6;
    --warning-border:#ffd591;
    --shadow:0 1px 2px rgba(16,24,40,.06),0 1px 3px rgba(16,24,40,.1);
  }
  *,*::before,*::after{ box-sizing:border-box; }
  body{ margin:0; }
  .page{ min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); padding:24px; font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--text); }
  .card{ width:100%; max-width:720px; background:var(--card-bg); border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow); overflow:hidden; }
  .card-header{ padding:20px 24px; border-bottom:none; display:flex; align-items:center; gap:12px; background:var(--primary); color:#fff; }
  .badge{ display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:8px; background:rgba(255,255,255,.18); color:#fff; font-weight:700; border:1px solid rgba(255,255,255,.28); }
  .title{ margin:0; font-size:20px; font-weight:700; color:#fff; }
  .subtitle{ margin:2px 0 0; font-size:13px; color:rgba(255,255,255,.85); }
  .card-body{ padding:20px 24px; }
  .mb-0{ margin-bottom:0; }
  .mb-2{ margin-bottom:8px; }
  .mb-3{ margin-bottom:14px; }
  .mb-4{ margin-bottom:18px; }
  .form-label{ display:block; margin-bottom:6px; font-weight:600; font-size:14px; }
  .form-control,.form-select{ width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; background:#fff; font-size:14px; transition:border-color .15s, box-shadow .15s; }
  .form-control:focus,.form-select:focus{ outline:none; border-color:var(--primary); box-shadow:0 0 0 3px rgba(13,110,253,.12); }
  .text-muted{ color:var(--muted); font-size:12px; }
  .invalid .form-control,.invalid .form-select{ border-color:#e5484d; box-shadow:0 0 0 3px rgba(229,72,77,.12); }
  .field-error{ color:#b42318; font-size:12px; margin-top:6px; }
  .alert{ padding:12px 14px; border-radius:8px; margin-bottom:14px; border:1px solid; }
  .alert-warning{ background:var(--warning-bg); border-color:var(--warning-border); }
  .alert-danger{ background:var(--danger-bg); border-color:var(--danger-border); }
  .btn-row{ display:flex; gap:10px; justify-content:flex-end; }
  .btn{ padding:10px 14px; border:1px solid transparent; border-radius:8px; cursor:pointer; font-weight:600; font-size:14px; }
  .btn-primary{ background:var(--primary); color:#fff; }
  .btn-primary:hover{ background:var(--primary-hover); }
  .helper{ display:flex; justify-content:space-between; align-items:center; gap:8px; }
  @media (max-width: 520px){ .helper{ flex-direction:column; align-items:flex-start; } }
</style>
<div class="page">
  <div class="card">
    <div class="card-header">
      <div class="badge">⚙</div>
      <div>
        <h1 class="title">Cài đặt ban đầu</h1>
        <p class="subtitle">Thiết lập thông tin và dữ liệu mẫu cho hệ thống</p>
      </div>
    </div>
    <div class="card-body">

    <?php if (session('setup_warning')): ?>
        <div class="alert alert-warning"><?= esc(session('setup_warning')) ?></div>
    <?php endif; ?>

    <?php $errors = session('errors') ?: []; ?>

    <form method="post" action="<?= site_url('setup/install') ?>">
        <?= csrf_field() ?>
        <div class="mb-3 <?= isset($errors['church_name']) ? 'invalid' : '' ?>">
            <label for="church_name" class="form-label">Tên nhà thờ</label>
            <input type="text" id="church_name" name="church_name" class="form-control" value="<?= old('church_name') ?>" required aria-describedby="church_name_help" />
            <div id="church_name_help" class="text-muted">Ví dụ: Giáo xứ An Bình</div>
            <?php if (isset($errors['church_name'])): ?><div class="field-error"><?= esc($errors['church_name']) ?></div><?php endif; ?>
        </div>

        <div class="mb-3 <?= isset($errors['church_address']) ? 'invalid' : '' ?>">
            <label for="church_address" class="form-label">Địa chỉ nhà thờ</label>
            <input type="text" id="church_address" name="church_address" class="form-control" value="<?= old('church_address') ?>" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" aria-describedby="church_address_help" />
            <div id="church_address_help" class="text-muted">Bạn có thể cập nhật sau trong phần cài đặt.</div>
            <?php if (isset($errors['church_address'])): ?><div class="field-error"><?= esc($errors['church_address']) ?></div><?php endif; ?>
        </div>

        <div class="mb-3 <?= isset($errors['date_format']) ? 'invalid' : '' ?>">
            <label for="date_format" class="form-label">Định dạng ngày tháng</label>
            <select id="date_format" name="date_format" class="form-select" required>
                <option value="dd/mm/yyyy" <?= old('date_format')==='dd/mm/yyyy' ? 'selected' : '' ?>>dd/mm/yyyy</option>
                <option value="mm/dd/yyyy" <?= old('date_format')==='mm/dd/yyyy' ? 'selected' : '' ?>>mm/dd/yyyy</option>
            </select>
            <div class="text-muted">Định dạng hiển thị ngày trong giao diện.</div>
            <?php if (isset($errors['date_format'])): ?><div class="field-error"><?= esc($errors['date_format']) ?></div><?php endif; ?>
        </div>

        <div class="mb-4 <?= isset($errors['sample_persons']) ? 'invalid' : '' ?>">
            <label for="sample_persons" class="form-label">Số lượng người (dữ liệu mẫu)</label>
            <select id="sample_persons" name="sample_persons" class="form-select">
                <?php $opts = [0=>'Không thêm',20=>'20',50=>'50',100=>'100',200=>'200',500=>'500'];
                $old = old('sample_persons');
                foreach ($opts as $val=>$label): ?>
                    <option value="<?= $val ?>" <?= (string)$old===(string)$val? 'selected': '' ?>><?= $label ?></option>
                <?php endforeach; ?>
            </select>
            <div class="text-muted">Hệ thống sẽ tự sinh dữ liệu mẫu để bạn trải nghiệm nhanh.</div>
            <?php if (isset($errors['sample_persons'])): ?><div class="field-error"><?= esc($errors['sample_persons']) ?></div><?php endif; ?>
        </div>

        <div class="helper mb-0">
          <span class="text-muted">Bạn có thể thay đổi các thiết lập này sau khi cài đặt.</span>
          <div class="btn-row">
            <button type="submit" class="btn btn-primary">Cài đặt</button>
          </div>
        </div>
    </form>
    </div>
  </div>
</div>
