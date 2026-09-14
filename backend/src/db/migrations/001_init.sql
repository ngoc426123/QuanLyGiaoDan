-- 001_init.sql — Schema nền của Elecrusion (Quản lý giáo dân giáo xứ)
--
-- Nguồn đặc tả: project/database-schema.md §2. Migration tự chứa, chỉ SQL thuần,
-- không import code ứng dụng (storage-strategy.md §5.5).
-- ĐÃ PHÁT HÀNH — không bao giờ sửa file này. Cần vá thì viết 002_*.sql.

-- ── settings — cấu hình người dùng. Xoá cứng, không có deleted_at ──────────────
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ── zones — Giáo họ ───────────────────────────────────────────────────────────
CREATE TABLE zones (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  name_ascii TEXT NOT NULL,
  holy_name  TEXT CHECK (holy_name IS NULL OR length(holy_name) <= 75),
  note       TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- ── families — Gia đình / hộ ──────────────────────────────────────────────────
CREATE TABLE families (
  id         TEXT PRIMARY KEY,
  zone_id    TEXT NOT NULL REFERENCES zones (id) ON DELETE RESTRICT,
  name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  name_ascii TEXT NOT NULL,
  address    TEXT CHECK (address IS NULL OR length(address) <= 255),
  note       TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- ── persons — Giáo dân ────────────────────────────────────────────────────────
CREATE TABLE persons (
  id                   TEXT PRIMARY KEY,
  full_name            TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
  given_name           TEXT CHECK (given_name IS NULL OR length(given_name) <= 50),
  full_name_ascii      TEXT NOT NULL,
  given_name_ascii     TEXT,
  holy_name            TEXT CHECK (holy_name IS NULL OR length(holy_name) <= 75),
  gender               TEXT CHECK (gender IS NULL OR gender IN ('male', 'female')),
  birth_date           TEXT,
  baptism_date         TEXT,
  first_communion_date TEXT,
  confirmation_date    TEXT,
  marriage_date        TEXT,
  death_date           TEXT,
  phone                TEXT CHECK (phone IS NULL OR length(phone) <= 20),
  note                 TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  deleted_at           TEXT
);

-- ── family_members — Thành viên hộ (thực thể, không phải bảng nối thuần) ───────
CREATE TABLE family_members (
  id           TEXT PRIMARY KEY,
  family_id    TEXT NOT NULL REFERENCES families (id) ON DELETE RESTRICT,
  person_id    TEXT NOT NULL REFERENCES persons (id) ON DELETE RESTRICT,
  relationship TEXT NOT NULL CHECK (
    relationship IN (
      'head', 'spouse', 'child', 'parent', 'grandparent',
      'grandchild', 'sibling', 'relative', 'other'
    )
  ),
  from_date    TEXT NOT NULL,
  to_date      TEXT CHECK (to_date IS NULL OR to_date >= from_date),
  note         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  deleted_at   TEXT
);

-- ── Index ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_zones_deleted_at ON zones (deleted_at);
CREATE UNIQUE INDEX uq_zones_name ON zones (name) WHERE deleted_at IS NULL;
-- Sắp xếp và tìm kiếm đi trên cột bỏ dấu — database-conventions.md §1.2c.
CREATE INDEX idx_zones_name_ascii ON zones (name_ascii, deleted_at);

CREATE INDEX idx_families_zone_id ON families (zone_id, deleted_at);
CREATE INDEX idx_families_deleted_at ON families (deleted_at);
CREATE INDEX idx_families_name_ascii ON families (name_ascii, deleted_at);

CREATE INDEX idx_persons_full_name_ascii ON persons (full_name_ascii, deleted_at);
CREATE INDEX idx_persons_deleted_at ON persons (deleted_at);
-- Sắp xếp danh sách theo tên gọi. Dùng cột đã bỏ dấu vì collation BINARY của SQLite
-- xếp "Bé" trước "Ánh" — sai bảng chữ cái tiếng Việt.
CREATE INDEX idx_persons_given_name_ascii ON persons (given_name_ascii, deleted_at);
CREATE INDEX idx_persons_birth_date ON persons (birth_date)
  WHERE birth_date IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_persons_death_date ON persons (death_date)
  WHERE death_date IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_family_members_family_id ON family_members (family_id, deleted_at);
CREATE INDEX idx_family_members_person_id ON family_members (person_id, deleted_at);

-- Mỗi người đúng MỘT hộ hiện hành
CREATE UNIQUE INDEX uq_family_members_current ON family_members (person_id)
  WHERE to_date IS NULL AND deleted_at IS NULL;

-- Mỗi hộ đúng MỘT chủ hộ đang tại vị
CREATE UNIQUE INDEX uq_family_members_head ON family_members (family_id)
  WHERE relationship = 'head' AND to_date IS NULL AND deleted_at IS NULL;
