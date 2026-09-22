import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { useState } from 'react'
import { Input } from '@/components/ui/Input.tsx'
import { useBackup, useBackupConfirmation } from '../hooks/useBackup.ts'
import { useCsvImport } from '@/features/import/hooks/useCsvImport.ts'
import styles from './BackupSettings.module.css'

export function BackupSettings() {
  const mutation = useBackup()
  const confirmationChallenge = useBackupConfirmation()
  const csvImport = useCsvImport()
  const [preview, setPreview] = useState<any>(null)
  const [backupAction, setBackupAction] = useState<'export' | 'import' | null>(null)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [code, setCode] = useState('')
  const [backupPassword, setBackupPassword] = useState('')

  function resetConfirmation() {
    setPassword('')
    setPasswordConfirmation('')
    setCode('')
    setBackupPassword('')
    confirmationChallenge.reset()
  }

  function renewConfirmation(action: 'export' | 'import') {
    setCode('')
    confirmationChallenge.reset()
    confirmationChallenge.mutate(action)
  }

  function openBackup(action: 'export' | 'import') {
    setBackupAction(action)
    resetConfirmation()
    renewConfirmation(action)
  }

  function validConfirmation() {
    return (
      password.length >= 12 &&
      password === passwordConfirmation &&
      code === confirmationChallenge.data?.code
    )
  }

  function confirmationInput() {
    const challenge = confirmationChallenge.data
    if (!challenge) return null
    return {
      challengeId: challenge.challengeId,
      code,
      password,
      passwordConfirmation,
    }
  }

  function run() {
    const input = confirmationInput()
    if (!mutation.isPending && backupAction && input) {
      mutation.mutate(
        {
          action: backupAction,
          input: {
            ...input,
            ...(backupAction === 'import' && backupPassword ? { backupPassword } : {}),
          },
        },
        {
          onSuccess: () => {
            setBackupAction(null)
            resetConfirmation()
          },
          onError: (error) => {
            if (error instanceof Error && error.message.includes('Mã xác nhận đã hết hạn')) {
              renewConfirmation(backupAction)
            }
          },
        },
      )
    }
  }
  return (
    <section className={styles.panel} aria-labelledby="backup-title">
      <h2 id="backup-title">Dữ liệu</h2>
      <p>
        Xuất một bản dữ liệu để lưu giữ hoặc chuyển sang máy khác. Nhập dữ liệu sẽ thay toàn bộ dữ
        liệu hiện tại; ứng dụng sẽ cho bạn đối chiếu trước khi tiếp tục.
      </p>
      <div className={styles.actions}>
        <Button disabled={mutation.isPending} onClick={() => openBackup('export')}>
          Xuất dữ liệu ra file
        </Button>
        <Button disabled={mutation.isPending} onClick={() => openBackup('import')}>
          Nhập dữ liệu từ file
        </Button>
        <Button
          disabled={csvImport.choose.isPending || csvImport.commit.isPending}
          onClick={() =>
            csvImport.choose.mutate(undefined, {
              onSuccess: (result: any) => {
                if (!result.canceled) setPreview(result)
              },
            })
          }
        >
          Nhập CSV
        </Button>
      </div>
      {mutation.isPending && <p role="status">Đang xử lý dữ liệu…</p>}
      {backupAction && (
        <ConfirmDialog
          title={backupAction === 'export' ? 'Xác nhận xuất dữ liệu' : 'Xác nhận nhập dữ liệu'}
          isPending={mutation.isPending}
          confirmLabel={backupAction === 'export' ? 'Xuất file đã mã hóa' : 'Nhập file backup'}
          confirmVariant="primary"
          confirmDisabled={!validConfirmation()}
          onClose={() => {
            setBackupAction(null)
            resetConfirmation()
          }}
          onConfirm={run}
        >
          <span>
            {backupAction === 'export'
              ? 'File xuất sẽ được mã hóa bằng mật khẩu dữ liệu của ứng dụng.'
              : 'Nhập mật khẩu dữ liệu để cho phép thay toàn bộ dữ liệu hiện tại.'}
            <Input
              label="Mật khẩu dữ liệu"
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={mutation.isPending}
              onChange={(event: any) => setPassword(event.target.value)}
            />
            <Input
              label="Xác nhận mật khẩu dữ liệu"
              type="password"
              autoComplete="current-password"
              value={passwordConfirmation}
              disabled={mutation.isPending}
              onChange={(event: any) => setPasswordConfirmation(event.target.value)}
            />
            {backupAction === 'import' && (
              <Input
                label="Mật khẩu file backup cũ (nếu có)"
                type="password"
                autoComplete="current-password"
                value={backupPassword}
                disabled={mutation.isPending}
                onChange={(event: any) => setBackupPassword(event.target.value)}
              />
            )}
            {confirmationChallenge.data && (
              <>
                <p>Mã xác nhận: {confirmationChallenge.data.code}</p>
                <Input
                  label="Nhập mã xác nhận"
                  inputMode="numeric"
                  value={code}
                  disabled={mutation.isPending}
                  onChange={(event: any) => setCode(event.target.value)}
                />
                <Button
                  disabled={mutation.isPending || confirmationChallenge.isPending}
                  onClick={() => renewConfirmation(backupAction)}
                >
                  Lấy mã xác nhận mới
                </Button>
              </>
            )}
          </span>
        </ConfirmDialog>
      )}
      {csvImport.commit.isPending && (
        <p role="status">
          Đang nhập CSV{csvImport.progress?.total ? `: ${csvImport.progress.percent}%` : '…'}
        </p>
      )}
      {preview && (
        <ConfirmDialog
          title="Xác nhận nhập CSV"
          isPending={csvImport.commit.isPending}
          onClose={() => setPreview(null)}
          onConfirm={() =>
            csvImport.commit.mutate(preview.token, {
              onSuccess: () => setPreview(null),
              onError: () => setPreview(null),
            })
          }
        >
          {preview.suspectedDuplicateCount > 0
            ? `Phát hiện ${preview.suspectedDuplicateCount} giáo dân nghi ngờ trùng. Tệp sẽ không được nhập tự động để tránh nhân đôi dữ liệu.`
            : `Tệp gồm ${preview.zoneCount} giáo họ, ${preview.familyCount} hộ và ${preview.rowCount} giáo dân. Giáo họ và hộ trùng tên sẽ được tái sử dụng; dữ liệu hiện tại được sao lưu trước khi ghi.`}
        </ConfirmDialog>
      )}
    </section>
  )
}
