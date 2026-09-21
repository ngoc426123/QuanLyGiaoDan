import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useFamilies } from '@/features/family/hooks/useFamilies.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { useCreatePerson, useUpdatePerson } from '../hooks/usePersonMutations.ts'
import { usePerson } from '../hooks/usePersons.ts'
import { PersonForm } from './PersonForm.tsx'
import styles from './Person.module.css'

export function CreatePersonPage() {
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.add)
  const families = useFamilies({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const create = useCreatePerson()
  if (families.isPending) return <Skeleton />
  if (families.isError) return <ErrorState error={families.error} onRetry={families.refetch} />
  return (
    <section className={styles.formPage}>
      <Link to="/persons">Về danh sách giáo dân</Link>
      <PageHeader title="Thêm giáo dân" description="Tạo hồ sơ mới và có thể gán vào hộ ngay." />
      <PersonForm
        families={families.data?.data ?? []}
        allowFamilyAssignment
        submitLabel="Tạo giáo dân"
        isPending={create.isPending}
        onSubmit={async (input: any) => {
          const result = await create.mutateAsync(input)
          result.meta?.warnings?.forEach((warning: string) => addToast(warning))
          navigate(`/persons/${result.data.id}`, { replace: true })
          return result
        }}
      />
    </section>
  )
}

export function EditPersonPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.add)
  const person = usePerson(id)
  const update = useUpdatePerson()
  if (person.isPending) return <Skeleton />
  if (person.isError) return <ErrorState error={person.error} onRetry={person.refetch} />
  if (!person.data) return null
  return (
    <section className={styles.formPage}>
      <Link to={`/persons/${id}`}>Về hồ sơ giáo dân</Link>
      <PageHeader title="Sửa giáo dân" description={person.data.fullName} />
      <PersonForm
        initialValue={person.data}
        families={[]}
        submitLabel="Lưu thay đổi"
        isPending={update.isPending}
        onSubmit={async (patch: any) => {
          const result = await update.mutateAsync({
            id: person.data.id,
            expectedUpdatedAt: person.data.updatedAt,
            patch,
          })
          result.meta?.warnings?.forEach((warning: string) => addToast(warning))
          navigate(`/persons/${person.data.id}`, { replace: true })
          return result
        }}
      />
    </section>
  )
}
