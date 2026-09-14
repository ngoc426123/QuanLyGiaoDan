import { CHANNELS } from '@shared/channels.ts'
import { settingGetAllSchema, settingSetSchema } from '#/schemas/setting.schema.ts'
import * as settingService from '#/services/setting.service.ts'

export const settingHandlers = Object.freeze([
  {
    channel: CHANNELS.SETTING.GET_ALL,
    schema: settingGetAllSchema,
    handle: () => settingService.getAll(),
  },
  {
    channel: CHANNELS.SETTING.SET,
    schema: settingSetSchema,
    handle: (input) => settingService.setValue(input),
    event: ({ key }) => ({ channel: CHANNELS.EVENTS.SETTING_CHANGED, payload: { key } }),
  },
])
