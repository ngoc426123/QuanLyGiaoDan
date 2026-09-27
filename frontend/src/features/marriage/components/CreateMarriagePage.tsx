import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { PageHeader } from '@/components/ui/PageHeader.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { invokeWithMeta } from '@/shared/invoke.ts'
import { MarriageForm, marriageApi, toMarriagePayload } from './MarriageList.tsx'
import styles from './Marriage.module.css'

export function CreateMarriagePage() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const [personSearch, setPersonSearch] = useState('')
  const persons = useQuery({
    queryKey: ['person', 'marriage-options', personSearch],
    queryFn: () =>
      invokeWithMeta(
        window.api.person.list({
          page: 1,
          pageSize: 200,
          search: personSearch || undefined,
          sortBy: 'fullName',
          sortDir: 'asc',
        }),
      ),
  })
  const create = useMutation({
    mutationFn: marriageApi.create,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['marriage'] })
      client.invalidateQueries({ queryKey: ['person'] })
    },
  })

  if (persons.isPending) return <Skeleton />
  if (persons.isError) return <ErrorState error={persons.error} onRetry={persons.refetch} />

  return (
    <section className={styles.formPage}>
      <Link to="/marriages">Về danh sách hôn phối</Link>
      <PageHeader
        title="Thêm hôn phối"
        description="Ghi nhận đương sự, thông tin người phối ngẫu và nghi thức cử hành."
      />
      <MarriageForm
        persons={persons.data?.data ?? []}
        onPersonSearchChange={setPersonSearch}
        personsLoading={persons.isFetching}
        isPending={create.isPending}
        submitLabel="Lưu hôn phối"
        onSubmit={async (input: any) => {
          await create.mutateAsync(toMarriagePayload(input))
          navigate('/marriages', { replace: true })
        }}
      />
    </section>
  )
}
