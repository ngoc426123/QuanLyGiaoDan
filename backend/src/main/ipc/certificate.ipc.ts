import { BrowserWindow, dialog } from 'electron'
import { CHANNELS } from '@shared/channels.ts'
import { certificateIssueSchema, certificateListSchema } from '#/schemas/certificate.schema.ts'
import * as certificateService from '#/services/certificate.service.ts'

function focusedWindow() {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

export const certificateHandlers = Object.freeze([
  {
    channel: CHANNELS.CERTIFICATE.LIST,
    schema: certificateListSchema,
    handle: certificateService.list,
    withMeta: true,
  },
  {
    channel: CHANNELS.CERTIFICATE.ISSUE,
    schema: certificateIssueSchema,
    handle: async (input) => {
      const options = {
        title: 'Cấp chứng thư PDF',
        defaultPath: certificateService.suggestedFilename(input.type),
        filters: [{ name: 'Tệp PDF', extensions: ['pdf'] }],
      }
      const parent = focusedWindow()
      const result = parent
        ? await dialog.showSaveDialog(parent, options)
        : await dialog.showSaveDialog(options)
      if (result.canceled || !result.filePath) return { canceled: true }
      return {
        canceled: false,
        ...(await certificateService.issue({ ...input, filePath: result.filePath })),
      }
    },
  },
])
