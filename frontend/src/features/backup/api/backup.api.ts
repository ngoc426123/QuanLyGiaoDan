import { invoke } from '@/shared/invoke.ts'

export const backupApi = {
  createConfirmation: (action: 'export' | 'import' | 'clearAll') =>
    invoke(window.api.backup.createConfirmation(action)),
  exportToFile: (input: Record<string, string>) => invoke(window.api.backup.exportToFile(input)),
  importFromFile: (input: Record<string, string>) =>
    invoke(window.api.backup.importFromFile(input)),
  clearAll: (input: Record<string, string>) => invoke(window.api.backup.clearAll(input)),
}
