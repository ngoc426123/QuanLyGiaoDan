// Chỉ dùng trong bộ khung Phase 3. Không ghi các bản ghi minh hoạ vào SQLite.
export const samplePersons = [
  {
    id: 'sample-person-1',
    fullName: 'Nguyễn Văn An',
    holyName: 'Giuse',
    familyName: 'Gia đình ông Nguyễn Văn An',
    zoneName: 'Giáo họ Thánh Giuse',
  },
  {
    id: 'sample-person-2',
    fullName: 'Trần Thị Bình',
    holyName: 'Maria',
    familyName: 'Gia đình ông Nguyễn Văn An',
    zoneName: 'Giáo họ Thánh Giuse',
  },
  {
    id: 'sample-person-3',
    fullName: 'Lê Văn Dũng',
    holyName: 'Phêrô',
    familyName: 'Gia đình ông Lê Văn Dũng',
    zoneName: 'Giáo họ Đức Mẹ',
  },
  {
    id: 'sample-person-4',
    fullName: 'Phạm Thị Hoa',
    holyName: 'Anna',
    familyName: 'Gia đình ông Lê Văn Dũng',
    zoneName: 'Giáo họ Đức Mẹ',
  },
  {
    id: 'sample-person-5',
    fullName: 'Vũ Văn Minh',
    holyName: 'Gioan',
    familyName: 'Gia đình ông Vũ Văn Minh',
    zoneName: 'Giáo họ Thánh Giuse',
  },
  {
    id: 'sample-person-6',
    fullName: 'Đặng Thị Ngọc',
    holyName: 'Têrêsa',
    familyName: 'Gia đình ông Vũ Văn Minh',
    zoneName: 'Giáo họ Thánh Giuse',
  },
]

export const sampleFamilies = [
  {
    id: 'sample-family-1',
    name: 'Gia đình ông Nguyễn Văn An',
    zoneName: 'Giáo họ Thánh Giuse',
    memberCount: 2,
  },
  {
    id: 'sample-family-2',
    name: 'Gia đình ông Lê Văn Dũng',
    zoneName: 'Giáo họ Đức Mẹ',
    memberCount: 2,
  },
  {
    id: 'sample-family-3',
    name: 'Gia đình ông Vũ Văn Minh',
    zoneName: 'Giáo họ Thánh Giuse',
    memberCount: 2,
  },
]

export const sampleZones = [
  { id: 'sample-zone-1', name: 'Giáo họ Thánh Giuse', familyCount: 2, personCount: 4 },
  { id: 'sample-zone-2', name: 'Giáo họ Đức Mẹ', familyCount: 1, personCount: 2 },
]

export const directories = {
  persons: {
    title: 'Giáo dân',
    description: 'Gìn giữ thông tin của từng người trong cộng đoàn.',
    rows: samplePersons,
    nameKey: 'fullName',
    fields: {
      holyName: 'Tên thánh',
      fullName: 'Họ và tên',
      familyName: 'Gia đình',
      zoneName: 'Giáo họ',
    },
  },
  families: {
    title: 'Gia đình',
    description: 'Kết nối các thành viên trong mỗi mái ấm.',
    rows: sampleFamilies,
    nameKey: 'name',
    fields: { name: 'Tên gia đình', zoneName: 'Giáo họ', memberCount: 'Thành viên' },
  },
  zones: {
    title: 'Giáo họ',
    description: 'Các cộng đoàn nhỏ trong gia đình giáo xứ.',
    rows: sampleZones,
    nameKey: 'name',
    fields: { name: 'Tên giáo họ', familyCount: 'Gia đình', personCount: 'Giáo dân' },
  },
}

/** Tìm minh hoạ không dấu, không phải quy tắc truy vấn dữ liệu thật của Phase 4.
 * @param {string} value
 * @returns {string}
 */
export function normalizeSearch(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
}
