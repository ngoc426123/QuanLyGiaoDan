import { forwardRef } from 'react'
import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary.jsx'
import styles from './AppShell.module.css'

export const AppContent = forwardRef(function AppContent({ pathname }, ref) {
  return (
    <main id="main-content" ref={ref} className={styles.content} tabIndex={-1}>
      <ErrorBoundary key={pathname}>
        <Outlet />
      </ErrorBoundary>
    </main>
  )
})
