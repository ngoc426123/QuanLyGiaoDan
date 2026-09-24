-- Cho phép cấp chứng thư khi chưa có thông tin số sổ.
-- Giữ lại dữ liệu phát hành cũ, kể cả loại first_communion lịch sử.
CREATE TABLE certificate_issuances_new (
  id               TEXT PRIMARY KEY,
  person_id        TEXT NOT NULL REFERENCES persons (id) ON DELETE RESTRICT,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('baptism', 'first_communion', 'confirmation', 'marriage')),
  source_id        TEXT NOT NULL,
  register_book    TEXT CHECK (register_book IS NULL OR length(register_book) <= 80),
  register_page    TEXT CHECK (register_page IS NULL OR length(register_page) <= 80),
  register_entry   TEXT CHECK (register_entry IS NULL OR length(register_entry) <= 80),
  person_full_name TEXT NOT NULL,
  issued_at        TEXT NOT NULL,
  created_at       TEXT NOT NULL
);

INSERT INTO certificate_issuances_new (
  id, person_id, certificate_type, source_id, register_book, register_page, register_entry,
  person_full_name, issued_at, created_at
)
SELECT
  id, person_id, certificate_type, source_id,
  NULLIF(register_book, ''), NULLIF(register_page, ''), NULLIF(register_entry, ''),
  person_full_name, issued_at, created_at
FROM certificate_issuances;

DROP TABLE certificate_issuances;
ALTER TABLE certificate_issuances_new RENAME TO certificate_issuances;

CREATE INDEX idx_certificate_issuances_created_at
  ON certificate_issuances (created_at DESC);
CREATE INDEX idx_certificate_issuances_person_id
  ON certificate_issuances (person_id, created_at DESC);
