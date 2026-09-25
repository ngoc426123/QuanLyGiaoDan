-- P22: Một danh mục persons cho cả giáo dân trong xứ và người ngoài xứ.
ALTER TABLE persons ADD COLUMN person_type TEXT NOT NULL DEFAULT 'parish'
  CHECK (person_type IN ('parish', 'external'));
ALTER TABLE persons ADD COLUMN parish_name TEXT
  CHECK (parish_name IS NULL OR length(parish_name) <= 120);
ALTER TABLE persons ADD COLUMN diocese_name TEXT
  CHECK (diocese_name IS NULL OR length(diocese_name) <= 120);
ALTER TABLE persons ADD COLUMN father_name TEXT
  CHECK (father_name IS NULL OR length(father_name) <= 120);
ALTER TABLE persons ADD COLUMN mother_name TEXT
  CHECK (mother_name IS NULL OR length(mother_name) <= 120);
CREATE INDEX idx_persons_type_deleted_at ON persons (person_type, deleted_at);

-- Mỗi người phối ngẫu ngoài xứ cũ trở thành một hồ sơ person external riêng.
INSERT INTO persons (
  id, full_name, given_name, full_name_ascii, given_name_ascii, holy_name, gender, birth_date,
  death_date, phone, note, created_at, updated_at, deleted_at, email, secondary_phone,
  residence_status, pastoral_status, pastoral_note, source, occupation, person_type,
  parish_name, diocese_name, father_name, mother_name
)
SELECT
  mp.id, mp.full_name, NULL, mp.full_name_ascii, NULL, mp.holy_name, NULL, mp.birth_date,
  NULL, NULL, NULL, mp.created_at, mp.updated_at, mp.deleted_at, NULL, NULL,
  NULL, NULL, NULL, 'transferred', NULL, 'external',
  mp.parish_name, mp.diocese_name, mp.father_name, mp.mother_name
FROM marriage_participants mp
WHERE mp.person_id IS NULL;

INSERT INTO sacraments (id, person_id, type, date, minister, place, created_at, updated_at, deleted_at)
SELECT lower(hex(randomblob(16))), mp.id, 'baptism', mp.baptism_date, NULL, mp.baptism_place,
  mp.created_at, mp.updated_at, mp.deleted_at
FROM marriage_participants mp
WHERE mp.person_id IS NULL AND mp.baptism_date IS NOT NULL;
INSERT INTO sacraments (id, person_id, type, date, minister, place, created_at, updated_at, deleted_at)
SELECT lower(hex(randomblob(16))), mp.id, 'confirmation', mp.confirmation_date, NULL, mp.confirmation_place,
  mp.created_at, mp.updated_at, mp.deleted_at
FROM marriage_participants mp
WHERE mp.person_id IS NULL AND mp.confirmation_date IS NOT NULL;

CREATE TABLE marriage_participants_new (
  id TEXT PRIMARY KEY,
  marriage_id TEXT NOT NULL REFERENCES marriages (id) ON DELETE RESTRICT,
  person_id TEXT NOT NULL REFERENCES persons (id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
INSERT INTO marriage_participants_new (id, marriage_id, person_id, created_at, updated_at, deleted_at)
SELECT id, marriage_id, COALESCE(person_id, id), created_at, updated_at, deleted_at
FROM marriage_participants;
DROP TABLE marriage_participants;
ALTER TABLE marriage_participants_new RENAME TO marriage_participants;
CREATE INDEX idx_marriage_participants_marriage_id ON marriage_participants (marriage_id, deleted_at);
CREATE INDEX idx_marriage_participants_person_id ON marriage_participants (person_id, deleted_at);

CREATE TABLE person_parents (
  id TEXT PRIMARY KEY,
  child_person_id TEXT NOT NULL REFERENCES persons (id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('father', 'mother')),
  parent_person_id TEXT NOT NULL REFERENCES persons (id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  CHECK (child_person_id <> parent_person_id)
);
CREATE INDEX idx_person_parents_child ON person_parents (child_person_id, deleted_at);
CREATE INDEX idx_person_parents_parent ON person_parents (parent_person_id, deleted_at);
CREATE UNIQUE INDEX uq_person_parents_role ON person_parents (child_person_id, role)
  WHERE deleted_at IS NULL;

ALTER TABLE certificate_issuances ADD COLUMN snapshot_json TEXT;
