import { invoke } from '@/shared/invoke.ts'

export const backupApi = {
  exportToFile: () => invoke(window.api.backup.exportToFile()),
  importFromFile: () => invoke(window.api.backup.importFromFile()),
  clearAll: (confirmation: string) => invoke(window.api.backup.clearAll(confirmation)),
}
