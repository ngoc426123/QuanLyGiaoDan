DROP TRIGGER persons_fts_update;
DROP TRIGGER families_fts_update;
CREATE TRIGGER persons_fts_update AFTER UPDATE ON persons BEGIN
  INSERT INTO persons_fts(persons_fts, rowid, full_name, holy_name, note)
    SELECT 'delete', old.rowid, old.full_name, old.holy_name, old.note WHERE old.deleted_at IS NULL;
  INSERT INTO persons_fts(rowid, full_name, holy_name, note)
    SELECT new.rowid, new.full_name, new.holy_name, new.note WHERE new.deleted_at IS NULL;
END;
CREATE TRIGGER families_fts_update AFTER UPDATE ON families BEGIN
  INSERT INTO families_fts(families_fts, rowid, name, address, note)
    SELECT 'delete', old.rowid, old.name, old.address, old.note WHERE old.deleted_at IS NULL;
  INSERT INTO families_fts(rowid, name, address, note)
    SELECT new.rowid, new.name, new.address, new.note WHERE new.deleted_at IS NULL;
END;
