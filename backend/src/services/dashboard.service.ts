import * as dashboardRepository from '#/repositories/dashboard.repository.ts'

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export function getSummary(input: { month?: string } = {}) {
  return dashboardRepository.getSummary(input.month ?? currentMonth())
}
