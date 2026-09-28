CREATE TABLE suggestion_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('holy_name', 'birth_place', 'parish', 'priest', 'diocese')),
  value TEXT NOT NULL CHECK (length(value) BETWEEN 1 AND 120),
  value_ascii TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_suggestion_items_category ON suggestion_items (category, sort_order, value_ascii, deleted_at);
CREATE UNIQUE INDEX uq_suggestion_items_value
  ON suggestion_items (category, value_ascii)
  WHERE deleted_at IS NULL;
