CREATE TRIGGER persons_fts_delete AFTER DELETE ON persons BEGIN
  INSERT INTO persons_fts(persons_fts, rowid, full_name, holy_name, note)
    VALUES ('delete', old.rowid, old.full_name, old.holy_name, old.note);
END;
CREATE TRIGGER families_fts_delete AFTER DELETE ON families BEGIN
  INSERT INTO families_fts(families_fts, rowid, name, address, note)
    VALUES ('delete', old.rowid, old.name, old.address, old.note);
END;
