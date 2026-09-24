-- Cho phép ghi nhận người phối ngẫu không thuộc giáo xứ mà không tạo hồ sơ giáo dân giả.
CREATE TABLE marriage_participants_new (
  id             TEXT PRIMARY KEY,
  marriage_id    TEXT NOT NULL REFERENCES marriages (id) ON DELETE RESTRICT,
  person_id      TEXT REFERENCES persons (id) ON DELETE RESTRICT,
  full_name      TEXT NOT NULL CHECK (length(full_name) BETWEEN 1 AND 120),
  full_name_ascii TEXT NOT NULL CHECK (length(full_name_ascii) BETWEEN 1 AND 120),
  is_external    INTEGER NOT NULL DEFAULT 0 CHECK (is_external IN (0, 1)),
  holy_name      TEXT CHECK (holy_name IS NULL OR length(holy_name) <= 75),
  birth_date     TEXT,
  parish_name    TEXT CHECK (parish_name IS NULL OR length(parish_name) <= 120),
  diocese_name   TEXT CHECK (diocese_name IS NULL OR length(diocese_name) <= 120),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  deleted_at     TEXT,
  CHECK ((is_external = 1 AND person_id IS NULL) OR (is_external = 0 AND person_id IS NOT NULL))
);

INSERT INTO marriage_participants_new (
  id, marriage_id, person_id, full_name, full_name_ascii, is_external,
  created_at, updated_at, deleted_at
)
SELECT
  mp.id, mp.marriage_id, mp.person_id, mp.full_name,
  COALESCE(p.full_name_ascii, lower(mp.full_name)), 0,
  mp.created_at, mp.updated_at, mp.deleted_at
FROM marriage_participants mp
JOIN persons p ON p.id = mp.person_id;

DROP TABLE marriage_participants;
ALTER TABLE marriage_participants_new RENAME TO marriage_participants;

CREATE INDEX idx_marriage_participants_marriage_id
  ON marriage_participants (marriage_id, deleted_at);
CREATE UNIQUE INDEX uq_marriage_participants_person_id
  ON marriage_participants (person_id) WHERE deleted_at IS NULL AND person_id IS NOT NULL;
CREATE INDEX idx_marriage_participants_name
  ON marriage_participants (full_name_ascii, deleted_at);
