/** Ngày lịch hiện tại theo múi giờ cục bộ của máy người dùng. */
export function calendarToday() {
  const now = new Date()
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 10)
}
