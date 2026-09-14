import { useDashboard } from '@/features/dashboard/hooks/useDashboard.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import styles from './AppStatusBar.module.css'

export function AppStatusBar() {
  const errorCount = useToastStore((state) => state.toasts.filter((toast) => toast.isError).length)
  const dashboard = useDashboard()
  const summary = dashboard.data
  return (
    <footer className={styles.bar}>
      <span>
        {summary
          ? `${summary.livingPersonCount} giáo dân · ${summary.familyCount} gia đình · ${summary.zoneCount} giáo họ`
          : 'Đang tải số liệu'}
      </span>
      <span role="status">
        {errorCount > 0 ? `${errorCount} thông báo lỗi` : 'Làm việc ngoại tuyến'}
      </span>
    </footer>
  )
}
