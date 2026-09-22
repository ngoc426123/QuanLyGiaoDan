import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { closeDatabase, openDatabase, setDatabasePassword } from '#/db/connection.ts'
import {
  createConfirmationChallenge,
  verifySensitiveAction,
} from '#/services/confirmation.service.ts'

const password = 'mat-khau-du-lieu-2026'

afterEach(() => closeDatabase())

describe('confirmation.service', () => {
  it('chỉ chấp nhận đúng mật khẩu xác nhận lại và mã sáu số cho đúng thao tác', () => {
    openDatabase(':memory:')
    setDatabasePassword(password)
    const challenge = createConfirmationChallenge('export')

    assert.throws(
      () =>
        verifySensitiveAction({
          action: 'import',
          challengeId: challenge.challengeId,
          code: challenge.code,
          password,
          passwordConfirmation: password,
        }),
      (error: any) => error.code === 'VALIDATION_ERROR',
    )

    const validChallenge = createConfirmationChallenge('export')
    verifySensitiveAction({
      action: 'export',
      challengeId: validChallenge.challengeId,
      code: validChallenge.code,
      password,
      passwordConfirmation: password,
    })
  })

  it('từ chối mật khẩu hoặc mã xác nhận sai', () => {
    openDatabase(':memory:')
    setDatabasePassword(password)
    const challenge = createConfirmationChallenge('clearAll')

    assert.throws(
      () =>
        verifySensitiveAction({
          action: 'clearAll',
          challengeId: challenge.challengeId,
          code: '000000',
          password,
          passwordConfirmation: password,
        }),
      (error: any) => error.code === 'VALIDATION_ERROR',
    )
  })
})
