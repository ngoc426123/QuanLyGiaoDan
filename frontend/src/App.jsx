import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { createQueryClient } from '@/shared/queryClient.js'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { AppShell } from '@/components/layout/AppShell.jsx'
import { DashboardPage } from '@/pages/DashboardPage.jsx'
import { PersonListPage } from '@/pages/PersonListPage.jsx'
import { PersonDetailPage } from '@/pages/PersonDetailPage.jsx'
import { FamilyListPage } from '@/pages/FamilyListPage.jsx'
import { FamilyDetailPage } from '@/pages/FamilyDetailPage.jsx'
import { ZoneListPage } from '@/pages/ZoneListPage.jsx'
import { ZoneDetailPage } from '@/pages/ZoneDetailPage.jsx'
import { SearchPage } from '@/pages/SearchPage.jsx'
import { TrashPage } from '@/pages/TrashPage.jsx'
import { SettingsPage } from '@/pages/SettingsPage.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="persons" element={<PersonListPage />} />
        <Route path="persons/:id" element={<PersonDetailPage />} />
        <Route path="families" element={<FamilyListPage />} />
        <Route path="families/:id" element={<FamilyDetailPage />} />
        <Route path="zones" element={<ZoneListPage />} />
        <Route path="zones/:id" element={<ZoneDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={
            <EmptyState title="Không tìm thấy trang">
              Chọn một mục trên thanh bên để tiếp tục.
            </EmptyState>
          }
        />
      </Route>
    </Routes>
  )
}

export function App() {
  const [client] = useState(createQueryClient)
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
