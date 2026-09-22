import { invoke } from '@/shared/invoke.ts'

export const dashboardApi = Object.freeze({
  getSummary: (input: { month: string }) => invoke(window.api.dashboard.getSummary(input)),
})
