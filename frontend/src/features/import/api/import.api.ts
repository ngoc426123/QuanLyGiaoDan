import { invoke } from '@/shared/invoke.ts'

export const importApi = Object.freeze({
  chooseCsv: () => invoke(window.api.import.chooseCsv()),
  commitCsv: (token: string) => invoke(window.api.import.commitCsv(token)),
})
