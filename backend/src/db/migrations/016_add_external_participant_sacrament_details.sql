-- Bổ sung thông tin bí tích và gia đình cho người phối ngẫu ngoài giáo xứ.
ALTER TABLE marriage_participants ADD COLUMN baptism_date TEXT;
ALTER TABLE marriage_participants ADD COLUMN baptism_place TEXT
  CHECK (baptism_place IS NULL OR length(baptism_place) <= 255);
ALTER TABLE marriage_participants ADD COLUMN confirmation_date TEXT;
ALTER TABLE marriage_participants ADD COLUMN confirmation_place TEXT
  CHECK (confirmation_place IS NULL OR length(confirmation_place) <= 255);
ALTER TABLE marriage_participants ADD COLUMN father_name TEXT
  CHECK (father_name IS NULL OR length(father_name) <= 120);
ALTER TABLE marriage_participants ADD COLUMN mother_name TEXT
  CHECK (mother_name IS NULL OR length(mother_name) <= 120);
