import { Button } from '@/components/ui/Button.jsx'
import { useBackup } from '../hooks/useBackup.js'
import styles from './BackupSettings.module.css'

export function BackupSettings() {
  const mutation = useBackup()
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
      </div>
      {mutation.isPending && <p role="status">Đang xử lý dữ liệu…</p>}
    </section>
  )
}
