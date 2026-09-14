import { invoke } from '@/shared/invoke.ts'

export const searchApi = Object.freeze({
  query: (query: string) => invoke(window.api.search.query(query)),
})
