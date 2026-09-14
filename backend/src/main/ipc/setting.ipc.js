import { CHANNELS } from '@shared/channels.js'
import { settingGetAllSchema, settingSetSchema } from '#/schemas/setting.schema.js'
import * as settingService from '#/services/setting.service.js'

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
