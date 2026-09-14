/**
 * Nguồn thời gian duy nhất của Backend — `data-services.md` §3.2.
 *
 * Không rải `new Date().toISOString()` khắp nơi: gom một chỗ thì test giả lập được thời
 * gian, và định dạng chắc chắn nhất quán.
 */

/**
 * Mốc thời gian hiện tại, chuỗi **ISO 8601 UTC** — dùng cho mọi cột hậu tố `_at`.
 *
 * @returns {string} ví dụ `2026-09-13T07:15:03.120Z`
 */
export function now() {
  return new Date().toISOString()
}

/**
 * Ngày trên lịch **theo giờ địa phương**, chuỗi `YYYY-MM-DD` — dùng cho cột hậu tố `_date`.
 * Không lấy từ `toISOString()`: ở UTC+7, 7 giờ sáng đầu ngày sẽ ra ngày hôm trước.
 *
 * @returns {string} ví dụ `2026-09-13`
 */
export function today() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}
