import * as searchRepository from '#/repositories/search.repository.ts'
import { normalizeText, toAscii } from './service-helpers.ts'

export function query(input: string) {
  const terms = toAscii(normalizeText(input) ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term.replaceAll('"', '')}"*`)
    .join(' AND ')
  return searchRepository.find(terms)
}
