<style>
.container { max-width: 640px; margin: 24px auto; font-family: system-ui, Arial, sans-serif; }
.mb-3 { margin-bottom: 12px; }
.form-label { display:block; margin-bottom: 6px; font-weight: 600; }
.form-control, .form-select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.btn { padding: 8px 14px; border: 1px solid transparent; border-radius: 4px; cursor:pointer; }
.btn-primary { background:#0d6efd; color:#fff; }
.alert { padding: 10px; border-radius: 4px; margin-bottom: 12px; }
.alert-warning { background: #fff3cd; border: 1px solid #ffe69c; }
.alert-danger { background: #f8d7da; border: 1px solid #f1aeb5; }
.form-check { display:flex; align-items:center; gap:8px; }
</style>
<div class="container">
    <h2>Cài đặt ban đầu</h2>

    <?php if (session('setup_warning')): ?>
        <div class="alert alert-warning"><?= esc(session('setup_warning')) ?></div>
    <?php endif; ?>

    <?php if (session('errors')): ?>
        <div class="alert alert-danger">
            <ul>
                <?php foreach (session('errors') as $err): ?>
                    <li><?= esc($err) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <form method="post" action="<?= site_url('setup/install') ?>">
        <?= csrf_field() ?>
        <div class="mb-3">
            <label for="church_name" class="form-label">Tên nhà thờ</label>
            <input type="text" id="church_name" name="church_name" class="form-control" value="<?= old('church_name') ?>" required />
        </div>

        <div class="mb-3">
            <label for="church_address" class="form-label">Địa chỉ nhà thờ</label>
            <input type="text" id="church_address" name="church_address" class="form-control" value="<?= old('church_address') ?>" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
        </div>

        <div class="mb-3">
            <label for="date_format" class="form-label">Định dạng ngày tháng</label>
            <select id="date_format" name="date_format" class="form-select" required>
                <option value="dd/mm/yyyy" <?= old('date_format')==='dd/mm/yyyy' ? 'selected' : '' ?>>dd/mm/yyyy</option>
                <option value="mm/dd/yyyy" <?= old('date_format')==='mm/dd/yyyy' ? 'selected' : '' ?>>mm/dd/yyyy</option>
            </select>
        </div>

        <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" value="1" id="sample_data" name="sample_data" <?= old('sample_data') ? 'checked' : '' ?>>
            <label class="form-check-label" for="sample_data">
                Thêm dữ liệu mẫu
            </label>
        </div>

        <button type="submit" class="btn btn-primary">Cài đặt</button>
    </form>
</div>
