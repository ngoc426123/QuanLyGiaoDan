import { invoke } from '@/shared/invoke.ts'

export const reportApi = Object.freeze({
  exportCsv: (input: Record<string, unknown>) => invoke(window.api.report.exportCsv(input)),
})
