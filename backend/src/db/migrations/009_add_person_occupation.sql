-- Nghề nghiệp là thông tin hành chính tùy chọn của giáo dân.

ALTER TABLE persons ADD COLUMN occupation TEXT CHECK (occupation IS NULL OR length(occupation) <= 120);
