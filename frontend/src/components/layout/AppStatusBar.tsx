import { useToastStore } from '@/stores/toast.store.ts'
import styles from './AppStatusBar.module.css'

export function AppStatusBar() {
  const errorCount = useToastStore((state) => state.toasts.filter((toast) => toast.isError).length)
  return (
    <footer className={styles.bar}>
      <span>
        6 giáo dân · 3 gia đình · 2 giáo họ{' '}
        <span className={styles.sample}>— dữ liệu minh hoạ</span>
      </span>
      <span role="status">
        {errorCount > 0 ? `${errorCount} thông báo lỗi` : 'Làm việc ngoại tuyến'}
      </span>
    </footer>
  )
}
