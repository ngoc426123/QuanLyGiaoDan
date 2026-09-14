import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/ui.store.ts'
import { useTheme } from '@/features/setting/hooks/useTheme.ts'
import { useSettingEvents } from '@/features/setting/hooks/useSettings.ts'
import { useShellShortcuts } from '@/hooks/useShellShortcuts.ts'
import { AppContent } from './AppContent.tsx'
import { AppSidebar } from './AppSidebar.tsx'
import { AppTopBar } from './AppTopBar.tsx'
import { AppStatusBar } from './AppStatusBar.tsx'
import { OverlayRoot } from './OverlayRoot.tsx'
import styles from './AppShell.module.css'

export function AppShell() {
  const { pathname } = useLocation()
  const content = useRef<HTMLElement>(null)
  const collapsed = useUIStore((state) => state.isSidebarCollapsed)
  const sidebarWidth = useUIStore((state) => state.sidebarWidth)
  useTheme()
  useSettingEvents()
  useShellShortcuts()
  useEffect(() => {
    content.current?.scrollTo({ top: 0 })
  }, [pathname])
  return (
    <div
      className={styles.shell}
      data-collapsed={collapsed}
      style={{ '--sidebar-width': `${sidebarWidth}px` } as any}
    >
      <a
        className={styles.skip}
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          content.current?.focus()
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
