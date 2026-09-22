import { randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import { AppError, ERROR_CODES } from '@shared/errors.ts'
import { getDatabasePassword } from '#/db/connection.ts'

const CHALLENGE_TTL_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 5

type SensitiveAction = 'export' | 'import' | 'clearAll'
type Challenge = {
  action: SensitiveAction
  code: string
  expiresAt: number
  attempts: number
}

const challenges = new Map<string, Challenge>()

export function createConfirmationChallenge(action: SensitiveAction) {
  removeExpiredChallenges()
  const challengeId = randomUUID()
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  challenges.set(challengeId, {
    action,
    code,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    attempts: 0,
  })
  return { challengeId, code }
}

export function verifySensitiveAction({
  action,
  challengeId,
  code,
  password,
  passwordConfirmation,
}: {
  action: SensitiveAction
  challengeId: string
  code: string
  password: string
  passwordConfirmation: string
}) {
  const challenge = challenges.get(challengeId)
  if (!challenge || challenge.action !== action || challenge.expiresAt < Date.now()) {
    challenges.delete(challengeId)
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Mã xác nhận đã hết hạn. Hãy thử lại.')
  }

  challenge.attempts += 1
  if (challenge.attempts > MAX_ATTEMPTS) {
    challenges.delete(challengeId)
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Bạn đã nhập sai quá nhiều lần. Hãy thử lại.')
  }

  const databasePassword = getDatabasePassword()
  const valid =
    passwordsMatch(password, passwordConfirmation) &&
    passwordsMatch(password, databasePassword) &&
    code === challenge.code

  if (!valid) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Mật khẩu hoặc mã xác nhận không đúng. Hãy kiểm tra và thử lại.',
    )
  }

  challenges.delete(challengeId)
}

function passwordsMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function removeExpiredChallenges() {
  const timestamp = Date.now()
  for (const [challengeId, challenge] of challenges) {
    if (challenge.expiresAt < timestamp) challenges.delete(challengeId)
  }
}
