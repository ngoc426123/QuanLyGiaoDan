import * as dashboardRepository from '#/repositories/dashboard.repository.ts'

export function getSummary() {
  return dashboardRepository.getSummary()
}
