import { useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { useBackupConfirmation, useClearAllData } from '@/features/backup/hooks/useBackup.ts'
import styles from './DangerZoneSettings.module.css'

export function DangerZoneSettings() {
  const clearAll = useClearAllData()
  const confirmation = useBackupConfirmation()
  const [isOpen, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [code, setCode] = useState('')
  const challenge = confirmation.data
  const valid =
    password.length >= 12 && password === passwordConfirmation && code === confirmation.data?.code
  const reset = () => {
    setPassword('')
    setPasswordConfirmation('')
    setCode('')
    confirmation.reset()
  }
  const close = () => {
    setOpen(false)
    reset()
  }

  return (
    <section className={styles.panel} aria-labelledby="danger-zone-title">
      <h2 id="danger-zone-title">Xóa dữ liệu</h2>
      <div className={styles.actionRow}>
        <p className={styles.warning}>
          Xóa vĩnh viễn toàn bộ giáo họ, hộ, giáo dân, bí tích, hôn phối và lịch sử chỉnh sửa.
          Bản sao an toàn được tạo trước khi xóa, nhưng không thể hoàn tác trực tiếp trong ứng dụng.
        </p>
        <Button
          disabled={clearAll.isPending || confirmation.isPending}
          onClick={() => {
            setOpen(true)
            reset()
            confirmation.mutate('clearAll')
          }}
        >
          Xóa dữ liệu
        </Button>
      </div>
      {isOpen && (
        <ConfirmDialog
          title="Xóa toàn bộ dữ liệu nghiệp vụ"
          confirmLabel="Tôi hiểu, xóa toàn bộ dữ liệu"
          confirmVariant="danger"
          isPending={clearAll.isPending}
          confirmDisabled={!valid}
          onClose={close}
          onConfirm={() => {
            if (!challenge) return
            clearAll.mutate(
              {
                challengeId: challenge.challengeId,
                code,
                password,
                passwordConfirmation,
              },
              { onSuccess: close },
            )
          }}
        >
          <span>
            Thao tác này không thể hoàn tác. Hãy kiểm tra kỹ trước khi xác nhận.
            <Input
              label="Mật khẩu dữ liệu"
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={clearAll.isPending}
              onChange={(event: any) => setPassword(event.target.value)}
            />
            <Input
              label="Xác nhận mật khẩu dữ liệu"
              type="password"
              autoComplete="current-password"
              value={passwordConfirmation}
              disabled={clearAll.isPending}
              onChange={(event: any) => setPasswordConfirmation(event.target.value)}
            />
            {challenge && (
              <>
                <p>Mã xác nhận: {challenge.code}</p>
                <Input
                  label="Nhập mã xác nhận"
                  inputMode="numeric"
                  value={code}
                  disabled={clearAll.isPending}
                  onChange={(event: any) => setCode(event.target.value)}
                />
              </>
            )}
          </span>
        </ConfirmDialog>
      )}
    </section>
  )
}
