import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { createQueryClient } from '@/shared/queryClient.ts'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { AppShell } from '@/components/layout/AppShell.tsx'
import { DashboardPage } from '@/pages/DashboardPage.tsx'
import { PersonListPage } from '@/pages/PersonListPage.tsx'
import { PersonDetailPage } from '@/pages/PersonDetailPage.tsx'
import {
  CreateExternalPersonPage,
  CreatePersonPage,
  EditPersonPage,
} from '@/features/person/components/PersonFormPage.tsx'
import { FamilyListPage } from '@/pages/FamilyListPage.tsx'
import { FamilyDetailPage } from '@/pages/FamilyDetailPage.tsx'
import { ZoneListPage } from '@/pages/ZoneListPage.tsx'
import { ZoneDetailPage } from '@/pages/ZoneDetailPage.tsx'
import { SearchPage } from '@/pages/SearchPage.tsx'
import { TrashPage } from '@/pages/TrashPage.tsx'
import { SettingsPage } from '@/pages/SettingsPage.tsx'
import { MarriageListPage } from '@/pages/MarriageListPage.tsx'
import { ExportPage } from '@/pages/ExportPage.tsx'
import { CertificateHistoryPage } from '@/pages/CertificateHistoryPage.tsx'
import { CertificateIssuePage } from '@/pages/CertificateIssuePage.tsx'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="persons" element={<PersonListPage />} />
        <Route path="persons/new" element={<CreatePersonPage />} />
        <Route path="persons/external/new" element={<CreateExternalPersonPage />} />
        <Route path="persons/:id/edit" element={<EditPersonPage />} />
        <Route path="persons/:id" element={<PersonDetailPage />} />
        <Route path="marriages" element={<MarriageListPage />} />
        <Route path="families" element={<FamilyListPage />} />
        <Route path="families/:id" element={<FamilyDetailPage />} />
        <Route path="zones" element={<ZoneListPage />} />
        <Route path="zones/:id" element={<ZoneDetailPage />} />
        <Route path="exports" element={<ExportPage />} />
        <Route path="certificates" element={<CertificateHistoryPage />} />
        <Route path="persons/:id/certificates/new" element={<CertificateIssuePage />} />
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
