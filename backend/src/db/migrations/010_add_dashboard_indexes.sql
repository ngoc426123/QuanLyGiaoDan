-- Chỉ mục phục vụ bảng điều khiển: sinh nhật theo tháng và rà số điện thoại trùng.

CREATE INDEX idx_persons_birth_month
  ON persons (substr(birth_date, 6, 2))
  WHERE deleted_at IS NULL AND death_date IS NULL AND birth_date IS NOT NULL;

CREATE INDEX idx_persons_phone
  ON persons (phone)
  WHERE deleted_at IS NULL AND phone IS NOT NULL;
