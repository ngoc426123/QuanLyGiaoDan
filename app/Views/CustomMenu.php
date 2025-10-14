<?= $this->extend('layout') ?>

<?= $this->section('content') ?>
<div class="d-flex justify-content-center mb-4">
    <div class="w-100" style="max-width: 900px;">
        <h2 class="mb-1 text-center">Tuỳ chỉnh Menu</h2>
        <p class="text-muted text-center">Chỉnh sửa nội dung hiển thị khi người dùng click vào mục Tuỳ chỉnh trên menu.</p>
    </div>
</div>

<?php if (session()->getFlashdata('success')): ?>
    <div class="alert alert-success"><?php echo session()->getFlashdata('success'); ?></div>
<?php endif; ?>

<div class="d-flex justify-content-center">
    <div class="card border rounded p-3 bg-white w-100" style="max-width: 900px;">
        <form method="post" action="<?= site_url('custom-menu/save') ?>">
        <?= csrf_field() ?>
        <div class="table-responsive">
            <table class="table table-sm align-middle">
                <thead>
                    <tr>
                        <th>Khóa</th>
                        <th>Giá trị</th>
                        <th>Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($options as $opt): ?>
                        <?php $isExcluded = in_array($opt['key'], $excludedKeys ?? [], true); ?>
                        <tr>
                            <td style="width:25%">
                                <strong><?= esc($opt['key']) ?></strong>
                                <?php if ($isExcluded): ?>
                                    <div class="text-muted small">(Không chỉnh sửa)</div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <input type="hidden" name="id[]" value="<?= esc($opt['ID']) ?>">
                                <input type="text" name="value[<?= esc($opt['ID']) ?>]" class="form-control" value="<?= esc($opt['value']) ?>" <?= $isExcluded ? 'disabled' : '' ?> >
                            </td>
                            <td>
                                <input type="text" name="note[<?= esc($opt['ID']) ?>]" class="form-control" value="<?= esc($opt['note']) ?>" <?= $isExcluded ? 'disabled' : '' ?> >
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <hr>

        

        <h6>Thêm tuỳ chọn mới</h6>
        <div class="row g-2 align-items-end">
            <div class="col-md-4">
                <label class="form-label">Khóa</label>
                <input name="new_key" class="form-control" placeholder="vd: homepage_banner (tên khóa)">
            </div>
            <div class="col-md-4">
                <label class="form-label">Giá trị</label>
                <input name="new_value" class="form-control">
            </div>
            <div class="col-md-3">
                <label class="form-label">Ghi chú</label>
                <input name="new_note" class="form-control">
            </div>
            <div class="col-md-1 d-grid">
                <button class="btn btn-success">Thêm</button>
            </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-primary" type="submit">Lưu thay đổi</button>
            <a class="btn btn-outline-secondary" href="<?= site_url() ?>">Huỷ</a>
        </div>
        </form>
    </div>
</div>

<?= $this->endSection() ?>
