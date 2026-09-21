import { CHANNELS } from '@shared/channels.ts'
import { activityLogListSchema } from '#/schemas/activity-log.schema.ts'
import * as activityLogService from '#/services/activity-log.service.ts'

export const activityLogHandlers = Object.freeze([
  {
    channel: CHANNELS.ACTIVITY_LOG.LIST,
    schema: activityLogListSchema,
    handle: activityLogService.list,
  },
])
