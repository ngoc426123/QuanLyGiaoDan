import { useParams } from 'react-router-dom'
import { FamilyDetail } from '@/features/family/components/FamilyDetail.tsx'

export function FamilyDetailPage() {
  const { id } = useParams()
  return <FamilyDetail id={id} />
}
