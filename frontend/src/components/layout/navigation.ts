export const navigation = [
  { path: '/', label: 'Tổng quan', icon: 'overview' },
  { path: '/persons', label: 'Giáo dân', icon: 'person' },
  { path: '/marriages', label: 'Hôn phối', icon: 'marriage' },
  { path: '/families', label: 'Gia đình', icon: 'family' },
  { path: '/zones', label: 'Giáo họ', icon: 'zone' },
  { path: '/certificates', label: 'Nhật ký chứng thư', icon: 'export' },
  { path: '/exports', label: 'Xuất file', icon: 'export' },
  { path: '/settings', label: 'Cài đặt', icon: 'settings' },
]

/** Tiêu đề theo route, trang chi tiết vẫn thuộc mục cha trên sidebar.
 * @param {string} pathname
 * @returns {string}
 */
export function routeTitle(pathname) {
  if (/^\/persons\/.+/.test(pathname)) return 'Hồ sơ giáo dân'
  if (pathname === '/marriages') return 'Hôn phối'
  if (/^\/families\/.+/.test(pathname)) return 'Chi tiết hộ'
  if (/^\/zones\/.+/.test(pathname)) return 'Chi tiết giáo họ'
  if (pathname === '/search') return 'Tìm kiếm'
  if (pathname === '/trash') return 'Thùng rác'
  if (pathname === '/exports') return 'Xuất file'
  if (pathname === '/certificates') return 'Nhật ký chứng thư'
  return navigation.find((item) => item.path === pathname)?.label || 'Không tìm thấy trang'
}
