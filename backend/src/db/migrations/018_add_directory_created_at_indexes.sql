-- Phục vụ sắp xếp mặc định mới nhất trước trên các danh sách nghiệp vụ.

CREATE INDEX idx_persons_created_at_active
  ON persons (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_families_created_at_active
  ON families (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_zones_created_at_active
  ON zones (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_marriages_created_at_active
  ON marriages (created_at DESC)
  WHERE deleted_at IS NULL;
