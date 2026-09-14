import { prepare } from './query-helpers.ts'

const LIMIT = 50

export function find(query: string) {
  const persons = prepare(
    "SELECT p.id, p.full_name AS title, COALESCE(p.holy_name, '') AS subtitle, bm25(persons_fts) AS rank" +
      ' FROM persons_fts JOIN persons p ON p.rowid = persons_fts.rowid' +
      ' WHERE persons_fts MATCH ? AND p.deleted_at IS NULL ORDER BY rank LIMIT ?',
  )
    .all(query, LIMIT)
    .map((row: any) => ({ ...row, type: 'person', route: `/persons/${row.id}` }))
  const families = prepare(
    "SELECT f.id, f.name AS title, COALESCE(f.address, '') AS subtitle, bm25(families_fts) AS rank" +
      ' FROM families_fts JOIN families f ON f.rowid = families_fts.rowid' +
      ' WHERE families_fts MATCH ? AND f.deleted_at IS NULL ORDER BY rank LIMIT ?',
  )
    .all(query, LIMIT)
    .map((row: any) => ({ ...row, type: 'family', route: `/families/${row.id}` }))

  return [...persons, ...families]
    .sort((left: any, right: any) => left.rank - right.rank)
    .slice(0, LIMIT)
}
