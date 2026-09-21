-- 005_add_activity_logs.sql — nhật ký thay đổi nghiệp vụ, append-only.
CREATE TABLE activity_logs (
  id          TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('zone', 'family', 'person', 'family_member')),
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('created', 'updated', 'removed', 'restored')),
  changes     TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_activity_logs_entity_created_at
  ON activity_logs (entity_type, entity_id, created_at DESC);
