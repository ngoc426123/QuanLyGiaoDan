import { invoke } from '@/shared/invoke.ts'

export const reportApi = Object.freeze({
  exportCsv: (input: Record<string, unknown>) => invoke(window.api.report.exportCsv(input)),
  exportXlsx: (input: Record<string, unknown>) => invoke(window.api.report.exportXlsx(input)),
  exportPdf: (input: Record<string, unknown>) => invoke(window.api.report.exportPdf(input)),
  exportPersonProfilePdf: (input: { personId: string }) =>
    invoke(window.api.report.exportPersonProfilePdf(input)),
})
