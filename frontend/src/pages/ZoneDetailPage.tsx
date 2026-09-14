import { useParams } from 'react-router-dom'
import { ZoneDetail } from '@/features/zone/components/ZoneDetail.tsx'

export function ZoneDetailPage() {
  const { id } = useParams()
  return <ZoneDetail id={id} />
}
