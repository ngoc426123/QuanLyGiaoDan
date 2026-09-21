import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/ui.store.ts'
import { useTheme } from '@/features/setting/hooks/useTheme.ts'
import { useSettingEvents } from '@/features/setting/hooks/useSettings.ts'
import { useZoneEvents } from '@/features/zone/hooks/useZoneEvents.ts'
import { useFamilyEvents } from '@/features/family/hooks/useFamilyEvents.ts'
import { usePersonEvents } from '@/features/person/hooks/usePersonEvents.ts'
import { useShellShortcuts } from '@/hooks/useShellShortcuts.ts'
import { useAppErrors } from '@/hooks/useAppErrors.ts'
import { AppContent } from './AppContent.tsx'
import { AppSidebar } from './AppSidebar.tsx'
import { AppTopBar } from './AppTopBar.tsx'
import { AppStatusBar } from './AppStatusBar.tsx'
import { OverlayRoot } from './OverlayRoot.tsx'
import { CommandPalette } from '@/features/command/components/CommandPalette.tsx'
import styles from './AppShell.module.css'

export function AppShell() {
  const { pathname } = useLocation()
  const content = useRef<HTMLElement>(null)
  const collapsed = useUIStore((state) => state.isSidebarCollapsed)
  const sidebarWidth = useUIStore((state) => state.sidebarWidth)
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false)
  useTheme()
  useSettingEvents()
  useZoneEvents()
  useFamilyEvents()
  usePersonEvents()
  useAppErrors()
  useShellShortcuts({
    onCommandPalette: () => setCommandPaletteOpen(true),
  })
  useEffect(() => {
    if (content.current) content.current.scrollTop = 0
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
      {isCommandPaletteOpen && <CommandPalette onClose={() => setCommandPaletteOpen(false)} />}
    </div>
  )
}
