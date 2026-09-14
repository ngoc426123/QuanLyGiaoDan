import { invoke } from '@/shared/invoke.ts'

export const dashboardApi = Object.freeze({
  getSummary: () => invoke(window.api.dashboard.getSummary()),
})
