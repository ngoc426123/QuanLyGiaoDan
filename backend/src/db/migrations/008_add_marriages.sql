-- Hôn phối là bản ghi chung của đúng hai giáo dân; không lưu lặp theo từng hồ sơ.

CREATE TABLE marriages (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL,
  minister   TEXT CHECK (minister IS NULL OR length(minister) <= 120),
  place      TEXT CHECK (place IS NULL OR length(place) <= 255),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE marriage_participants (
  id          TEXT PRIMARY KEY,
  marriage_id TEXT NOT NULL REFERENCES marriages (id) ON DELETE RESTRICT,
  person_id   TEXT NOT NULL REFERENCES persons (id) ON DELETE RESTRICT,
  full_name   TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT
);

CREATE INDEX idx_marriage_participants_marriage_id
  ON marriage_participants (marriage_id, deleted_at);
CREATE UNIQUE INDEX uq_marriage_participants_person_id
  ON marriage_participants (person_id) WHERE deleted_at IS NULL;
