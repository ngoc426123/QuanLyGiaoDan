import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon.tsx'
import { Button } from '@/components/ui/Button.tsx'
import { useSettings } from '@/features/setting/hooks/useSettings.ts'
import { useUIStore } from '@/stores/ui.store.ts'
import { navigation } from './navigation.ts'
import styles from './AppSidebar.module.css'

function SidebarLink({ item }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={styles.link}
      title={item.label}
      aria-label={item.label}
    >
      <Icon name={item.icon} />
      <span className={styles.label}>{item.label}</span>
    </NavLink>
  )
}

export function AppSidebar() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const settings = useSettings()
  const parishName = String(settings.data?.['general.parishName'] ?? '').trim()
  const brandName = parishName || 'Quan Ly Giao Dan'
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.mark}>
          <Icon name="zone" />
        </span>
        <div className={styles.label}>
          <strong>{brandName}</strong>
          <p>Danh bạ giáo xứ</p>
        </div>
      </div>
      <p className={styles.sectionLabel}>KHÔNG GIAN GIÁO XỨ</p>
      <nav aria-label="Điều hướng chính" className={styles.navigation}>
        {navigation.map((item) => (
          <SidebarLink key={item.path} item={item} />
        ))}
      </nav>
      <div className={styles.footer}>
        <span className={styles.label}>Dữ liệu trên máy của bạn</span>
        <Button aria-label="Thu gọn hoặc mở rộng thanh bên" onClick={toggleSidebar}>
          <Icon name="menu" />
        </Button>
      </div>
    </aside>
  )
}
