import { applyPragmas, closeDatabase, openDatabase } from '#/db/connection.js'
import { migrate } from '#/db/migrator.js'

/**
 * DB sạch trong RAM cho mỗi test: chạy `001_init.sql` **thật**, không phải schema chép tay —
 * nếu migration sai thì test phải đỏ (`data-services.md` §9).
 */
export async function freshDatabase() {
  closeDatabase()

  const db = openDatabase(':memory:')
  await migrate(db)
  applyPragmas(db)

  return db
}

export function disposeDatabase() {
  closeDatabase()
}
