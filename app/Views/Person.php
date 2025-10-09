<!-- Bảng liệt kê thông tin Giáo dân -->
<div class="card mt-4">
  <div class="card-header bg-white fw-bold text-primary">Danh sách Giáo dân</div>
  <div class="card-body p-0">
    <div class="table-responsive">
      <table class="table table-bordered table-hover mb-0 table-giaodan">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Họ tên</th>
            <th>Giới tính</th>
            <th>Ngày sinh</th>
            <th>Địa chỉ</th>
            <th>Điện thoại</th>
            <th>Email</th>
            <th>Gia đình</th>
            <th>Giáo khu</th>
            <th>Ngày rửa tội</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          <?php for ($i = 1; $i <= 20; $i++): ?>
          <tr>
            <td><?= $i ?></td>
            <td>Nguyễn Văn A</td>
            <td>Nam</td>
            <td>01/01/1990</td>
            <td>123 Đường ABC</td>
            <td>0901234567</td>
            <td>email@example.com</td>
            <td>Gia đình 1</td>
            <td>Giáo khu 1</td>
            <td>02/02/1990</td>
            <td>Không có</td>
          </tr>
          <?php endfor; ?>
        </tbody>
      </table>
    </div>
    <!-- Component phân trang -->
    <div class="d-flex justify-content-end p-3">
      <nav>
        <ul class="pagination mb-0">
          <li class="page-item disabled"><a class="page-link" href="#">Trước</a></li>
          <li class="page-item active"><a class="page-link" href="#">1</a></li>
          <li class="page-item"><a class="page-link" href="#">2</a></li>
          <li class="page-item"><a class="page-link" href="#">3</a></li>
          <li class="page-item"><a class="page-link" href="#">Sau</a></li>
        </ul>
      </nav>
    </div>
  </div>
</div>
