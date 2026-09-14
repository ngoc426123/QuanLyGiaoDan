export class AppClientError extends Error {
  code: string
  details: unknown

  constructor(code: string, message: string, details: unknown) {
    super(message)
    this.name = 'AppClientError'
    this.code = code
    this.details = details
  }
}

/** Bóc envelope; bảo toàn mã, thông điệp và lỗi theo trường từ Main.
 * @param {Promise<object>} request Lời gọi hàm whitelist của preload
 * @returns {Promise<unknown>}
 * @throws {AppClientError}
 */
export async function invoke(request: Promise<any>) {
  const envelope = await request
  if (envelope.ok) return envelope.data
  const { code, message, details } = envelope.error
  throw new AppClientError(code, message, details)
}
