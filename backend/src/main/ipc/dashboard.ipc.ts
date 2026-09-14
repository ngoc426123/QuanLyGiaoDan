import { CHANNELS } from '@shared/channels.ts'
import { dashboardGetSummarySchema } from '#/schemas/dashboard.schema.ts'
import * as dashboardService from '#/services/dashboard.service.ts'

export const dashboardHandlers = Object.freeze([
  {
    channel: CHANNELS.DASHBOARD.GET_SUMMARY,
    schema: dashboardGetSummarySchema,
    handle: () => dashboardService.getSummary(),
  },
])
