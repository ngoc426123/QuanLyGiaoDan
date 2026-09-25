import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useFamilies } from '@/features/family/hooks/useFamilies.ts'
import { useToastStore } from '@/stores/toast.store.ts'
import { useCreatePerson, useUpdatePerson } from '../hooks/usePersonMutations.ts'
import { usePerson, usePersons } from '../hooks/usePersons.ts'
import { PersonForm } from './PersonForm.tsx'
import { personName } from '../personName.ts'
import styles from './Person.module.css'

export function CreatePersonPage() {
  return <CreatePersonScreen personType="parish" />
}

export function CreateExternalPersonPage() {
  return <CreatePersonScreen personType="external" />
}

function CreatePersonScreen({ personType }: { personType: 'parish' | 'external' }) {
  const navigate = useNavigate()
  const addToast = useToastStore((state) => state.add)
  const families = useFamilies({ page: 1, pageSize: 50, sortBy: 'name', sortDir: 'asc' })
  const people = usePersons({
    page: 1,
    pageSize: 200,
    sortBy: 'fullName',
    sortDir: 'asc',
    personType: 'all',
  })
  const create = useCreatePerson()
  if (families.isPending || people.isPending) return <Skeleton />
  if (families.isError) return <ErrorState error={families.error} onRetry={families.refetch} />
  return (
    <section className={styles.formPage}>
      <Link to={personType === 'external' ? '/persons?type=external' : '/persons'}>Về danh bạ</Link>
      <PageHeader
        title={personType === 'external' ? 'Thêm người ngoài xứ' : 'Thêm giáo dân'}
        description={
          personType === 'external'
            ? 'Tạo hồ sơ dùng chung cho hôn phối và liên kết cha mẹ.'
            : 'Tạo hồ sơ mới và có thể gán vào hộ ngay.'
        }
      />
      <PersonForm
        personType={personType}
        families={families.data?.data ?? []}
        people={people.data?.data ?? []}
        allowFamilyAssignment={personType === 'parish'}
        submitLabel={personType === 'external' ? 'Tạo người ngoài xứ' : 'Tạo giáo dân'}
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
  const people = usePersons({
    page: 1,
    pageSize: 200,
    sortBy: 'fullName',
    sortDir: 'asc',
    personType: 'all',
  })
  const update = useUpdatePerson()
  if (person.isPending || people.isPending) return <Skeleton />
  if (person.isError) return <ErrorState error={person.error} onRetry={person.refetch} />
  if (!person.data) return null
  return (
    <section className={styles.formPage}>
      <Link to={`/persons/${id}`}>Về hồ sơ</Link>
      <PageHeader
        title={person.data.personType === 'external' ? 'Sửa người ngoài xứ' : 'Sửa giáo dân'}
        description={personName(person.data)}
      />
      <PersonForm
        initialValue={person.data}
        personType={person.data.personType}
        families={[]}
        people={(people.data?.data ?? []).filter(
          (candidate: any) => candidate.id !== person.data.id,
        )}
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
