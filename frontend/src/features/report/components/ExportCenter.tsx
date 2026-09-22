import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button.tsx'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useZones } from '@/features/zone/hooks/useZones.ts'
import { useReportExport } from '../hooks/useCsvExport.ts'
import styles from './ExportCenter.module.css'

const reports = [
  ['persons', 'Danh sách giáo dân', 'Hồ sơ giáo dân theo các điều kiện đã chọn.'],
  ['families', 'Danh sách gia đình', 'Các hộ gia đình, giáo họ và số thành viên.'],
  ['zones', 'Danh sách giáo họ', 'Số hộ, số giáo dân và thông tin từng giáo họ.'],
  ['sacraments', 'Sổ bí tích', 'Rửa tội, rước lễ lần đầu và thêm sức.'],
  ['marriages', 'Danh sách hôn phối', 'Các đôi hôn phối theo tháng cử hành.'],
  ['pastoral', 'Danh sách mục vụ', 'Lọc theo nơi cư trú và tình trạng mục vụ.'],
  ['summary', 'Báo cáo thống kê', 'Tổng hợp giáo dân, hộ, giáo họ và hôn phối.'],
  ['dataQuality', 'Hồ sơ cần bổ sung', 'Hồ sơ thiếu ngày sinh, số điện thoại hoặc chưa thuộc hộ.'],
  ['birthdays', 'Danh sách sinh nhật', 'Giáo dân còn sống có sinh nhật trong tháng.'],
  [
    'householdMembers',
    'Thành viên các hộ',
    'Danh sách thành viên để đối soát hoặc in theo giáo họ.',
  ],
] as const

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function ExportCenter() {
  const [report, setReport] = useState<(typeof reports)[number][0]>('persons')
  const [zoneId, setZoneId] = useState('')
  const [month, setMonth] = useState(currentMonth)
  const [sacramentType, setSacramentType] = useState('')
  const [residenceStatus, setResidenceStatus] = useState('')
  const [pastoralStatus, setPastoralStatus] = useState('')
  const zones = useZones({ page: 1, pageSize: 200, sortBy: 'name', sortDir: 'asc' })
  const exportCsv = useReportExport('csv')
  const exportXlsx = useReportExport('xlsx')
  const exportPdf = useReportExport('pdf')
  const selected = reports.find(([id]) => id === report)!
  const needsZone = ['persons', 'families', 'sacraments', 'pastoral', 'householdMembers'].includes(
    report,
  )
  const needsMonth = ['sacraments', 'marriages', 'birthdays'].includes(report)
  const filter = useMemo(() => {
    if (report === 'marriages' || report === 'birthdays') return { month }
    if (report === 'sacraments')
      return {
        zoneId: zoneId || undefined,
        type: sacramentType || undefined,
        month: month || undefined,
      }
    if (report === 'pastoral')
      return {
        zoneId: zoneId || undefined,
        residenceStatus: residenceStatus || undefined,
        pastoralStatus: pastoralStatus || undefined,
      }
    if (report === 'persons' || report === 'families' || report === 'householdMembers')
      return { zoneId: zoneId || undefined }
    return {}
  }, [month, pastoralStatus, report, residenceStatus, sacramentType, zoneId])

  return (
    <section className={styles.page}>
      <PageHeader
        title="Xuất file"
        description="Chuẩn bị báo cáo để mở trong Excel, in PDF hoặc lưu trữ."
      >
        <Button
          variant="primary"
          onClick={() => exportCsv.mutate({ report, filter })}
          isPending={exportCsv.isPending}
          disabled={exportCsv.isPending}
        >
          Xuất CSV
        </Button>
        <Button
          onClick={() => exportXlsx.mutate({ report, filter })}
          isPending={exportXlsx.isPending}
          disabled={exportXlsx.isPending}
        >
          Xuất Excel
        </Button>
        <Button
          onClick={() => exportPdf.mutate({ report, filter })}
          isPending={exportPdf.isPending}
          disabled={exportPdf.isPending}
        >
          Xuất PDF
        </Button>
      </PageHeader>
      {zones.isLoading && <Skeleton />}
      {zones.isError && <ErrorState error={zones.error} onRetry={zones.refetch} />}
      {!zones.isLoading && !zones.isError && (
        <div className={styles.layout}>
          <div className={styles.reportList} role="list" aria-label="Loại báo cáo">
            {reports.map(([id, title, description]) => (
              <button
                key={id}
                type="button"
                className={styles.reportButton}
                data-selected={report === id}
                onClick={() => setReport(id)}
              >
                <strong>{title}</strong>
                <span>{description}</span>
              </button>
            ))}
          </div>
          <section className={styles.settings} aria-labelledby="export-settings-title">
            <h2 id="export-settings-title">{selected[1]}</h2>
            <p>{selected[2]}</p>
            <div className={styles.filters}>
              {needsZone && (
                <Select
                  label="Giáo họ"
                  value={zoneId}
                  onChange={(event: any) => setZoneId(event.target.value)}
                >
                  <option value="">Tất cả giáo họ</option>
                  {(zones.data?.data ?? []).map((zone: any) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </Select>
              )}
              {needsMonth && (
                <Input
                  label="Tháng báo cáo"
                  type="month"
                  value={month}
                  onChange={(event: any) => setMonth(event.target.value)}
                  required={report === 'marriages' || report === 'birthdays'}
                />
              )}
              {report === 'sacraments' && (
                <Select
                  label="Loại bí tích"
                  value={sacramentType}
                  onChange={(event: any) => setSacramentType(event.target.value)}
                >
                  <option value="">Tất cả bí tích</option>
                  <option value="baptism">Rửa tội</option>
                  <option value="first_communion">Rước lễ lần đầu</option>
                  <option value="confirmation">Thêm sức</option>
                </Select>
              )}
              {report === 'pastoral' && (
                <>
                  <Select
                    label="Tình trạng cư trú"
                    value={residenceStatus}
                    onChange={(event: any) => setResidenceStatus(event.target.value)}
                  >
                    <option value="">Tất cả</option>
                    <option value="permanent">Thường trú</option>
                    <option value="temporary">Tạm trú</option>
                    <option value="moved_away">Đã chuyển đi</option>
                  </Select>
                  <Select
                    label="Tình trạng mục vụ"
                    value={pastoralStatus}
                    onChange={(event: any) => setPastoralStatus(event.target.value)}
                  >
                    <option value="">Tất cả</option>
                    <option value="ordinary">Bình thường</option>
                    <option value="catechism">Học giáo lý</option>
                    <option value="catechist">Giáo lý viên</option>
                    <option value="needs_visit">Cần thăm viếng</option>
                  </Select>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
