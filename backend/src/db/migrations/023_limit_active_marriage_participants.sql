-- 023_limit_active_marriage_participants.sql
-- Mỗi hôn phối có đúng hai đương sự đang hoạt động.

UPDATE marriage_participants
SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      row_number() OVER (PARTITION BY marriage_id ORDER BY created_at, rowid) AS participant_order
    FROM marriage_participants
    WHERE deleted_at IS NULL
  )
  WHERE participant_order > 2
);

CREATE TRIGGER marriage_participants_limit_insert
BEFORE INSERT ON marriage_participants
WHEN NEW.deleted_at IS NULL AND (
  SELECT count(*) FROM marriage_participants
  WHERE marriage_id = NEW.marriage_id AND deleted_at IS NULL
) >= 2
BEGIN
  SELECT RAISE(ABORT, 'Mỗi hôn phối chỉ có hai đương sự');
END;

CREATE TRIGGER marriage_participants_limit_restore
BEFORE UPDATE OF deleted_at ON marriage_participants
WHEN NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL AND (
  SELECT count(*) FROM marriage_participants
  WHERE marriage_id = NEW.marriage_id AND deleted_at IS NULL
) >= 2
BEGIN
  SELECT RAISE(ABORT, 'Mỗi hôn phối chỉ có hai đương sự');
END;
