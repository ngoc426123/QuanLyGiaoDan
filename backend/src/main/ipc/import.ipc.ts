import { randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'
import { BrowserWindow, dialog } from 'electron'
import { CHANNELS } from '@shared/channels.ts'
import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { importChooseCsvSchema, importCommitCsvSchema } from '#/schemas/import.schema.ts'
import { getDatabase } from '#/db/connection.ts'
import { backupDatabase } from '#/db/migrator.ts'
import { now } from '#/services/clock.ts'
import { userDataPaths } from '../paths.ts'
import { broadcast } from './broadcast.ts'

const pendingImports = new Map<string, string>()
const currentDir = dirname(fileURLToPath(import.meta.url))
const focusedWindow = () =>
  BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null

function runImportWorker(
  operation: 'preview' | 'commit',
  filePath: string,
  onProgress: (progress: any) => void = () => {},
) {
  return new Promise<any>((resolve, reject) => {
    const worker = new Worker(join(currentDir, 'csv-import.worker.js'), {
      workerData: { operation, filePath, dbFile: userDataPaths().dbFile },
    })
    let lastProgressAt = 0
    worker.on('message', (message) => {
      if (message.type === 'progress') {
        const timestamp = Date.now()
        if (timestamp - lastProgressAt >= 100 || message.payload.percent === 100) {
          lastProgressAt = timestamp
          onProgress(message.payload)
        }
      }
      if (message.type === 'success') resolve(message.result)
      if (message.type === 'error')
        reject(new AppError(message.error.code, message.error.message, message.error.details))
    })
    worker.once('error', () =>
      reject(new AppError(ERROR_CODES.IO_ERROR, 'Không thể chạy tác vụ nhập CSV')),
    )
    worker.once('exit', (code) => {
      if (code !== 0) reject(new AppError(ERROR_CODES.IO_ERROR, 'Tác vụ nhập CSV bị dừng đột ngột'))
    })
  })
}

export const importHandlers = Object.freeze([
  {
    channel: CHANNELS.IMPORT.CHOOSE_CSV,
    schema: importChooseCsvSchema,
    handle: async () => {
      const selected = await dialog.showOpenDialog(focusedWindow(), {
        title: 'Chọn tệp CSV để nhập',
        properties: ['openFile'],
        filters: [{ name: 'Tệp CSV', extensions: ['csv'] }],
      })
      if (selected.canceled || !selected.filePaths[0]) return { canceled: true }
      const token = randomUUID()
      const preview = await runImportWorker('preview', selected.filePaths[0])
      pendingImports.set(token, selected.filePaths[0])
      return { canceled: false, token, ...preview }
    },
  },
  {
    channel: CHANNELS.IMPORT.COMMIT_CSV,
    schema: importCommitCsvSchema,
    handle: async ({ token }) => {
      const filePath = pendingImports.get(token)
      if (!filePath) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          'Phiên xác nhận nhập CSV đã hết hạn hoặc đã được dùng. Hãy chọn lại tệp CSV.',
        )
      }
      pendingImports.delete(token)
      const safetyBackup = await backupDatabase(getDatabase(), userDataPaths().backupDir, now())
      const result = await runImportWorker('commit', filePath, (progress) =>
        broadcast(CHANNELS.EVENTS.IMPORT_PROGRESS, progress),
      )
      broadcast(CHANNELS.EVENTS.ZONE_CHANGED, { action: 'created' })
      broadcast(CHANNELS.EVENTS.FAMILY_CHANGED, { action: 'created' })
      broadcast(CHANNELS.EVENTS.PERSON_CHANGED, { action: 'created' })
      return { ...result, safetyBackup }
    },
  },
])
