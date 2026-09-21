import { invoke } from '@/shared/invoke.ts'

export const backupApi = {
  exportToFile: (password: string) => invoke(window.api.backup.exportToFile({ password })),
  importFromFile: (password: string) => invoke(window.api.backup.importFromFile({ password })),
  clearAll: (confirmation: string) => invoke(window.api.backup.clearAll(confirmation)),
}
