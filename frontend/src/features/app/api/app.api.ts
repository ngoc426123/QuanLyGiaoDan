import { invoke } from '@/shared/invoke.ts'

export const appApi = Object.freeze({
  getVersion: () => invoke(window.api.app.getVersion()),
  openDataFolder: () => invoke(window.api.app.openDataFolder()),
  openLogFolder: () => invoke(window.api.app.openLogFolder()),
})
