import { BrowserWindow, dialog } from 'electron'
import { CHANNELS } from '@shared/channels.ts'
import { reportExportCsvSchema } from '#/schemas/report.schema.ts'
import * as reportService from '#/services/report.service.ts'

function focusedWindow() {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

export const reportHandlers = Object.freeze([
  {
    channel: CHANNELS.REPORT.EXPORT_CSV,
    schema: reportExportCsvSchema,
    handle: async (input) => {
      const options = {
        title: 'Xuất danh sách CSV',
        defaultPath: reportService.getSuggestedFilename(input.report),
        filters: [{ name: 'Tệp CSV', extensions: ['csv'] }],
      }
      const parent = focusedWindow()
      const result = parent
        ? await dialog.showSaveDialog(parent, options)
        : await dialog.showSaveDialog(options)

      if (result.canceled || !result.filePath) return { canceled: true }
      return {
        canceled: false,
        ...reportService.exportCsv({ ...input, filePath: result.filePath }),
      }
    },
  },
])
