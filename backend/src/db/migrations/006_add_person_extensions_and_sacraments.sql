-- 006_add_person_extensions_and_sacraments.sql
-- Bổ sung hồ sơ giáo dân và chuyển các ngày bí tích cũ sang bảng riêng.

ALTER TABLE persons ADD COLUMN email TEXT CHECK (email IS NULL OR length(email) <= 254);
ALTER TABLE persons ADD COLUMN secondary_phone TEXT CHECK (secondary_phone IS NULL OR length(secondary_phone) <= 20);
ALTER TABLE persons ADD COLUMN residence_status TEXT CHECK (
  residence_status IS NULL OR residence_status IN ('permanent', 'temporary', 'moved_away')
);
ALTER TABLE persons ADD COLUMN pastoral_status TEXT CHECK (
  pastoral_status IS NULL OR pastoral_status IN ('ordinary', 'catechism', 'catechist', 'needs_visit')
);
ALTER TABLE persons ADD COLUMN pastoral_note TEXT;
ALTER TABLE persons ADD COLUMN source TEXT CHECK (
  source IS NULL OR source IN ('manual', 'csv_import', 'transferred', 'restored')
);

CREATE TABLE sacraments (
  id         TEXT PRIMARY KEY,
  person_id  TEXT NOT NULL REFERENCES persons (id) ON DELETE RESTRICT,
  type       TEXT NOT NULL CHECK (type IN ('baptism', 'first_communion', 'confirmation', 'marriage')),
  date       TEXT NOT NULL,
  minister   TEXT CHECK (minister IS NULL OR length(minister) <= 120),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_sacraments_person_id ON sacraments (person_id, deleted_at);
CREATE INDEX idx_sacraments_date ON sacraments (date) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_sacraments_person_type ON sacraments (person_id, type)
  WHERE deleted_at IS NULL;

-- Các cột ngày cũ được giữ trong bảng vật lý để tương thích bản đã phát hành, nhưng mọi
-- đường chạy mới chỉ đọc/ghi `sacraments`. ID ngẫu nhiên không lộ chi tiết dữ liệu.
INSERT INTO sacraments (id, person_id, type, date, minister, created_at, updated_at, deleted_at)
SELECT lower(hex(randomblob(16))), id, 'baptism', baptism_date, NULL, created_at, updated_at, NULL
FROM persons WHERE baptism_date IS NOT NULL;
INSERT INTO sacraments (id, person_id, type, date, minister, created_at, updated_at, deleted_at)
SELECT lower(hex(randomblob(16))), id, 'first_communion', first_communion_date, NULL, created_at, updated_at, NULL
FROM persons WHERE first_communion_date IS NOT NULL;
INSERT INTO sacraments (id, person_id, type, date, minister, created_at, updated_at, deleted_at)
SELECT lower(hex(randomblob(16))), id, 'confirmation', confirmation_date, NULL, created_at, updated_at, NULL
FROM persons WHERE confirmation_date IS NOT NULL;
INSERT INTO sacraments (id, person_id, type, date, minister, created_at, updated_at, deleted_at)
SELECT lower(hex(randomblob(16))), id, 'marriage', marriage_date, NULL, created_at, updated_at, NULL
FROM persons WHERE marriage_date IS NOT NULL;
