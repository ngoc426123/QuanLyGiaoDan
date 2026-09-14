import { Button } from '@/components/ui/Button.tsx'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.tsx'
import { useState } from 'react'
import { Input } from '@/components/ui/Input.tsx'
import { useBackup, useClearAllData } from '../hooks/useBackup.ts'
import { useCsvImport } from '@/features/import/hooks/useCsvImport.ts'
import styles from './BackupSettings.module.css'

export function BackupSettings() {
  const mutation = useBackup()
  const clearAll = useClearAllData()
  const csvImport = useCsvImport()
  const [preview, setPreview] = useState<any>(null)
  const [isClearOpen, setClearOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  function run(action) {
    if (!mutation.isPending) mutation.mutate(action)
  }
  return (
    <section className={styles.panel} aria-labelledby="backup-title">
      <h2 id="backup-title">Dữ liệu</h2>
      <p>
        Xuất một bản dữ liệu để lưu giữ hoặc chuyển sang máy khác. Nhập dữ liệu sẽ thay toàn bộ dữ
        liệu hiện tại; ứng dụng sẽ cho bạn đối chiếu trước khi tiếp tục.
      </p>
      <div className={styles.actions}>
        <Button disabled={mutation.isPending} onClick={() => run('export')}>
          Xuất dữ liệu ra file
        </Button>
        <Button disabled={mutation.isPending} onClick={() => run('import')}>
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
        <Button
          variant="danger"
          disabled={mutation.isPending || clearAll.isPending}
          onClick={() => setClearOpen(true)}
        >
          Xóa dữ liệu để kiểm thử
        </Button>
      </div>
      {mutation.isPending && <p role="status">Đang xử lý dữ liệu…</p>}
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
      {isClearOpen && (
        <ConfirmDialog
          title="Xóa toàn bộ dữ liệu nghiệp vụ"
          isPending={clearAll.isPending}
          confirmDisabled={confirmation !== 'XÓA DỮ LIỆU'}
          onClose={() => {
            setClearOpen(false)
            setConfirmation('')
          }}
          onConfirm={() =>
            clearAll.mutate(confirmation, {
              onSuccess: () => {
                setClearOpen(false)
                setConfirmation('')
              },
            })
          }
        >
          <span>
            Ứng dụng sẽ sao lưu trước, sau đó xóa giáo họ, hộ, giáo dân và thành viên hộ. Nhập XÓA
            DỮ LIỆU vào ô bên dưới để xác nhận.
            <Input
              label="Câu xác nhận"
              value={confirmation}
              disabled={clearAll.isPending}
              onChange={(event: any) => setConfirmation(event.target.value)}
            />
          </span>
        </ConfirmDialog>
      )}
    </section>
  )
}
