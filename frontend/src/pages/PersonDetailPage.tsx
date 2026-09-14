import { useParams } from 'react-router-dom'
import { PersonDetail } from '@/features/person/components/PersonDetail.tsx'

export function PersonDetailPage() {
  const { id } = useParams()
  return <PersonDetail id={id} />
}
