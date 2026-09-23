CREATE TABLE certificate_issuances (
  id               TEXT PRIMARY KEY,
  person_id        TEXT NOT NULL REFERENCES persons (id) ON DELETE RESTRICT,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('baptism', 'first_communion', 'confirmation', 'marriage')),
  source_id        TEXT NOT NULL,
  register_book    TEXT NOT NULL CHECK (length(register_book) BETWEEN 1 AND 80),
  register_page    TEXT NOT NULL CHECK (length(register_page) BETWEEN 1 AND 80),
  register_entry   TEXT NOT NULL CHECK (length(register_entry) BETWEEN 1 AND 80),
  person_full_name TEXT NOT NULL,
  issued_at        TEXT NOT NULL,
  created_at       TEXT NOT NULL
);

CREATE INDEX idx_certificate_issuances_created_at
  ON certificate_issuances (created_at DESC);
CREATE INDEX idx_certificate_issuances_person_id
  ON certificate_issuances (person_id, created_at DESC);
