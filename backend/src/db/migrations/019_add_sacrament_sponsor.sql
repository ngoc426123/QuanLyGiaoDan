ALTER TABLE sacraments ADD COLUMN sponsor TEXT CHECK (sponsor IS NULL OR length(sponsor) <= 120);
