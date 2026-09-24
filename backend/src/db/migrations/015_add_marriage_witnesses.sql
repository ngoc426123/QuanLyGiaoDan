-- Lưu tên hai người chứng hôn phối trên từng hồ sơ hôn phối.
ALTER TABLE marriages ADD COLUMN witness_one TEXT
  CHECK (witness_one IS NULL OR length(witness_one) <= 120);
ALTER TABLE marriages ADD COLUMN witness_two TEXT
  CHECK (witness_two IS NULL OR length(witness_two) <= 120);
