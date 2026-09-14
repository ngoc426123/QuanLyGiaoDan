import { parentPort, workerData } from 'node:worker_threads'
import { AppError, ERROR_CODES, isAppError } from '@shared/errors.ts'
import { applyPragmas, closeDatabase, openDatabase } from '#/db/connection.ts'
import * as csvImportService from '#/services/csv-import.service.ts'

type WorkerInput = { operation: 'preview' | 'commit'; filePath: string; dbFile: string }

const port = parentPort
const input = workerData as WorkerInput

function sendError(error: unknown) {
  const appError = isAppError(error)
    ? error
    : new AppError(ERROR_CODES.IO_ERROR, 'Không thể đọc hoặc nhập tệp CSV')
  port?.postMessage({
    type: 'error',
    error: { code: appError.code, message: appError.message, details: appError.details },
  })
}

try {
  const db = openDatabase(input.dbFile)
  applyPragmas(db)
  const result =
    input.operation === 'preview'
      ? csvImportService.previewCsv(input.filePath)
      : csvImportService.importCsv({
          filePath: input.filePath,
          onProgress: (payload) => port?.postMessage({ type: 'progress', payload }),
        })
  port?.postMessage({ type: 'success', result })
} catch (error) {
  sendError(error)
} finally {
  closeDatabase()
}
