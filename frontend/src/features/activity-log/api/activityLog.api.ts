import { invoke } from '@/shared/invoke.ts'

export const activityLogApi = {
  list: (input: { entityType: string; entityId: string }) =>
    invoke(window.api.activityLog.list(input)),
}
