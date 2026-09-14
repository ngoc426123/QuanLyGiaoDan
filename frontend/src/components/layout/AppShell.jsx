import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/ui.store.js'
import { useTheme } from '@/features/setting/hooks/useTheme.js'
import { useSettingEvents } from '@/features/setting/hooks/useSettings.js'
import { useShellShortcuts } from '@/hooks/useShellShortcuts.js'
import { AppContent } from './AppContent.jsx'
import { AppSidebar } from './AppSidebar.jsx'
import { AppTopBar } from './AppTopBar.jsx'
import { AppStatusBar } from './AppStatusBar.jsx'
import { OverlayRoot } from './OverlayRoot.jsx'
import styles from './AppShell.module.css'

export function AppShell() {
  const { pathname } = useLocation()
  const content = useRef(null)
  const collapsed = useUIStore((state) => state.isSidebarCollapsed)
  const sidebarWidth = useUIStore((state) => state.sidebarWidth)
  useTheme()
  useSettingEvents()
  useShellShortcuts()
  useEffect(() => {
    content.current.scrollTop = 0
  }, [pathname])
  return (
    <div
      className={styles.shell}
      data-collapsed={collapsed}
      style={{ '--sidebar-width': `${sidebarWidth}px` }}
    >
      <a
        className={styles.skip}
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          content.current.focus()
        }}
      >
        Đến nội dung chính
      </a>
      <AppSidebar />
      <div className={styles.workspace}>
        <AppTopBar />
        <AppContent ref={content} pathname={pathname} />
        <AppStatusBar />
      </div>
      <OverlayRoot />
    </div>
  )
}
