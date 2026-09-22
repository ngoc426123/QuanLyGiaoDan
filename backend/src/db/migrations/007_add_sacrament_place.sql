-- 007_add_sacrament_place.sql
-- Nơi cử hành áp dụng cho từng bí tích.

ALTER TABLE sacraments ADD COLUMN place TEXT CHECK (place IS NULL OR length(place) <= 255);
