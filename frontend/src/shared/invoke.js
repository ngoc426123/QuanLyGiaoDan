export class AppClientError extends Error {
  constructor(code, message, details) {
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
export async function invoke(request) {
  const envelope = await request
  if (envelope.ok) return envelope.data
  const { code, message, details } = envelope.error
  throw new AppClientError(code, message, details)
}
