import { invoke } from '@/shared/invoke.js'

export const settingApi = {
  getAll: () => invoke(window.api.setting.getAll()),
  set: (input) => invoke(window.api.setting.set(input)),
  onChanged: (listener) => window.api.events.onSettingChanged(listener),
}
