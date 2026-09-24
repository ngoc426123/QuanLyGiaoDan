-- Cho phép lưu nhiều hôn phối trong lịch sử của cùng một giáo dân.
DROP INDEX IF EXISTS uq_marriage_participants_person_id;

ALTER TABLE marriages ADD COLUMN status TEXT NOT NULL DEFAULT 'married'
  CHECK (status IN ('married', 'annulled'));
ALTER TABLE marriages ADD COLUMN note TEXT
  CHECK (note IS NULL OR length(note) <= 1000);
