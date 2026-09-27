ALTER TABLE persons ADD COLUMN birth_place TEXT CHECK (birth_place IS NULL OR length(birth_place) <= 255);
