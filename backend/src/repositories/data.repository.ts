import { prepare } from './query-helpers.ts'

/** Xoá dữ liệu nghiệp vụ theo thứ tự khoá ngoại; cấu hình và các bản backup được giữ lại. */
export function clearAll() {
  const members = prepare('DELETE FROM family_members').run().changes
  const persons = prepare('DELETE FROM persons').run().changes
  const families = prepare('DELETE FROM families').run().changes
  const zones = prepare('DELETE FROM zones').run().changes
  return { zones, families, persons, members }
}
