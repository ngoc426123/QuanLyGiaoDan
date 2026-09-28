-- 022_add_marriage_activity_logs.sql
-- Mở rộng nhật ký nghiệp vụ để Thùng rác có thể ghi nhận hôn phối được khôi phục.

DROP INDEX idx_activity_logs_entity_created_at;

ALTER TABLE activity_logs RENAME TO activity_logs_old;

CREATE TABLE activity_logs (
  id          TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('zone', 'family', 'person', 'family_member', 'marriage')),
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('created', 'updated', 'removed', 'restored')),
  changes     TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL
);

INSERT INTO activity_logs (id, entity_type, entity_id, action, changes, created_at)
SELECT id, entity_type, entity_id, action, changes, created_at FROM activity_logs_old;

DROP TABLE activity_logs_old;

CREATE INDEX idx_activity_logs_entity_created_at
  ON activity_logs (entity_type, entity_id, created_at DESC);
