import { prepare } from './query-helpers.ts'

/** Xoá dữ liệu nghiệp vụ theo thứ tự khoá ngoại; cấu hình và các bản backup được giữ lại. */
export function clearAll() {
  // FTS external-content có thể lệch sau các bản phát hành cũ. Rebuild trước khi DELETE để
  // trigger xoá không gặp lỗi "database disk image is malformed" từ chỉ mục FTS bị lệch.
  prepare("INSERT INTO persons_fts(persons_fts) VALUES('rebuild')").run()
  prepare("INSERT INTO families_fts(families_fts) VALUES('rebuild')").run()
  prepare('DELETE FROM activity_logs').run()
  const members = prepare('DELETE FROM family_members').run().changes
  prepare('DELETE FROM sacraments').run()
  prepare('DELETE FROM marriage_participants').run()
  prepare('DELETE FROM marriages').run()
  const persons = prepare('DELETE FROM persons').run().changes
  const families = prepare('DELETE FROM families').run().changes
  const zones = prepare('DELETE FROM zones').run().changes
  return { zones, families, persons, members }
}
