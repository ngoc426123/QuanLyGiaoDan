import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useZones } from '../hooks/useZones.ts'
import styles from './Zone.module.css'

export function ZoneQuickFilters() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const query = useZones({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const zones = query.data?.data ?? []

  if (query.isLoading || query.isError) return null

  return (
    <div className={styles.quickFilters} aria-label="Lọc nhanh theo giáo họ">
      {zones.length === 0 ? (
        <p className={styles.quickFilterEmpty}>Chưa có giáo họ</p>
      ) : (
        zones.map((zone: any) => (
          <Link
            key={zone.id}
            to={`/families?zoneId=${zone.id}`}
            className={styles.quickFilter}
            aria-current={
              location.pathname === '/families' && searchParams.get('zoneId') === zone.id
                ? 'page'
                : undefined
            }
          >
            {zone.name}
          </Link>
        ))
      )}
    </div>
  )
}
