import initSql from './001_init.sql?raw'
import ftsSql from './002_add_fts.sql?raw'
import ftsDeleteTriggersSql from './003_add_fts_delete_triggers.sql?raw'
import ftsSoftDeleteTriggersSql from './004_fix_fts_soft_delete_triggers.sql?raw'

/**
 * Danh mục migration — **nguồn chân lý duy nhất** về thứ tự và số hiệu.
 *
 * `storage-strategy.md` §5.3 mô tả luồng là "quét thư mục migrations". Ở đây dùng
 * **danh mục tường minh** thay cho quét thư mục, vì file `.sql` được bundler nhúng
 * thẳng vào `out/main.js` (`?raw`): bản đóng gói chỉ ship `out/**`, không ship `src/`,
 * nên quét thư mục lúc chạy sẽ không thấy file nào. Ngoại lệ này ghi ở
 * `project/decisions.md` §4.
 *
 * Mọi luật khác giữ nguyên: đánh số tăng dần, mỗi file một transaction, file đã phát
 * hành không bao giờ được sửa.
 *
 * @typedef {{ version: number, name: string, sql: string }} Migration
 * @type {readonly Migration[]}
 */
export const MIGRATIONS = Object.freeze([
  Object.freeze({ version: 1, name: '001_init.sql', sql: initSql }),
  Object.freeze({ version: 2, name: '002_add_fts.sql', sql: ftsSql }),
  Object.freeze({ version: 3, name: '003_add_fts_delete_triggers.sql', sql: ftsDeleteTriggersSql }),
  Object.freeze({
    version: 4,
    name: '004_fix_fts_soft_delete_triggers.sql',
    sql: ftsSoftDeleteTriggersSql,
  }),
])

/** Số hiệu migration cao nhất mà bản build này biết. */
export const LATEST_VERSION = MIGRATIONS.reduce((max, m) => Math.max(max, m.version), 0)
