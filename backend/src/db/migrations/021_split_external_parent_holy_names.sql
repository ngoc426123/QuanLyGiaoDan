-- Tách tên thánh của cha/mẹ người ngoài xứ khỏi họ tên đầy đủ.
ALTER TABLE persons ADD COLUMN father_holy_name TEXT
  CHECK (father_holy_name IS NULL OR length(father_holy_name) <= 75);
ALTER TABLE persons ADD COLUMN mother_holy_name TEXT
  CHECK (mother_holy_name IS NULL OR length(mother_holy_name) <= 75);

-- Các bản ghi cũ được tạo từ form bằng dạng "Tên thánh Họ tên".
UPDATE persons
SET father_holy_name = trim(substr(father_name, 1, instr(father_name, ' ') - 1)),
    father_name = trim(substr(father_name, instr(father_name, ' ') + 1))
WHERE father_name IS NOT NULL AND instr(father_name, ' ') > 0;
UPDATE persons
SET mother_holy_name = trim(substr(mother_name, 1, instr(mother_name, ' ') - 1)),
    mother_name = trim(substr(mother_name, instr(mother_name, ' ') + 1))
WHERE mother_name IS NOT NULL AND instr(mother_name, ' ') > 0;
