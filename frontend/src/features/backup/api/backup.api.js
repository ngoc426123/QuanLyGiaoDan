import { invoke } from '@/shared/invoke.js'

export const backupApi = {
  exportToFile: () => invoke(window.api.backup.exportToFile()),
  importFromFile: () => invoke(window.api.backup.importFromFile()),
}
