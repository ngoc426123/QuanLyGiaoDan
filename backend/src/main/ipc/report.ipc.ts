import { BrowserWindow, dialog } from 'electron'
import { CHANNELS } from '@shared/channels.ts'
import {
  reportExportCsvSchema,
  reportExportPdfSchema,
  reportExportPersonProfilePdfSchema,
  reportExportXlsxSchema,
} from '#/schemas/report.schema.ts'
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
  {
    channel: CHANNELS.REPORT.EXPORT_XLSX,
    schema: reportExportXlsxSchema,
    handle: async (input) => exportReport(input, 'xlsx'),
  },
  {
    channel: CHANNELS.REPORT.EXPORT_PDF,
    schema: reportExportPdfSchema,
    handle: async (input) => exportReport(input, 'pdf'),
  },
  {
    channel: CHANNELS.REPORT.EXPORT_PERSON_PROFILE_PDF,
    schema: reportExportPersonProfilePdfSchema,
    handle: async (input) => {
      const result = await showSaveDialog({
        title: 'Xuất hồ sơ giáo dân PDF',
        defaultPath: reportService.personProfileFilename,
        filters: [{ name: 'Tệp PDF', extensions: ['pdf'] }],
      })
      if (result.canceled || !result.filePath) return { canceled: true }
      return {
        canceled: false,
        ...(await reportService.exportPersonProfilePdf({ ...input, filePath: result.filePath })),
      }
    },
  },
])

async function showSaveDialog(options: any) {
  const parent = focusedWindow()
  return parent ? dialog.showSaveDialog(parent, options) : dialog.showSaveDialog(options)
}

async function exportReport(input: any, format: 'xlsx' | 'pdf') {
  const result = await showSaveDialog({
    title: format === 'xlsx' ? 'Xuất danh sách Excel' : 'Xuất danh sách PDF',
    defaultPath: reportService.getSuggestedFilename(input.report, format),
    filters: [{ name: format === 'xlsx' ? 'Tệp Excel' : 'Tệp PDF', extensions: [format] }],
  })
  if (result.canceled || !result.filePath) return { canceled: true }
  const exportFile = format === 'xlsx' ? reportService.exportXlsx : reportService.exportPdf
  return { canceled: false, ...(await exportFile({ ...input, filePath: result.filePath })) }
}
