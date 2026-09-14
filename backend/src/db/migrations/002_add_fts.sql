CREATE VIRTUAL TABLE persons_fts USING fts5(
  full_name, holy_name, note,
  content='persons', content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);
CREATE VIRTUAL TABLE families_fts USING fts5(
  name, address, note,
  content='families', content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 2'
);
INSERT INTO persons_fts(rowid, full_name, holy_name, note)
  SELECT rowid, full_name, holy_name, note FROM persons WHERE deleted_at IS NULL;
INSERT INTO families_fts(rowid, name, address, note)
  SELECT rowid, name, address, note FROM families WHERE deleted_at IS NULL;
CREATE TRIGGER persons_fts_insert AFTER INSERT ON persons WHEN new.deleted_at IS NULL BEGIN
  INSERT INTO persons_fts(rowid, full_name, holy_name, note) VALUES (new.rowid, new.full_name, new.holy_name, new.note);
END;
CREATE TRIGGER persons_fts_update AFTER UPDATE ON persons BEGIN
  INSERT INTO persons_fts(persons_fts, rowid, full_name, holy_name, note) VALUES ('delete', old.rowid, old.full_name, old.holy_name, old.note);
  INSERT INTO persons_fts(rowid, full_name, holy_name, note) SELECT new.rowid, new.full_name, new.holy_name, new.note WHERE new.deleted_at IS NULL;
END;
CREATE TRIGGER families_fts_insert AFTER INSERT ON families WHEN new.deleted_at IS NULL BEGIN
  INSERT INTO families_fts(rowid, name, address, note) VALUES (new.rowid, new.name, new.address, new.note);
END;
CREATE TRIGGER families_fts_update AFTER UPDATE ON families BEGIN
  INSERT INTO families_fts(families_fts, rowid, name, address, note) VALUES ('delete', old.rowid, old.name, old.address, old.note);
  INSERT INTO families_fts(rowid, name, address, note) SELECT new.rowid, new.name, new.address, new.note WHERE new.deleted_at IS NULL;
END;
